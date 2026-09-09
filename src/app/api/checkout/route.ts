// Replaces Shopify's /cart/add + checkout: one variant → one Stripe Checkout Session (mode=payment, price_data inline —
// no Stripe Products/Prices are created). Orders are recorded by /api/stripe-webhook.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabase } from "@/lib/supabase";
import type { Product, Variant } from "@/lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return NextResponse.json({ error: "Checkout is not configured yet" }, { status: 503 });

  let body: { variantId?: unknown; quantity?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const variantId = Number(body.variantId);
  const quantity = Math.min(99, Math.max(1, Math.floor(Number(body.quantity) || 1)));
  if (!Number.isInteger(variantId) || variantId <= 0) return NextResponse.json({ error: "Invalid variant" }, { status: 400 });

  const { data, error } = await supabase
    .from("product_variants")
    .select("*, product:products(id, handle, title, images, is_published)")
    .eq("id", variantId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Could not load product" }, { status: 500 });
  const variant = data as (Variant & { product: Pick<Product, "id" | "handle" | "title" | "images" | "is_published"> | null }) | null;
  if (!variant || !variant.product || !variant.product.is_published) return NextResponse.json({ error: "Unavailable" }, { status: 404 });
  if (!variant.available) return NextResponse.json({ error: "Sold out" }, { status: 409 });

  const product = variant.product;
  // Send the buyer back to whichever host they checked out from (the Vercel preview before cutover, repamerica.com after).
  const origin = (() => { const o = req.headers.get("origin") ?? (req.headers.get("referer") ? new URL(req.headers.get("referer")!).origin : null); return o && /^https:\/\/(repamerica\.com|www\.repamerica\.com|[a-z0-9-]+\.vercel\.app)$/.test(o) ? o : SITE; })();
  const productUrl = `${origin}/products/${product.handle}`;
  const isDefault = !variant.title || variant.title === "Default Title";
  const name = isDefault ? product.title : `${product.title} - ${variant.title}`;
  const image = variant.image_src ?? [...(product.images ?? [])].sort((a, b) => a.position - b.position)[0]?.src;

  const stripe = new Stripe(key);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity,
          price_data: {
            currency: "usd",
            unit_amount: variant.price_cents,
            product_data: {
              name,
              ...(image ? { images: [image] } : {}),
              metadata: { variant_id: String(variant.id), product_id: String(product.id), product_handle: product.handle, sku: variant.sku ?? "" },
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      phone_number_collection: { enabled: false },
      success_url: `${origin}/pages/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: productUrl,
      metadata: { variant_id: String(variant.id), product_id: String(product.id), product_handle: product.handle, quantity: String(quantity) },
    });
    if (!session.url) return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout]", e);
    return NextResponse.json({ error: "Could not start checkout" }, { status: 500 });
  }
}
