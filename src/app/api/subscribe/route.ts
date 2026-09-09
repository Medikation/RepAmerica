import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UNAVAILABLE = "Sign-ups are temporarily unavailable. Please try again later.";

/** Newsletter sign-up (footer form). Accepts JSON `{ email, source? }` or a form POST (`contact[email]` / `email`).
 *  JSON callers get JSON; plain form posts are redirected back to the referring page with `?newsletter=success|error`. */
export async function POST(request: Request) {
  const wantsJson = (request.headers.get("accept") ?? "").includes("application/json") || (request.headers.get("content-type") ?? "").includes("application/json");
  const referer = request.headers.get("referer") ?? "/";

  const respond = (status: number, payload: { ok?: boolean; error?: string }) => {
    if (wantsJson) return NextResponse.json(payload, { status });
    const url = new URL(referer, request.url);
    url.searchParams.set("newsletter", payload.ok ? "success" : "error");
    if (payload.error) url.searchParams.set("newsletter_message", payload.error);
    url.hash = "ContactFooter";
    return NextResponse.redirect(url, 303);
  };

  let email = "";
  let source = "footer";
  try {
    if ((request.headers.get("content-type") ?? "").includes("application/json")) {
      const body = (await request.json()) as { email?: unknown; source?: unknown };
      email = typeof body.email === "string" ? body.email : "";
      if (typeof body.source === "string") source = body.source;
    } else {
      const form = await request.formData();
      email = String(form.get("contact[email]") ?? form.get("email") ?? "");
      const s = form.get("source");
      if (typeof s === "string" && s) source = s;
    }
  } catch {
    return respond(400, { error: "Invalid request." });
  }

  email = email.trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return respond(400, { error: "Please enter a valid email address." });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return respond(503, { error: UNAVAILABLE });
  }

  const { error } = await supabaseAdmin().from("subscribers").insert({ email, source: source.slice(0, 64) });
  if (error) {
    // 23505 = unique_violation: already subscribed — treat as success so we don't leak list membership.
    if (error.code === "23505") return respond(200, { ok: true });
    console.error("subscribe insert failed", error);
    return respond(500, { error: UNAVAILABLE });
  }
  return respond(200, { ok: true });
}
