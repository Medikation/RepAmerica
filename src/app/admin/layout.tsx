import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/adminAuth";
import { signOut } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Rep America — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const state = await getAdmin();
  return (
    <div className="ra-admin">
      <style>{`
        .ra-admin { max-width: 1100px; margin: 0 auto; padding: 20px 16px 64px; font-family: Inter, Helvetica, Arial, sans-serif; box-sizing: border-box; overflow-wrap: anywhere; }
        @media (min-width: 750px) { .ra-admin { padding: 28px 32px 80px; } }
        .ra-admin * { box-sizing: border-box; }
        .ra-admin__bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px 16px; border-bottom:1px solid #ddd; padding-bottom:12px; margin-bottom:20px; }
        .ra-admin__bar nav a { margin-right:16px; text-decoration:none; font-weight:600; font-size:1.5rem; }
        .ra-admin__account { display:flex; align-items:center; gap:10px; flex-wrap:wrap; min-width:0; }
        .ra-admin__account span { font-size:1.3rem; color:#777; overflow-wrap:anywhere; }
        .ra-admin__account button { flex:0 0 auto; background:#fff; color:#111; border:1px solid #999; padding:6px 12px; border-radius:6px; cursor:pointer; font-family:inherit; font-size:1.3rem; font-weight:600; line-height:1.2; min-height:0; min-width:0; }
        .ra-admin h1 { font-size:2.4rem; margin:0 0 14px; }
        .ra-admin .muted { color:#777; font-size:1.3rem; }
        .ra-admin .pill { display:inline-block; padding:2px 9px; border-radius:999px; font-size:1.2rem; font-weight:600; white-space:nowrap; }
        .ra-admin .pill--paid { background:#fff3cd; color:#7a5a00; }
        .ra-admin .pill--fulfilled { background:#d9f2e3; color:#0f5c33; }
        .ra-admin .pill--refunded, .ra-admin .pill--canceled { background:#eee; color:#555; }
        .ra-admin input[type=text], .ra-admin input[type=email], .ra-admin input[type=password], .ra-admin textarea { font:inherit; font-size:1.4rem; padding:9px 10px; border:1px solid #bbb; border-radius:6px; width:100%; max-width:100%; }
        .ra-admin .btn { font:inherit; font-size:1.3rem; font-weight:600; padding:9px 14px; border-radius:6px; border:1px solid #111; background:#111; color:#fff; cursor:pointer; white-space:nowrap; }
        .ra-admin .btn--ghost { background:#fff; color:#111; }
        .ra-admin .btn--sm { padding:6px 10px; font-size:1.2rem; }
        .ra-admin .stack > * + * { margin-top:8px; }
        .ra-admin .tabs { display:flex; gap:18px; margin-bottom:16px; border-bottom:1px solid #e5e5e5; }
        .ra-admin .tabs a { display:inline-block; padding:8px 0; margin-bottom:-1px; border-bottom:2px solid transparent; text-decoration:none; font-weight:600; font-size:1.4rem; }
        .ra-admin .tabs a[aria-current=page] { border-color:#111; color:#111; }
        .ra-admin .notice { padding:10px 14px; border-radius:6px; background:#f6f6f6; margin-bottom:16px; font-size:1.4rem; }
        .ra-admin .notice--error { background:#fde8e8; color:#8a1c1c; }
        .ra-admin .login { max-width:420px; margin:32px auto; }
        /* Order cards */
        .ra-admin .cards { display:grid; gap:14px; }
        .ra-admin .card { border:1px solid #e2e2e2; border-radius:10px; background:#fff; padding:14px; display:grid; gap:14px; grid-template-columns: 1fr; }
        @media (min-width: 900px) { .ra-admin .card { grid-template-columns: 1.1fr 1.3fr 1.2fr; padding:16px 18px; } }
        .ra-admin .card__head { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
        .ra-admin .card__id { font-weight:700; font-size:1.6rem; }
        .ra-admin .card__total { font-size:1.6rem; font-weight:600; }
        .ra-admin .card h3 { font-size:1.1rem; text-transform:uppercase; letter-spacing:.06em; color:#888; margin:0 0 6px; font-weight:600; }
        .ra-admin .addr { white-space:pre-line; font-size:1.4rem; line-height:1.5; }
        .ra-admin .items { font-size:1.4rem; }
        .ra-admin .row { display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
        .ra-admin .card--done { background:#fafafa; }
        .ra-admin table { width:100%; border-collapse:collapse; font-size:1.4rem; }
        .ra-admin th, .ra-admin td { text-align:left; vertical-align:top; padding:10px 8px; border-bottom:1px solid #e5e5e5; }
        .ra-admin th { font-size:1.1rem; text-transform:uppercase; letter-spacing:.05em; color:#888; }
      `}</style>
      <div className="ra-admin__bar">
        <nav>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/team">Team</Link>
        </nav>
        {"user" in state && state.user ? (
          <form action={signOut} className="ra-admin__account">
            <span>{state.user.email}</span>
            <button type="submit">Sign out</button>
          </form>
        ) : null}
      </div>
      {children}
    </div>
  );
}
