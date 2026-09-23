// Transactional e-mail through Resend's REST API (same mechanism as /api/contact). No-op with a console warning when
// RESEND_API_KEY is unset, so checkout/fulfilment never block on e-mail.
// Brand: Cormorant display + Inter body, ink #121212, Rep America red #dd0000, white paper — mirrors the site theme.
const FROM = process.env.ORDER_FROM_EMAIL ?? process.env.CONTACT_FROM_EMAIL ?? "Rep America <orders@repamerica.com>";
const REPLY_TO = "team@repamerica.com";
const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
const LOGO = "https://udeivbgtpfccbtstvsxa.supabase.co/storage/v1/object/public/media/files/rep-america-logo-horizontal.png";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export async function sendEmail(opts: { to: string; subject: string; text: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set — skipped:", opts.subject, "→", opts.to);
    return { ok: false as const, skipped: true as const };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [opts.to], reply_to: REPLY_TO, subject: opts.subject, text: opts.text, html: opts.html }),
  });
  if (!res.ok) {
    console.error("[email] resend error", res.status, await res.text().catch(() => ""));
    return { ok: false as const, skipped: false as const };
  }
  return { ok: true as const, skipped: false as const };
}

/** Best-effort carrier tracking URL from the number alone. */
export function trackingUrl(tracking: string): string | null {
  const t = tracking.replace(/\s+/g, "");
  if (/^1Z[0-9A-Z]{16}$/i.test(t)) return `https://www.ups.com/track?tracknum=${t}`;
  if (/^(9[2-5]\d{20,25}|\d{20,22})$/.test(t)) return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${t}`;
  if (/^\d{12}$|^\d{15}$/.test(t)) return `https://www.fedex.com/fedextrack/?trknbr=${t}`;
  return null;
}

export type EmailLine = { description: string | null; quantity: number | null; amount_total?: number | null };
export type EmailOrder = {
  label: string; // "#1020"
  name: string | null;
  email: string | null;
  address: string; // multi-line
  lines: EmailLine[];
  amount_cents: number;
  shipping_cents?: number | null;
  tracking?: string | null;
};

const firstName = (name: string | null) => (name ?? "").trim().split(/\s+/)[0] || "there";
const itemsText = (lines: EmailLine[]) => lines.map((li) => `${li.quantity ?? 1}× ${li.description ?? "item"}`).join(", ") || "your order";

/** Shared branded shell: logo, serif headline, body, footer with the red rule and tagline. Table-based for e-mail clients. */
function layout(opts: { kicker: string; title: string; bodyHtml: string; preheader: string }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f3f3f3;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f3f3;padding:32px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e6e6e6;">
  <tr><td align="center" style="padding:32px 32px 20px;border-bottom:1px solid #eeeeee;">
    <a href="${SITE}" style="text-decoration:none;"><img src="${LOGO}" width="220" alt="Rep America" style="display:block;width:220px;max-width:100%;height:auto;border:0;"></a>
  </td></tr>
  <tr><td style="padding:36px 32px 8px;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#121212;opacity:.7;">${esc(opts.kicker)}</div>
    <h1 style="margin:10px 0 0;font-family:Cormorant,'Cormorant Garamond',Georgia,'Times New Roman',serif;font-weight:500;font-size:34px;line-height:1.15;color:#121212;">${esc(opts.title)}</h1>
  </td></tr>
  <tr><td style="padding:16px 32px 36px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#121212;">
    ${opts.bodyHtml}
  </td></tr>
  <tr><td align="center" style="padding:28px 32px 36px;border-top:1px solid #eeeeee;font-family:Inter,Helvetica,Arial,sans-serif;">
    <div style="font-family:Cormorant,'Cormorant Garamond',Georgia,serif;font-size:22px;color:#121212;">America. Ideas. Discussion.</div>
    <div style="font-family:Cormorant,'Cormorant Garamond',Georgia,serif;font-size:16px;color:#555555;margin-top:4px;">Building Stronger Americans.</div>
    <div style="width:56px;height:2px;background:#dd0000;margin:16px auto;"></div>
    <div style="font-size:12px;line-height:1.7;color:#777777;">Questions? Reply to this e-mail or write to <a href="mailto:team@repamerica.com" style="color:#777777;">team@repamerica.com</a>.<br>
    <a href="${SITE}" style="color:#777777;">repamerica.com</a> &nbsp;·&nbsp; © ${new Date().getFullYear()} Rep America</div>
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function itemsTable(o: EmailOrder) {
  const rows = o.lines.map((li) => `<tr>
    <td style="padding:10px 0;border-bottom:1px solid #eeeeee;font-size:15px;color:#121212;">${esc(li.description ?? "Item")}<span style="color:#777777;"> × ${li.quantity ?? 1}</span></td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid #eeeeee;font-size:15px;color:#121212;white-space:nowrap;">${li.amount_total != null ? money(li.amount_total) : ""}</td>
  </tr>`).join("");
  const sub = o.lines.reduce((s, li) => s + (li.amount_total ?? 0), 0);
  const ship = o.shipping_cents ?? Math.max(0, o.amount_cents - sub);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">${rows}
    <tr><td style="padding:10px 0 2px;font-size:14px;color:#777777;">Shipping</td><td align="right" style="padding:10px 0 2px;font-size:14px;color:#777777;">${ship === 0 ? "Free" : money(ship)}</td></tr>
    <tr><td style="padding:6px 0 0;font-size:16px;font-weight:600;color:#121212;">Total</td><td align="right" style="padding:6px 0 0;font-size:16px;font-weight:600;color:#121212;">${money(o.amount_cents)}</td></tr>
  </table>`;
}

const addressBlock = (title: string, addr: string) => `<div style="margin-top:22px;"><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#121212;opacity:.7;margin-bottom:6px;">${esc(title)}</div><div style="font-size:15px;line-height:1.55;color:#121212;">${esc(addr).replace(/\n/g, "<br>")}</div></div>`;

const button = (href: string, label: string) => `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:26px 0 6px;"><tr><td style="background:#dd0000;"><a href="${href}" style="display:inline-block;padding:13px 24px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:.04em;color:#ffffff;text-decoration:none;">${esc(label)}</a></td></tr></table>`;

/** Sent by the Stripe webhook the moment an order is paid. */
export function orderConfirmationEmail(o: EmailOrder) {
  const first = firstName(o.name);
  const subject = `Order ${o.label} confirmed — thank you`;
  const text = [
    `Hi ${first},`, "",
    `Thanks for your order. We've got it and we'll get it out the door within 3–7 business days.`, "",
    `Order ${o.label}`, ...o.lines.map((li) => `  ${li.quantity ?? 1}× ${li.description ?? "item"}${li.amount_total != null ? `  ${money(li.amount_total)}` : ""}`),
    `  Total ${money(o.amount_cents)}`, "",
    `Ship to:`, o.address, "",
    `You'll get another e-mail with a tracking number as soon as it ships.`, "",
    `— Rep America`, `Building Stronger Americans · ${SITE}`,
  ].join("\n");
  const html = layout({
    kicker: `Order ${o.label}`,
    title: "Thank you. We've got your order.",
    preheader: `Order ${o.label} confirmed — ${itemsText(o.lines)}`,
    bodyHtml: `<p style="margin:0 0 18px;">Hi ${esc(first)},</p>
<p style="margin:0 0 18px;">Thanks for backing Rep America. Your order is in and we'll have it out the door within <strong>3–7 business days</strong>. You'll get another e-mail with a tracking number the moment it ships.</p>
${itemsTable(o)}
${addressBlock("Ship to", o.address)}
${button(`${SITE}/collections/all`, "Keep browsing")}`,
  });
  return { subject, text, html };
}

/** Sent from /admin/orders when a teammate marks the order shipped. */
export function shippedEmail(o: EmailOrder) {
  const first = firstName(o.name);
  const tracking = (o.tracking ?? "").trim();
  const url = tracking ? trackingUrl(tracking) : null;
  const subject = `Order ${o.label} is on its way`;
  const text = [
    `Hi ${first},`, "",
    `Good news — your order has shipped: ${itemsText(o.lines)}.`, "",
    tracking ? `Tracking number: ${tracking}${url ? `\n${url}` : ""}` : `We'll follow up with tracking shortly.`, "",
    `Shipping to:`, o.address, "",
    `— Rep America`, `Building Stronger Americans · ${SITE}`,
  ].join("\n");
  const html = layout({
    kicker: `Order ${o.label}`,
    title: "Your order is on its way.",
    preheader: tracking ? `Shipped — tracking ${tracking}` : "Shipped",
    bodyHtml: `<p style="margin:0 0 18px;">Hi ${esc(first)},</p>
<p style="margin:0 0 18px;">Good news — <strong>${esc(itemsText(o.lines))}</strong> just left us and is headed your way.</p>
${tracking ? `<div style="margin-top:8px;padding:16px 18px;background:#f3f3f3;"><div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#121212;opacity:.7;margin-bottom:6px;">Tracking number</div><div style="font-size:17px;font-weight:600;color:#121212;word-break:break-all;">${url ? `<a href="${url}" style="color:#121212;">${esc(tracking)}</a>` : esc(tracking)}</div></div>` : ""}
${addressBlock("Shipping to", o.address)}
${url ? button(url, "Track your package") : ""}
<p style="margin:22px 0 0;color:#555555;font-size:14px;">Wear it well — and send us a photo if you're so inclined.</p>`,
  });
  return { subject, text, html };
}
