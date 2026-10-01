import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { getAdmin } from "@/lib/adminAuth";
import { oauthClient, SCOPE, CALENDAR_USER, STATE_COOKIE } from "@/lib/googleCalendar";

// Step 1 of connecting Google Calendar to /admin/today: send the signed-in owner to Google's consent screen.
// Lives under /admin so the admin session cookies (path=/admin) are present. The `state` nonce goes in an httpOnly
// cookie and is checked by the callback.
export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";

export async function GET() {
  const state = await getAdmin();
  if (!state.user) return NextResponse.redirect(`${SITE}/admin/login?next=${encodeURIComponent("/admin/today")}`);
  const { id } = oauthClient();
  if (!id) return NextResponse.redirect(`${SITE}/admin/today?gcal=unconfigured`);

  const nonce = randomBytes(24).toString("base64url");
  const jar = await cookies();
  jar.set(STATE_COOKIE, nonce, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/admin", maxAge: 600 });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", id);
  url.searchParams.set("redirect_uri", `${SITE}/admin/google-calendar/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", `${SCOPE} https://www.googleapis.com/auth/userinfo.email`);
  url.searchParams.set("access_type", "offline"); // → refresh token
  url.searchParams.set("prompt", "consent"); // always issue a refresh token, even on re-connect
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("login_hint", CALENDAR_USER);
  url.searchParams.set("state", nonce);
  return NextResponse.redirect(url.toString());
}
