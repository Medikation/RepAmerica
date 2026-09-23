import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { trackingUrl } from "@/lib/email";
import { markShipped, reopenOrder, saveNotes } from "@/app/admin/actions";
import CopyButton from "@/components/admin/CopyButton";

export const dynamic = "force-dynamic";

type Line = { description: string | null; quantity: number | null; amount_total?: number };
type Order = {
  id: number;
  created_at: string;
  email: string | null;
  name: string | null;
  amount_cents: number | null;
  currency: string | null;
  status: "paid" | "fulfilled" | "refunded" | "canceled" | null;
  shipping: { name?: string | null; address?: Record<string, string | null> | null } | null;
  line_items: Line[] | null;
  fulfilled_at: string | null;
  tracking: string | null;
  notes: string | null;
  payment_intent: string | null;
};

const money = (c: number | null) => `$${((c ?? 0) / 100).toFixed(2)}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

function addressText(o: Order) {
  const a = o.shipping?.address;
  const lines = [o.shipping?.name ?? o.name ?? "", a?.line1, a?.line2, a ? `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`.trim() : null, a?.country && a.country !== "US" ? a.country : null];
  return lines.filter((l): l is string => !!l && l.trim() !== "").join("\n");
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/orders")}` : "/admin/login?next=/admin/orders");

  const view = sp.view === "all" ? "all" : "open";
  let q = supabaseAdmin().from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (view === "open") q = q.eq("status", "paid");
  const { data, error } = await q;
  const orders = (data ?? []) as Order[];

  const flash =
    sp.shipped ? `Order #${sp.shipped} marked shipped${sp.emailed === "1" ? " and the customer was e-mailed" : sp.emailed === "skipped" ? " (customer e-mail skipped — RESEND_API_KEY not set)" : sp.emailed === "failed" ? " (customer e-mail FAILED — check logs)" : ""}.` :
    sp.saved ? `Notes saved for order #${sp.saved}.` :
    sp.error ? `Something went wrong (${sp.error}).` : null;

  return (
    <div>
      <h1>Orders</h1>
      <div className="tabs">
        <Link href="/admin/orders" aria-current={view === "open" ? "page" : undefined}>To ship</Link>
        <Link href="/admin/orders?view=all" aria-current={view === "all" ? "page" : undefined}>All orders</Link>
      </div>
      {flash ? <div className={`notice${sp.error || sp.emailed === "failed" ? " notice--error" : ""}`}>{flash}</div> : null}
      {error ? <div className="notice notice--error">Could not load orders: {error.message}</div> : null}
      {orders.length === 0 ? <p className="muted">{view === "open" ? "Nothing to ship — all caught up." : "No orders yet."}</p> : null}
      {orders.length > 0 ? (
        <div className="cards">
          {orders.map((o) => {
            const addr = addressText(o);
            const items = (o.line_items ?? []).map((li) => `${li.quantity ?? 1}× ${li.description ?? "item"}`).join(", ");
            const status = o.status ?? "paid";
            const turl = o.tracking ? trackingUrl(o.tracking) : null;
            return (
              <article key={o.id} className={`card${status !== "paid" ? " card--done" : ""}`}>
                <div className="stack">
                  <div className="card__head">
                    <div>
                      <div className="card__id">Order #{o.id}</div>
                      <div className="muted">{when(o.created_at)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="card__total">{money(o.amount_cents)}</div>
                      <span className={`pill pill--${status}`}>{status === "paid" ? "To ship" : status}</span>
                    </div>
                  </div>
                  <div>
                    <h3>Items</h3>
                    <div className="items">{items || <span className="muted">—</span>}</div>
                  </div>
                  <div className="row">
                    {o.payment_intent ? <a className="btn btn--ghost btn--sm" href={`https://dashboard.stripe.com/payments/${o.payment_intent}`} target="_blank" rel="noreferrer">Open in Stripe ↗</a> : null}
                    {o.email ? <a className="btn btn--ghost btn--sm" href={`mailto:${o.email}`}>E-mail customer</a> : null}
                  </div>
                </div>

                <div className="stack">
                  <div>
                    <h3>Ship to</h3>
                    <div className="addr">{addr || <span className="muted">(no address)</span>}</div>
                    {o.email ? <div className="muted">{o.email}</div> : null}
                  </div>
                  {addr ? <div><CopyButton text={addr} /></div> : null}
                  {o.fulfilled_at ? <div className="muted">Shipped {when(o.fulfilled_at)}</div> : null}
                  {o.tracking ? <div className="muted">Tracking: {turl ? <a href={turl} target="_blank" rel="noreferrer">{o.tracking}</a> : o.tracking}</div> : null}
                </div>

                <div className="stack">
                  {status === "paid" ? (
                    <form action={markShipped} className="stack">
                      <h3>Ship it</h3>
                      <input type="hidden" name="id" value={o.id} />
                      <input type="text" name="tracking" placeholder="Tracking number" autoComplete="off" inputMode="text" />
                      <label className="muted" style={{ display: "block" }}>
                        <input type="checkbox" name="notify" defaultChecked={!!o.email} /> E-mail the customer a shipping notice
                      </label>
                      <button className="btn" type="submit">Mark shipped</button>
                    </form>
                  ) : status === "fulfilled" ? (
                    <form action={reopenOrder}>
                      <input type="hidden" name="id" value={o.id} />
                      <button className="btn btn--ghost btn--sm" type="submit">Reopen order</button>
                    </form>
                  ) : null}
                  <form action={saveNotes} className="stack">
                    <h3>Notes</h3>
                    <input type="hidden" name="id" value={o.id} />
                    <input type="hidden" name="view" value={view} />
                    <textarea name="notes" rows={2} placeholder="Internal notes" defaultValue={o.notes ?? ""} />
                    <button className="btn btn--ghost btn--sm" type="submit">Save notes</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
