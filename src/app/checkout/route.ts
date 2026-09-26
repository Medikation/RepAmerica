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
    return NextResponse.redirect(session.url, 303);
  } catch (e) {
    console.error("[checkout] session", e);
    return NextResponse.redirect(shopUrl, 303);
  }
}
