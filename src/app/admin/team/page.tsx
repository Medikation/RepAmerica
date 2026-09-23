import { redirect } from "next/navigation";
import { getAdmin, listAdmins } from "@/lib/adminAuth";
import { inviteAdmin, deleteAdmin } from "@/app/admin/actions";
import CopyButton from "@/components/admin/CopyButton";

export const dynamic = "force-dynamic";

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/team")}` : "/admin/login?next=/admin/team");
  const admins = await listAdmins();
  const err =
    sp.error === "email" ? "Enter a valid e-mail address." :
    sp.error === "self" ? "You can't remove yourself." :
    sp.error === "delete" ? "Could not remove that account." :
    sp.error ? `Could not create link: ${sp.error}` : null;

  return (
    <div>
      <h1>Team</h1>
      <p className="muted">People who can sign in to this admin. Each gets their own e-mail + password.</p>
      {err ? <div className="notice notice--error">{err}</div> : null}
      {sp.removed ? <div className="notice">Account removed.</div> : null}
      {sp.link ? (
        <div className="notice stack">
          <div><strong>One-time set-password link for {sp.for}</strong> — send it to them (it expires in 24 hours and works once):</div>
          <input type="text" readOnly value={sp.link} style={{ fontSize: "1.2rem" }} />
          <div><CopyButton text={sp.link} label="Copy link" /></div>
        </div>
      ) : null}
      <div className="cards">
        {admins.map((a) => (
          <article key={a.id} className="card" style={{ gridTemplateColumns: "1fr" }}>
            <div className="card__head">
              <div>
                <div className="card__id" style={{ fontSize: "1.5rem" }}>{a.email}{a.id === state.user!.id ? <span className="muted"> (you)</span> : null}</div>
                <div className="muted">Last sign-in: {a.lastSignIn ? new Date(a.lastSignIn).toLocaleString("en-US", { timeZone: "America/Los_Angeles", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "never"}</div>
              </div>
            </div>
            <div className="row">
              <form action={inviteAdmin}>
                <input type="hidden" name="email" value={a.email} />
                <input type="hidden" name="type" value="recovery" />
                <button className="btn btn--ghost btn--sm" type="submit">Reset-password link</button>
              </form>
              {a.id !== state.user!.id ? (
                <form action={deleteAdmin}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="btn btn--ghost btn--sm" type="submit">Remove</button>
                </form>
              ) : null}
            </div>
          </article>
        ))}
      </div>
      <h2 style={{ fontSize: "1.8rem", marginTop: 32 }}>Add a teammate</h2>
      <form action={inviteAdmin} className="stack" style={{ maxWidth: 420 }}>
        <input type="hidden" name="type" value="invite" />
        <input type="email" name="email" placeholder="their@email.com" required />
        <button className="btn" type="submit">Create set-password link</button>
      </form>
    </div>
  );
}
