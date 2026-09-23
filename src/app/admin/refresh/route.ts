// Silent session refresh: the admin layout sends expired sessions here; we swap the refresh token for a new session,
// set the cookies (only allowed in Route Handlers / Server Actions) and bounce back.
import { NextResponse } from "next/server";
import { refreshSession, setSessionCookies, clearSessionCookies } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const next = u.searchParams.get("next") ?? "/admin/orders";
  const safe = /^\/admin(\/[A-Za-z0-9_\-/?=&]*)?$/.test(next) ? next : "/admin/orders";
  const session = await refreshSession();
  if (!session) {
    await clearSessionCookies();
    return NextResponse.redirect(new URL(`/admin/login?error=expired&next=${encodeURIComponent(safe)}`, u.origin));
  }
  await setSessionCookies(session);
  return NextResponse.redirect(new URL(safe, u.origin));
}
