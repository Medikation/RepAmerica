// Website-checkout entry point for Meta Shops (Instagram + Facebook) and any other channel that can only link out.
// Meta calls it as  /checkout?products=ra-1:2,ra-4:1&coupon=CODE  (feed item ids from /feeds/meta.csv, ":" = quantity).
// Builds ONE Stripe Checkout Session with all line items (same price_data/metadata shape as /api/checkout so
// /api/stripe-webhook records the order unchanged) and 303-redirects the shopper to Stripe.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import type { Product, Variant } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
const SHIPPING_FLAT_CENTS = Number.isFinite(Number(process.env.SHIPPING_FLAT_CENTS)) ? Math.max(0, Math.floor(Number(process.env.SHIPPING_FLAT_CENTS))) : 500;

type VariantRow = Variant & { product: Pick<Product, "id" | "handle" | "title" | "images" | "is_published"> | null };

/** "ra-1:2,ra-4" | "1:2" → [{ variantId, quantity }] (ids are feed ids "ra-<variant id>" or bare variant ids). */
function parseProducts(raw: string | null): { variantId: number; quantity: number }[] {
  if (!raw) return [];
  const out = new Map<number, number>();
  for (const part of raw.split(",")) {
    const [idPart, qtyPart] = part.trim().split(":");
    const id = Number((idPart ?? "").replace(/^ra-/i, ""));
    const qty = Math.min(99, Math.max(1, Math.floor(Number(qtyPart) || 1)));
    if (Number.isInteger(id) && id > 0) out.set(id, Math.min(99, (out.get(id) ?? 0) + qty));
  }
  return [...out].map(([variantId, quantity]) => ({ variantId, quantity }));
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function interstitial(stripeUrl: string, items: Stripe.Checkout.SessionCreateParams.LineItem[]) {
  const rows = items.map((li) => `<li>${li.quantity}× ${esc(li.price_data?.product_data?.name ?? "item")}</li>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Checkout — Rep America</title>
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=${esc(stripeUrl)}">
<style>body{font-family:Georgia,serif;background:#faf8f4;color:#111;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}
main{max-width:420px;padding:32px;text-align:center}h1{font-size:22px;font-weight:600;margin:0 0 8px}p{color:#555;margin:0 0 20px}
ul{list-style:none;padding:0;margin:0 0 24px;color:#333}li{padding:4px 0}
a.btn{display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 22px;border-radius:4px;font-family:system-ui,sans-serif;font-size:15px}</style></head>
<body><main><h1>Taking you to secure checkout…</h1><p>Rep America · payments by Stripe</p><ul>${rows}</ul>
<a class="btn" href="${esc(stripeUrl)}">Continue to checkout</a></main>
<script>location.replace(${JSON.stringify(stripeUrl)})</script></body></html>`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const shopUrl = `${SITE}/pages/shop`;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.redirect(shopUrl, 303);

  const wanted = parseProducts(url.searchParams.get("products"));
  if (wanted.length === 0) return NextResponse.redirect(shopUrl, 303);

  const { data, error } = await supabase
    .from("product_variants")
    .select("*, product:products(id, handle, title, images, is_published)")
    .in("id", wanted.map((w) => w.variantId));
  if (error) return NextResponse.redirect(shopUrl, 303);
  const rows = (data ?? []) as VariantRow[];

  const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const w of wanted) {
    const v = rows.find((r) => r.id === w.variantId);
    if (!v || !v.product || !v.product.is_published || !v.available) continue;
    const isDefault = !v.title || v.title === "Default Title";
    const image = v.image_src ?? [...(v.product.images ?? [])].sort((a, b) => a.position - b.position)[0]?.src;
    line_items.push({
      quantity: w.quantity,
      price_data: {
        currency: "usd",
        unit_amount: v.price_cents,
        product_data: {
          name: isDefault ? v.product.title : `${v.product.title} - ${v.title}`,
          ...(image ? { images: [image] } : {}),
          metadata: { variant_id: String(v.id), product_id: String(v.product.id), product_handle: v.product.handle, sku: v.sku ?? "" },
        },
      },
    });
  }
  if (line_items.length === 0) return NextResponse.redirect(shopUrl, 303);

  // Coupon: only honoured if a Stripe promotion code with that exact code exists and is active.
  const coupon = (url.searchParams.get("coupon") ?? "").trim();
  const stripe = new Stripe(key);
  let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
  if (coupon) {
    try {
      const promo = await stripe.promotionCodes.list({ code: coupon, active: true, limit: 1 });
      if (promo.data[0]) discounts = [{ promotion_code: promo.data[0].id }];
    } catch (e) {
      console.warn("[checkout] coupon lookup failed", e);
    }
  }

  const first = rows.find((r) => r.id === wanted[0].variantId);
  const cancelUrl = first?.product ? `${SITE}/products/${first.product.handle}` : shopUrl;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      ...(discounts ? { discounts } : { allow_promotion_codes: true }),
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: SHIPPING_FLAT_CENTS === 0 ? "Free shipping" : "Flat rate shipping (USPS)",
            fixed_amount: { amount: SHIPPING_FLAT_CENTS, currency: "usd" },
            delivery_estimate: { minimum: { unit: "business_day", value: 3 }, maximum: { unit: "business_day", value: 7 } },
          },
        },
      ],
      phone_number_collection: { enabled: false },
      success_url: `${SITE}/pages/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      metadata: { source: "meta_shop", products: url.searchParams.get("products") ?? "", ...(coupon ? { coupon } : {}) },
    });
    if (!session.url) return NextResponse.redirect(shopUrl, 303);
    // Serve a real page on our domain (Meta's checkout checker needs a 200 it can load) that forwards to Stripe instantly.
    return new Response(interstitial(session.url, line_items), { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  } catch (e) {
    console.error("[checkout] session", e);
    return NextResponse.redirect(shopUrl, 303);
  }
}
