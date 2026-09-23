import { setPassword } from "@/app/admin/actions";
import PasswordInput from "@/components/admin/PasswordInput";

export const dynamic = "force-dynamic";

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ token_hash?: string; type?: string; error?: string }> }) {
  const { token_hash, type, error } = await searchParams;
  const msg =
    error === "short" ? "Use at least 10 characters." :
    error === "mismatch" ? "The two passwords don't match." :
    error === "token" ? "This link is invalid or has expired. Ask Medi for a new one." : null;
  if (!token_hash) return <div className="login"><h1>Set password</h1><div className="notice notice--error">Missing link token.</div></div>;
  return (
    <div className="login stack">
      <h1>Choose a password</h1>
      {msg ? <div className="notice notice--error">{msg}</div> : null}
      <form action={setPassword} className="stack">
        <input type="hidden" name="token_hash" value={token_hash} />
        <input type="hidden" name="type" value={type === "invite" ? "invite" : "recovery"} />
        <label>
          <div className="muted">New password (10+ characters)</div>
          <PasswordInput name="password" autoComplete="new-password" minLength={10} required />
        </label>
        <label>
          <div className="muted">Confirm</div>
          <PasswordInput name="confirm" autoComplete="new-password" minLength={10} required />
        </label>
        <button className="btn" type="submit">Save and sign in</button>
      </form>
    </div>
  );
}
