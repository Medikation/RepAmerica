// Stripe Checkout success_url. There is no Liquid for this page (Shopify's checkout rendered it), so it borrows the
// main-page.liquid wrapper and the customer/order strings from locales/en.default.json. Dynamic: reads ?session_id.
import type { Metadata } from "next";
import Stripe from "stripe";
import { buildMetadata } from "@/lib/seo";
import { moneyWithCurrency } from "@/components/product/Price";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await buildMetadata({ title: "Thank you", path: "/pages/thank-you" })), robots: { index: false, follow: false } };
}

type Line = { description: string | null; quantity: number | null; amount_total: number };

async function loadSession(sessionId: string | undefined) {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !sessionId || !/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return null;
  try {
    const stripe = new Stripe(key);
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["line_items"] });
    if (session.status !== "complete" && session.payment_status !== "paid") return null;
    const s = session as unknown as {
      shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null;
      collected_information?: { shipping_details?: { name?: string | null; address?: Stripe.Address | null } | null } | null;
    };
    const shipping = s.collected_information?.shipping_details ?? s.shipping_details ?? null;
    return {
      id: session.id,
      email: session.customer_details?.email ?? null,
      name: shipping?.name ?? session.customer_details?.name ?? null,
      address: shipping?.address ?? null,
      total: session.amount_total ?? 0,
      subtotal: session.amount_subtotal ?? 0,
      shippingCost: session.total_details?.amount_shipping ?? 0,
      tax: session.total_details?.amount_tax ?? 0,
      lines: (session.line_items?.data ?? []).map((li): Line => ({ description: li.description, quantity: li.quantity, amount_total: li.amount_total })),
    };
  } catch {
    return null;
  }
}

export default async function ThankYouPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const order = await loadSession(session_id);
  const sectionId = "template--page-thank-you__main";

  return (
    <section id={`shopify-section-${sectionId}`} className="shopify-section section">
      <style>{`.section-${sectionId}-padding { padding-top: 27px; padding-bottom: 27px; }
  @media screen and (min-width: 750px) { .section-${sectionId}-padding { padding-top: 36px; padding-bottom: 36px; } }`}</style>
      <div className={`page-width page-width--narrow section-${sectionId}-padding`}>
        <h1 className="main-page-title page-title h0">Thank you</h1>
        <div className="rte">
          {order ? (
            <>
              <p>
                Your order is confirmed.
                {order.email ? <> A receipt has been sent to {order.email}.</> : null}
              </p>
              <h2 className="h4">Order {order.id.slice(-8).toUpperCase()}</h2>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((li, i) => (
                    <tr key={i}>
                      <td>{li.description}</td>
                      <td>{li.quantity}</td>
                      <td>{moneyWithCurrency(li.amount_total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2}>Subtotal</td>
                    <td>{moneyWithCurrency(order.subtotal)}</td>
                  </tr>
                  {order.shippingCost > 0 && (
                    <tr>
                      <td colSpan={2}>Shipping</td>
                      <td>{moneyWithCurrency(order.shippingCost)}</td>
                    </tr>
                  )}
                  {order.tax > 0 && (
                    <tr>
                      <td colSpan={2}>Tax</td>
                      <td>{moneyWithCurrency(order.tax)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={2}>
                      <strong>Total</strong>
                    </td>
                    <td>
                      <strong>{moneyWithCurrency(order.total)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
              {order.address && (
                <>
                  <h2 className="h4">Shipping Address</h2>
                  <p>
                    {order.name}
                    <br />
                    {order.address.line1}
                    {order.address.line2 ? <><br />{order.address.line2}</> : null}
                    <br />
                    {[order.address.city, order.address.state, order.address.postal_code].filter(Boolean).join(", ")}
                    <br />
                    {order.address.country}
                  </p>
                </>
              )}
            </>
          ) : (
            <p>Your order is confirmed. A receipt has been sent to your email.</p>
          )}
          <p>
            <a href="/collections/all" className="link underlined-link">Continue shopping</a>
          </p>
        </div>
      </div>
    </section>
  );
}
