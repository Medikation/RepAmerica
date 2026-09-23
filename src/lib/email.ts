// Transactional e-mail through Resend's REST API (same mechanism as /api/contact). No-op with a console warning when
// RESEND_API_KEY is unset, so fulfilment never blocks on e-mail.
const FROM = process.env.ORDER_FROM_EMAIL ?? process.env.CONTACT_FROM_EMAIL ?? "Rep America <orders@repamerica.com>";
const REPLY_TO = "team@repamerica.com";

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

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

export function shippedEmail(o: { name: string | null; items: string; tracking: string; address: string }) {
  const url = trackingUrl(o.tracking);
  const first = (o.name ?? "").trim().split(/\s+/)[0] || "there";
  const subject = "Your Rep America order has shipped";
  const text = [
    `Hi ${first},`,
    "",
    `Good news — your order is on its way: ${o.items}.`,
    "",
    `Tracking number: ${o.tracking}${url ? `\n${url}` : ""}`,
    "",
    `Shipping to:\n${o.address}`,
    "",
    "Questions? Just reply to this e-mail.",
    "",
    "— Rep America",
    "Building Stronger Americans · repamerica.com",
  ].join("\n");
  const html = `<div style="font-family:Inter,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.5;color:#111;max-width:560px">
<p>Hi ${esc(first)},</p>
<p>Good news — your order is on its way: <strong>${esc(o.items)}</strong>.</p>
<p>Tracking number: ${url ? `<a href="${url}">${esc(o.tracking)}</a>` : esc(o.tracking)}</p>
<p style="color:#555">Shipping to:<br>${esc(o.address).replace(/\n/g, "<br>")}</p>
<p>Questions? Just reply to this e-mail.</p>
<p>— Rep America<br><span style="color:#777">Building Stronger Americans · <a href="https://repamerica.com" style="color:#777">repamerica.com</a></span></p>
</div>`;
  return { subject, text, html };
}
