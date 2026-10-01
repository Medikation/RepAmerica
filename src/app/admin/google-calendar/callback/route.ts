import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { oauthClient, PROVIDER, CALENDAR_USER, STATE_COOKIE } from "@/lib/googleCalendar";

// Step 2: Google sends the owner back here with a one-time code. Exchange it for a refresh token, confirm which Google
// account consented, and store the token in `integration_tokens` (service role only). The token never leaves the server.
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
const back = (q: string) => NextResponse.redirect(`${SITE}/admin/today?gcal=${q}`);

export async function GET(req: NextRequest) {
  const state = await getAdmin();
  if (!state.user) return NextResponse.redirect(`${SITE}/admin/login?next=${encodeURIComponent("/admin/today")}`);

  const jar = await cookies();
  const expected = jar.get(STATE_COOKIE)?.value;
  jar.set(STATE_COOKIE, "", { path: "/admin", maxAge: 0 });

  const params = req.nextUrl.searchParams;
  if (params.get("error")) return back(`denied`);
  const code = params.get("code");
  if (!code || !expected || params.get("state") !== expected) return back("state");

  const { id, secret } = oauthClient();
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: id, client_secret: secret, redirect_uri: `${SITE}/admin/google-calendar/callback` }),
    cache: "no-store",
  });
  const tok = (await tokenRes.json().catch(() => ({}))) as { access_token?: string; refresh_token?: string; scope?: string; error?: string; error_description?: string };
  if (!tokenRes.ok || !tok.access_token) {
    console.warn("[gcal] code exchange failed", tok.error, tok.error_description);
    return back("exchange");
  }
  if (!tok.refresh_token) return back("norefresh"); // only happens if Google skipped it; prompt=consent should prevent this

  // Which account consented? Must be the one the page reads as.
  const who = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { authorization: `Bearer ${tok.access_token}` }, cache: "no-store" });
  const info = (await who.json().catch(() => ({}))) as { email?: string };
  const email = (info.email ?? "").toLowerCase();
  if (email !== CALENDAR_USER.toLowerCase()) {
    console.warn("[gcal] consent came from", email, "expected", CALENDAR_USER);
    return back(`wrongaccount`);
  }

  const { error } = await supabaseAdmin()
    .from("integration_tokens")
    .upsert({ provider: PROVIDER, account: email, refresh_token: tok.refresh_token, scope: tok.scope ?? null, granted_at: new Date().toISOString() }, { onConflict: "provider,account" });
  if (error) {
    console.error("[gcal] could not store token", error.message);
    return back("store");
  }
  return back("connected");
}
