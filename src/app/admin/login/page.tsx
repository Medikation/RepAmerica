import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { signIn } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const { error, next } = await searchParams;
  const state = await getAdmin();
  if (state.user) redirect("/admin/orders");
  const msg = error === "invalid" ? "Wrong e-mail or password." : error === "missing" ? "Enter your e-mail and password." : error === "expired" ? "Your session expired — sign in again." : null;
  return (
    <div className="login stack">
      <h1>Sign in</h1>
      {msg ? <div className="notice notice--error">{msg}</div> : null}
      <form action={signIn} className="stack">
        <input type="hidden" name="next" value={next ?? "/admin/orders"} />
        <label>
          <div className="muted">E-mail</div>
          <input type="email" name="email" autoComplete="username" required />
        </label>
        <label>
          <div className="muted">Password</div>
          <input type="password" name="password" autoComplete="current-password" required />
        </label>
        <button className="btn" type="submit">Sign in</button>
      </form>
      <p className="muted">No account? Ask Medi for a set-password link.</p>
    </div>
  );
}
