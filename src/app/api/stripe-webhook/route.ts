// Stripe → Supabase: on checkout.session.completed, record the order in `orders` (fulfilment is manual).
// Stripe Dashboard: Developers → Webhooks → add endpoint https://repamerica.com/api/stripe-webhook, event checkout.session.completed.
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const key = process.env.STRIPE_SECRET_KEY;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !secret) return NextResponse.json({ error: "Webhook is not configured" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  const stripe = new Stripe(key);
  let event: Stripe.Event;
  try {
    // Raw body is required for signature verification.
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (e) {
    console.error("[stripe-webhook] signature verification failed", e);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") return NextResponse.json({ received: true, ignored: event.type });

  const session = event.data.object;
  const db = supabaseAdmin();

  // Idempotent on stripe_session_id (Stripe retries deliveries).
  const { data: existing } = await db.from("orders").select("id").eq("stripe_session_id", session.id).maybeSingle();
  if (existing) return NextResponse.json({ received: true, duplicate: true });

  let lineItems: { description: string | null; quantity: number | null; amount_total: number; currency: string; variant_id?: string; product_handle?: string }[] = [];
  try {
    const items = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ["data.price.product"] });
    lineItems = items.data.map((li) => {
      const prod = li.price?.product;
      const meta = prod && typeof prod !== "string" && !("deleted" in prod && prod.deleted) ? (prod as Stripe.Product).metadata : undefined;
      return {
        description: li.description,
        quantity: li.quantity,
        amount_total: li.amount_total,
        currency: li.currency,
        variant_id: meta?.variant_id,
        product_handle: meta?.product_handle,
      };
    });
  } catch (e) {
    console.error("[stripe-webhook] listLineItems failed", e);
  }

  const details = session.customer_details;
  // Stripe moved the shipping address between `shipping_details` and `collected_information.shipping_details` across API versions.
  const s = session as unknown as {
    shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
    collected_information?: { shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null } | null;
  };
  const shipping = s.collected_information?.shipping_details ?? s.shipping_details ?? null;

  const row = {
    stripe_session_id: session.id,
    payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : (session.payment_intent?.id ?? null),
    email: details?.email ?? session.customer_email ?? null,
    name: shipping?.name ?? details?.name ?? null,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
    shipping: shipping ? { name: shipping.name ?? null, address: shipping.address ?? null } : null,
    line_items: lineItems,
  };

  const { error } = await db.from("orders").insert(row);
  if (error) {
    // Unique violation on stripe_session_id = concurrent duplicate delivery; anything else should make Stripe retry.
    if (error.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("[stripe-webhook] insert failed", error);
    return NextResponse.json({ error: "Could not record order" }, { status: 500 });
  }
  await notifyNewOrder(row);
  return NextResponse.json({ received: true });
}

// Push a new-order alert to the team via ntfy (phone app) and, through ntfy's e-mail relay, to the team inbox.
// Never fails the webhook — Stripe must still get a 200 once the order is stored.
async function notifyNewOrder(row: {
  email: string | null;
  name: string | null;
  amount_cents: number;
  currency: string;
  shipping: { name: string | null; address: Stripe.Address | null } | null;
  line_items: { description: string | null; quantity: number | null }[];
}) {
  const topic = process.env.NTFY_TOPIC || "repamerica-orders-a6c7d9d2";
  const alertEmail = process.env.ORDER_ALERT_EMAIL || "team@repamerica.com";
  const items = row.line_items.map((li) => `${li.quantity ?? 1}× ${li.description ?? "item"}`).join(", ") || "order";
  const total = `$${(row.amount_cents / 100).toFixed(2)} ${row.currency.toUpperCase()}`;
  const a = row.shipping?.address;
  const where = a ? [a.line1, a.line2, `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`.trim(), a.country].filter(Boolean).join("\n") : "(no shipping address)";
  const body = `${items}\nTotal: ${total}\n\nShip to:\n${row.name ?? ""}\n${where}\n${row.email ?? ""}\n\nOrders table: https://supabase.com/dashboard/project/udeivbgtpfccbtstvsxa/editor`;
  // ntfy.sh only relays e-mail for authenticated accounts: set NTFY_TOKEN (ntfy.sh → Account → Access tokens) to enable it.
  const token = process.env.NTFY_TOKEN;
  const headers: Record<string, string> = {
    Title: `New Rep America order — ${items} (${total})`,
    Priority: "high",
    Tags: "tada,package",
    Click: "https://dashboard.stripe.com/payments",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.Email = alertEmail;
  }
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error("[stripe-webhook] ntfy notification failed", e);
  }
}
