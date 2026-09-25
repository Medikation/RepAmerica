"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getAdmin, setSessionCookies, clearSessionCookies, signInWithPassword, completeSetPassword, createSetPasswordLink, removeAdmin, type LinkType } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { sendEmail, shippedEmail } from "@/lib/email";

const safeNext = (n: unknown) => (typeof n === "string" && /^\/admin(\/[A-Za-z0-9_\-/?=&]*)?$/.test(n) ? n : "/admin/orders");

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  if (!email || !password) redirect(`/admin/login?error=missing&next=${encodeURIComponent(next)}`);
  const { session, error } = await signInWithPassword(email, password);
  if (!session) {
    console.warn("[admin] sign-in failed", email, error);
    redirect(`/admin/login?error=invalid&next=${encodeURIComponent(next)}`);
  }
  await setSessionCookies(session);
  redirect(next);
}

export async function signOut() {
  await clearSessionCookies();
  redirect("/admin/login");
}

export async function setPassword(formData: FormData) {
  const tokenHash = String(formData.get("token_hash") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const type: LinkType = formData.get("type") === "invite" ? "invite" : "recovery";
  const back = (e: string) => redirect(`/admin/set-password?token_hash=${encodeURIComponent(tokenHash)}&type=${type}&error=${e}`);
  if (!tokenHash) back("token");
  if (password.length < 10) back("short");
  if (password !== confirm) back("mismatch");
  const { session, error } = await completeSetPassword(tokenHash, password, type);
  if (!session) {
    console.warn("[admin] set-password failed", error);
    back("token");
  }
  await setSessionCookies(session!);
  redirect("/admin/orders");
}

async function requireAdmin() {
  const s = await getAdmin();
  if (!s.user) redirect("/admin/login");
  return s.user;
}

function orderAddress(shipping: { name?: string | null; address?: Record<string, string | null> | null } | null, fallbackName: string | null) {
  const a = shipping?.address;
  const lines = [shipping?.name ?? fallbackName ?? "", a?.line1, a?.line2, a ? `${a.city ?? ""}, ${a.state ?? ""} ${a.postal_code ?? ""}`.trim() : null, a?.country && a.country !== "US" ? a.country : null];
  return lines.filter((l): l is string => !!l && l.trim() !== "").join("\n");
}

export async function markShipped(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const tracking = String(formData.get("tracking") ?? "").trim().slice(0, 100);
  const notify = formData.get("notify") === "on";
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/orders?error=bad");
  const db = supabaseAdmin();
  const { data: order, error } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (error || !order) redirect("/admin/orders?error=notfound");
  const { error: upd } = await db.from("orders").update({ status: "fulfilled", fulfilled_at: new Date().toISOString(), tracking: tracking || order.tracking }).eq("id", id);
  if (upd) redirect("/admin/orders?error=save");

  let emailed = "";
  if (notify && order.email && tracking) {
    const lines = (order.line_items ?? []) as { description: string | null; quantity: number | null; amount_total?: number | null }[];
    const m = shippedEmail({ label: order.shopify_name ?? `#${order.id}`, name: order.name, email: order.email, address: orderAddress(order.shipping, order.name), lines, amount_cents: order.amount_cents ?? 0, tracking });
    const r = await sendEmail({ to: order.email, ...m });
    emailed = r.ok ? "&emailed=1" : r.skipped ? "&emailed=skipped" : "&emailed=failed";
  }
  redirect(`/admin/orders?shipped=${encodeURIComponent(order.shopify_name ?? `#${id}`)}${emailed}`);
}

export async function reopenOrder(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/orders?error=bad");
  await supabaseAdmin().from("orders").update({ status: "paid", fulfilled_at: null }).eq("id", id);
  redirect("/admin/orders?view=all");
}

export async function saveNotes(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const notes = String(formData.get("notes") ?? "").slice(0, 2000);
  const view = String(formData.get("view") ?? "open");
  if (!Number.isInteger(id) || id <= 0) redirect("/admin/orders?error=bad");
  await supabaseAdmin().from("orders").update({ notes: notes || null }).eq("id", id);
  redirect(`/admin/orders?view=${encodeURIComponent(view)}&saved=${id}`);
}

async function currentOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "repamerica.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Team page: create a set-password link for a new teammate (invite) or an existing one (reset). Shown on screen for
 *  the owner to pass on — nothing is e-mailed, so it works before RESEND is configured. */
export async function inviteAdmin(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const type: LinkType = formData.get("type") === "recovery" ? "recovery" : "invite";
  if (!EMAIL_RE.test(email)) redirect("/admin/team?error=email");
  try {
    const link = await createSetPasswordLink(email, await currentOrigin(), type);
    redirect(`/admin/team?link=${encodeURIComponent(link)}&for=${encodeURIComponent(email)}`);
  } catch (e) {
    // redirect() throws NEXT_REDIRECT — let it through.
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    console.error("[admin] invite failed", e);
    redirect(`/admin/team?error=${encodeURIComponent(e instanceof Error ? e.message : "failed")}`);
  }
}

export async function deleteAdmin(formData: FormData) {
  const me = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id === me.id) redirect("/admin/team?error=self");
  try {
    await removeAdmin(id);
  } catch (e) {
    console.error("[admin] delete failed", e);
    redirect("/admin/team?error=delete");
  }
  redirect("/admin/team?removed=1");
}
