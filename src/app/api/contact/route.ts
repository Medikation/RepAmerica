import { NextResponse } from "next/server";

/** Replacement for Shopify's `{% form 'contact' %}` POST. Validates the fields and, when RESEND_API_KEY is set,
 *  emails team@repamerica.com through Resend's REST API. Nothing is stored. Plain HTML form posts are redirected back to
 *  /pages/contact with a status in the query string; JSON clients get JSON. */

export const runtime = "nodejs";

const TO = "team@repamerica.com";
const FROM = process.env.CONTACT_FROM_EMAIL ?? "Rep America <noreply@repamerica.com>";
const CONTACT_PATH = "/pages/contact";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function wantsJson(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  const type = req.headers.get("content-type") ?? "";
  return type.includes("application/json") || (accept.includes("application/json") && !accept.includes("text/html"));
}

async function readFields(req: Request): Promise<Record<string, string>> {
  const type = req.headers.get("content-type") ?? "";
  const out: Record<string, string> = {};
  if (type.includes("application/json")) {
    const j = (await req.json()) as Record<string, unknown>;
    for (const [k, v] of Object.entries(j)) out[k] = typeof v === "string" ? v : "";
    return out;
  }
  const fd = await req.formData();
  fd.forEach((v, k) => { if (typeof v === "string") out[k] = v; });
  return out;
}

export async function POST(req: Request) {
  const site = new URL(req.url).origin;
  const json = wantsJson(req);
  const back = (params: Record<string, string>, status = 303) => {
    const u = new URL(CONTACT_PATH, site);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    u.hash = "ContactForm";
    return NextResponse.redirect(u, status);
  };

  let f: Record<string, string>;
  try {
    f = await readFields(req);
  } catch {
    return json ? NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 }) : back({ error: "invalid" });
  }

  // Field names mirror the theme: contact[Name], contact[email], contact[Phone number], contact[Comment].
  const name = (f["contact[Name]"] ?? f.name ?? "").trim().slice(0, 200);
  const email = (f["contact[email]"] ?? f.email ?? "").trim().slice(0, 320);
  const phone = (f["contact[Phone number]"] ?? f.phone ?? "").trim().slice(0, 50);
  const body = (f["contact[Comment]"] ?? f.body ?? f.comment ?? "").trim().slice(0, 10000);

  if (!EMAIL_RE.test(email)) {
    return json ? NextResponse.json({ ok: false, field: "email", error: "is invalid" }, { status: 400 }) : back({ error: "invalid", name, phone, body });
  }
  if (phone && !/^[0-9\-]*$/.test(phone)) {
    return json ? NextResponse.json({ ok: false, field: "phone", error: "is invalid" }, { status: 400 }) : back({ error: "invalid", name, email, body });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    const msg = "The contact form isn't available right now. Please email team@repamerica.com directly.";
    return json ? NextResponse.json({ ok: false, error: msg }, { status: 503 }) : back({ error: "unavailable", name, email, phone, body });
  }

  const subject = `Contact form: ${name || email}`;
  const text = [`Name: ${name}`, `Email: ${email}`, `Phone: ${phone}`, "", body].join("\n");
  const html = `<p><strong>Name:</strong> ${esc(name)}<br><strong>Email:</strong> ${esc(email)}<br><strong>Phone:</strong> ${esc(phone)}</p><p>${esc(body).replace(/\n/g, "<br>")}</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: [TO], reply_to: email, subject, text, html }),
  });

  if (!res.ok) {
    console.error("contact: resend error", res.status, await res.text().catch(() => ""));
    const msg = "We couldn't send your message. Please try again or email team@repamerica.com.";
    return json ? NextResponse.json({ ok: false, error: msg }, { status: 502 }) : back({ error: "failed", name, email, phone, body });
  }

  return json ? NextResponse.json({ ok: true }) : back({ posted: "true" });
}
