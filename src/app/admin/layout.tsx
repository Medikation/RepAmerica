import type { Metadata } from "next";
import Link from "next/link";
import { getAdmin } from "@/lib/adminAuth";
import { signOut } from "@/app/admin/actions";

export const metadata: Metadata = { title: "Rep America — Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const state = await getAdmin();
  return (
    <div className="page-width ra-admin">
      <style>{`
        .ra-admin { padding: 24px 0 64px; font-family: Inter, Helvetica, Arial, sans-serif; }
        .ra-admin__bar { display:flex; align-items:center; justify-content:space-between; gap:16px; border-bottom:1px solid #ddd; padding-bottom:12px; margin-bottom:24px; }
        .ra-admin__bar nav a { margin-right:16px; text-decoration:none; font-weight:600; }
        .ra-admin__bar form button { background:none; border:1px solid #999; padding:6px 12px; border-radius:4px; cursor:pointer; font:inherit; }
        .ra-admin h1 { font-size:2.4rem; margin:0 0 16px; }
        .ra-admin table { width:100%; border-collapse:collapse; font-size:1.4rem; }
        .ra-admin th, .ra-admin td { text-align:left; vertical-align:top; padding:12px 10px; border-bottom:1px solid #e5e5e5; }
        .ra-admin th { font-size:1.2rem; text-transform:uppercase; letter-spacing:.04em; color:#666; }
        .ra-admin .addr { white-space:pre-line; }
        .ra-admin .muted { color:#777; font-size:1.3rem; }
        .ra-admin .pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:1.2rem; font-weight:600; }
        .ra-admin .pill--paid { background:#fff3cd; color:#7a5a00; }
        .ra-admin .pill--fulfilled { background:#d9f2e3; color:#0f5c33; }
        .ra-admin .pill--refunded, .ra-admin .pill--canceled { background:#eee; color:#555; }
        .ra-admin input[type=text], .ra-admin input[type=email], .ra-admin input[type=password], .ra-admin textarea { font:inherit; font-size:1.4rem; padding:8px 10px; border:1px solid #bbb; border-radius:4px; width:100%; box-sizing:border-box; }
        .ra-admin .btn { font:inherit; font-size:1.3rem; font-weight:600; padding:8px 14px; border-radius:4px; border:1px solid #111; background:#111; color:#fff; cursor:pointer; }
        .ra-admin .btn--ghost { background:#fff; color:#111; }
        .ra-admin .btn--sm { padding:5px 10px; font-size:1.2rem; }
        .ra-admin .stack > * + * { margin-top:8px; }
        .ra-admin .tabs a { display:inline-block; margin-right:14px; padding:6px 0; border-bottom:2px solid transparent; text-decoration:none; font-weight:600; }
        .ra-admin .tabs a[aria-current=page] { border-color:#111; }
        .ra-admin .notice { padding:10px 14px; border-radius:4px; background:#f6f6f6; margin-bottom:16px; }
        .ra-admin .notice--error { background:#fde8e8; color:#8a1c1c; }
        .ra-admin .login { max-width:420px; margin:40px auto; }
        @media (max-width: 749px) { .ra-admin table, .ra-admin thead, .ra-admin tbody, .ra-admin tr, .ra-admin td { display:block; } .ra-admin thead { display:none; } .ra-admin td { padding:6px 0; border:0; } .ra-admin tr { border-bottom:1px solid #e5e5e5; padding:12px 0; } }
      `}</style>
      <div className="ra-admin__bar">
        <nav>
          <Link href="/admin/orders">Orders</Link>
          <Link href="/admin/team">Team</Link>
        </nav>
        {"user" in state && state.user ? (
          <form action={signOut}>
            <span className="muted" style={{ marginRight: 12 }}>{state.user.email}</span>
            <button type="submit">Sign out</button>
          </form>
        ) : null}
      </div>
      {children}
    </div>
  );
}
