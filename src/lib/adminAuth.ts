// Admin sign-in for /admin/* (order fulfilment). Supabase Auth email + password; sessions live in two httpOnly cookies.
// There is no public sign-up: users are created by the owner (Supabase Auth → Users) and get a one-time
// /admin/set-password link (see src/app/admin/set-password). Data access on admin pages uses the service-role client,
// gated by requireAdmin() — so the auth.users table is the whole allowlist.
import { cookies } from "next/headers";
import { createClient, type User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://udeivbgtpfccbtstvsxa.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkZWl2Ymd0cGZjY2J0c3R2c3hhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NjU0ODksImV4cCI6MjEwNDU0MTQ4OX0._MA9g87gg-NQQljdctJKdsIiEu8q-f2V8jXKIOijxS8";

export const ACCESS_COOKIE = "ra_admin_at";
export const REFRESH_COOKIE = "ra_admin_rt";
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/** Stateless auth client (no storage, no auto refresh) for sign-in / refresh calls. */
export function authClient() {
  return createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}

type SessionLike = { access_token: string; refresh_token: string; expires_in?: number | null };

/** Only callable from Server Actions / Route Handlers (Next.js forbids cookie writes elsewhere). */
export async function setSessionCookies(session: SessionLike) {
  const jar = await cookies();
  const secure = process.env.NODE_ENV === "production";
  jar.set(ACCESS_COOKIE, session.access_token, { httpOnly: true, secure, sameSite: "lax", path: "/admin", maxAge: session.expires_in ?? 3600 });
  jar.set(REFRESH_COOKIE, session.refresh_token, { httpOnly: true, secure, sameSite: "lax", path: "/admin", maxAge: REFRESH_MAX_AGE });
}

export async function clearSessionCookies() {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, "", { path: "/admin", maxAge: 0 });
  jar.set(REFRESH_COOKIE, "", { path: "/admin", maxAge: 0 });
}

export type AdminState = { user: User } | { user: null; canRefresh: boolean };

/** Resolves the signed-in admin from the access cookie. `canRefresh` = access token dead but a refresh token exists. */
export async function getAdmin(): Promise<AdminState> {
  const jar = await cookies();
  const at = jar.get(ACCESS_COOKIE)?.value;
  const rt = jar.get(REFRESH_COOKIE)?.value;
  if (at) {
    const { data, error } = await authClient().auth.getUser(at);
    if (!error && data.user) return { user: data.user };
  }
  return { user: null, canRefresh: !!rt };
}

/** Exchanges the refresh cookie for a new session. Returns null when the refresh token is invalid/revoked. */
export async function refreshSession(): Promise<SessionLike | null> {
  const jar = await cookies();
  const rt = jar.get(REFRESH_COOKIE)?.value;
  if (!rt) return null;
  const { data, error } = await authClient().auth.refreshSession({ refresh_token: rt });
  if (error || !data.session) return null;
  return data.session;
}

export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await authClient().auth.signInWithPassword({ email, password });
  if (error || !data.session) return { session: null, error: error?.message ?? "Sign-in failed" };
  return { session: data.session, error: null };
}

export type LinkType = "invite" | "recovery";

/** One-time set-password link. New teammate → "invite" (creates the auth user); existing user → "recovery". */
export async function createSetPasswordLink(email: string, site: string, type: LinkType) {
  const { data, error } = await supabaseAdmin().auth.admin.generateLink({ type, email });
  if (error || !data.properties?.hashed_token) throw new Error(error?.message ?? "Could not create link");
  return `${site}/admin/set-password?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${type}`;
}

export async function listAdmins() {
  const { data, error } = await supabaseAdmin().auth.admin.listUsers({ perPage: 100 });
  if (error) throw new Error(error.message);
  return data.users.map((u) => ({ id: u.id, email: u.email ?? "", lastSignIn: u.last_sign_in_at ?? null, createdAt: u.created_at }));
}

export async function removeAdmin(id: string) {
  const { error } = await supabaseAdmin().auth.admin.deleteUser(id);
  if (error) throw new Error(error.message);
}

/** Verifies a set-password token (invite or recovery) and sets the new password. Returns the signed-in session. */
export async function completeSetPassword(tokenHash: string, password: string, type: LinkType) {
  const client = authClient();
  const { data, error } = await client.auth.verifyOtp({ token_hash: tokenHash, type });
  if (error || !data.session || !data.user) return { session: null, error: error?.message ?? "This link is invalid or has expired" };
  const upd = await supabaseAdmin().auth.admin.updateUserById(data.user.id, { password });
  if (upd.error) return { session: null, error: upd.error.message };
  // Re-sign in so the returned session reflects the new password.
  const signed = await client.auth.signInWithPassword({ email: data.user.email!, password });
  if (signed.error || !signed.data.session) return { session: null, error: signed.error?.message ?? "Sign-in failed" };
  return { session: signed.data.session, error: null };
}
