import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

// Revenue: what Rep America is building to earn — the main idea (the mentorship group), why, the next step,
// and the passive side doors (creator platforms). Read-only by design, same as /admin/show: the content lives in
// Supabase — `revenue_settings` (header facts), `revenue_sections` (short outline sections, trusted HTML),
// `revenue_platforms` (one status line per platform) — and Medi tells Claude what changed; Claude updates the rows.
// RLS is on with no policies (service role only).
export const dynamic = "force-dynamic";

type Setting = { key: string; value: string | null };
type Section = { id: number; slug: string; title: string; status: string | null; body_html: string; sort_order: number; updated_at: string };
type Platform = { id: number; name: string; what: string | null; signup_mode: string; status: string; url: string | null; handle: string | null; pay: string | null; notes: string | null; sort_order: number; updated_at: string };

const PT = "America/Los_Angeles";
const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: PT });
const chipClass = (s: string) => `rv-chip rv-chip--${s.toLowerCase().replace(/[^a-z]+/g, "-")}`;
const SIGNUP_LABEL: Record<string, string> = { open: "open form", invite: "invite-only", listed: "listed", closed: "closed", unknown: "—" };

export default async function RevenuePage() {
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/revenue")}` : "/admin/login?next=/admin/revenue");

  const db = supabaseAdmin();
  const [{ data: settingRows }, { data: sectionRows }, { data: platformRows }] = await Promise.all([
    db.from("revenue_settings").select("key, value"),
    db.from("revenue_sections").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true }),
    db.from("revenue_platforms").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true }),
  ]);
  const settings = new Map<string, string>(((settingRows ?? []) as Setting[]).filter((s) => s.value != null).map((s) => [s.key, s.value as string]));
  const sections = (sectionRows ?? []) as Section[];
  const platforms = (platformRows ?? []) as Platform[];

  const mainIdea = settings.get("main_idea") ?? "Not set";
  const mainStatus = settings.get("main_status") ?? "";
  const price = settings.get("price") ?? "—";
  const priceNote = settings.get("price_note") ?? "price";
  const nextStep = settings.get("next_step") ?? "";
  const nextStepStatus = settings.get("next_step_status") ?? "—";
  const platformRule = settings.get("platform_rule") ?? "";
  const lastUpdated = [...sections.map((s) => s.updated_at), ...platforms.map((p) => p.updated_at)].sort().at(-1) ?? null;

  const inCount = platforms.filter((p) => ["applied", "accepted", "listed"].includes(p.status)).length;
  const statusSummary = Array.from(platforms.reduce((m, p) => m.set(p.status, (m.get(p.status) ?? 0) + 1), new Map<string, number>()).entries())
    .map(([s, n]) => `${n} ${s}`)
    .join(" · ");

  return (
    <div>
      <style>{`
        .ra-admin .sp-stats { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; margin:0 0 18px; }
        @media (min-width:1000px){ .ra-admin .sp-stats { grid-template-columns:repeat(4, minmax(0,1fr)); } }
        .ra-admin .sp-stat { border:1px solid #e2e2e2; border-radius:10px; padding:10px 14px; background:#fff; min-width:0; overflow:hidden; }
        .ra-admin .sp-stat b { display:block; font-size:1.8rem; line-height:1.15; }
        .ra-admin .sp-stat b small { font-size:1.3rem; color:#777; font-weight:600; }
        .ra-admin .sp-stat span { display:block; font-size:1.2rem; color:#777; margin-top:2px; }
        .ra-admin .sp-jump { display:flex; flex-wrap:wrap; gap:6px 8px; margin:0 0 18px; }
        .ra-admin .sp-jump a { font-size:1.2rem; font-weight:600; text-decoration:none; color:#333; border:1px solid #ddd; border-radius:999px; padding:4px 10px; white-space:nowrap; }
        .ra-admin .sp-jump a:hover { border-color:#111; color:#111; }
        .ra-admin .sp-section { margin-top:14px; border:1px solid #e2e2e2; border-radius:10px; background:#fff; padding:6px 16px 14px; scroll-margin-top:16px; }
        .ra-admin .sp-h { font-size:1.5rem; font-weight:700; color:#111; margin:0; cursor:pointer; list-style:none; display:flex; align-items:center; gap:10px; user-select:none; padding:8px 0; flex-wrap:wrap; }
        .ra-admin .sp-h::-webkit-details-marker { display:none; }
        .ra-admin .sp-h__caret { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #999; transition:transform .15s; flex:0 0 auto; }
        .ra-admin details:not([open]) .sp-h__caret { transform:rotate(-90deg); }
        .ra-admin .sp-h__meta { font-size:1.15rem; color:#aaa; font-weight:500; margin-left:auto; white-space:nowrap; }
        .ra-admin .sp-prose { font-size:1.4rem; line-height:1.6; color:#222; max-width:86ch; padding-top:4px; }
        .ra-admin .sp-prose > :first-child { margin-top:0; }
        .ra-admin .sp-prose h3 { font-family:inherit; font-size:1.5rem; font-weight:700; letter-spacing:0; line-height:1.3; color:#111; margin:20px 0 6px; }
        .ra-admin .sp-prose h4 { font-size:1.15rem; text-transform:uppercase; letter-spacing:.06em; color:#888; margin:16px 0 4px; font-weight:600; }
        .ra-admin .sp-prose p { margin:0 0 10px; }
        .ra-admin .sp-prose ul, .ra-admin .sp-prose ol { margin:0 0 10px; padding-left:22px; }
        .ra-admin .sp-prose li { margin:3px 0; }
        .ra-admin .sp-prose li > p { margin:0; }
        .ra-admin .sp-prose a { color:#111; }
        .ra-admin .sp-prose code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size:1.25rem; background:#f3f3f3; padding:1px 5px; border-radius:4px; }
        .ra-admin .sp-prose blockquote { margin:10px 0; padding:8px 14px; border-left:3px solid #ddd; color:#555; }
        .ra-admin .sp-prose hr { border:0; border-top:1px solid #eee; margin:14px 0; }
        .ra-admin .sp-prose table { width:100%; border-collapse:collapse; font-size:1.3rem; margin:6px 0 12px; }
        .ra-admin .sp-prose th, .ra-admin .sp-prose td { text-align:left; vertical-align:top; padding:7px 8px; border-bottom:1px solid #e5e5e5; }
        .ra-admin .sp-prose th { font-size:1.1rem; text-transform:uppercase; letter-spacing:.05em; color:#888; font-weight:600; }
        .ra-admin .sp-prose .rule { background:#fff8e6; border:1px solid #f1e2b3; padding:10px 14px; border-radius:8px; margin:10px 0 12px; }
        .ra-admin .sp-prose .rule > :last-child { margin-bottom:0; }
        .ra-admin .sp-prose .note { background:#f6f6f6; border-radius:8px; padding:10px 14px; margin:10px 0 12px; color:#444; }
        .ra-admin .sp-prose .note > :last-child { margin-bottom:0; }
        .ra-admin .sp-prose .check { list-style:none; padding-left:0; }
        .ra-admin .sp-prose .check li { padding-left:26px; position:relative; }
        .ra-admin .sp-prose .check li::before { content:""; position:absolute; left:2px; top:5px; width:13px; height:13px; border:1.5px solid #999; border-radius:3px; }
        .ra-admin .sp-prose .quote { font-style:italic; color:#333; }
        .ra-admin .sp-table-wrap { overflow-x:auto; }
        .ra-admin .sp-empty { font-size:1.3rem; color:#777; padding:6px 0 2px; }
        .ra-admin .rv-chip { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:700; letter-spacing:.03em; text-transform:uppercase; white-space:nowrap; border:1px solid #ddd; color:#777; background:#fff; vertical-align:middle; }
        .ra-admin .rv-chip--developing, .ra-admin .rv-chip--applied, .ra-admin .rv-chip--in-progress { background:#fff3cd; color:#7a5a00; border-color:#fff3cd; }
        .ra-admin .rv-chip--decided, .ra-admin .rv-chip--done, .ra-admin .rv-chip--accepted, .ra-admin .rv-chip--listed, .ra-admin .rv-chip--live { background:#d9f2e3; color:#0f5c33; border-color:#d9f2e3; }
        .ra-admin .rv-chip--parked, .ra-admin .rv-chip--declined, .ra-admin .rv-chip--paused, .ra-admin .rv-chip--off { background:#eee; color:#555; border-color:#eee; }
        .ra-admin .rv-chip--not-yet, .ra-admin .rv-chip--not-started { background:#fff; color:#888; }
        .ra-admin .rv-mode { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:700; white-space:nowrap; background:#eee; color:#444; }
        .ra-admin .rv-mode--open { background:#d9f2e3; color:#0f5c33; }
        .ra-admin .rv-mode--invite { background:#fbead3; color:#8a4b00; }
        .ra-admin .rv-mode--listed { background:#dde8f7; color:#1d4a8a; }
        .ra-admin .rv-plat td { font-size:1.3rem; }
        .ra-admin .rv-plat td:first-child { font-weight:600; white-space:nowrap; }
        .ra-admin .rv-plat td:first-child small { display:block; font-weight:500; color:#888; font-size:1.15rem; white-space:normal; }
        .ra-admin .rv-plat a { color:#111; }
      `}</style>
      <h1>Revenue</h1>
      <p className="muted">What Rep America is building to earn — the main idea, why, the next step, and the side doors. Private — nothing here shows on the site. Tell Claude what changes and this updates.</p>

      <div className="sp-stats">
        <div className="sp-stat"><b>{mainIdea}</b><span>{mainStatus || "main idea"}</span></div>
        <div className="sp-stat"><b>{price}</b><span>{priceNote}</span></div>
        <div className="sp-stat"><b>{nextStepStatus}</b><span>{nextStep || "next step"}</span></div>
        <div className="sp-stat"><b>{inCount} <small>/ {platforms.length}</small></b><span>{platforms.length ? `platforms · ${statusSummary}` : "platforms"}</span></div>
      </div>

      {sections.length || platforms.length ? (
        <nav className="sp-jump" aria-label="Sections">
          {sections.map((s) => <a key={s.slug} href={`#${s.slug}`}>{s.title}</a>)}
          <a href="#platforms">Creator platforms</a>
        </nav>
      ) : (
        <div className="notice">Nothing written here yet.</div>
      )}

      {sections.map((s) => (
        <details key={s.slug} id={s.slug} className="sp-section" open>
          <summary className="sp-h">
            <span className="sp-h__caret" aria-hidden />
            {s.title}
            {s.status ? <span className={chipClass(s.status)}>{s.status}</span> : null}
            <span className="sp-h__meta">{stamp(s.updated_at)}</span>
          </summary>
          <div className="sp-prose" dangerouslySetInnerHTML={{ __html: s.body_html }} />
        </details>
      ))}

      <details id="platforms" className="sp-section" open>
        <summary className="sp-h"><span className="sp-h__caret" aria-hidden />Creator platforms — the passive side door<span className="sp-h__meta">{lastUpdated ? `updated ${stamp(lastUpdated)}` : ""}</span></summary>
        {platformRule ? <div className="sp-prose"><div className="rule" dangerouslySetInnerHTML={{ __html: platformRule }} /></div> : null}
        {platforms.length ? (
          <div className="sp-table-wrap">
            <table className="rv-plat">
              <thead><tr><th>Platform</th><th>What it is</th><th>Sign-up</th><th>Status</th><th>How it pays</th><th>Notes / rule</th></tr></thead>
              <tbody>
                {platforms.map((p) => (
                  <tr key={p.id}>
                    <td>{p.url ? <a href={p.url} target="_blank" rel="noreferrer">{p.name}</a> : p.name}{p.handle ? <small>{p.handle}</small> : null}</td>
                    <td>{p.what ?? ""}</td>
                    <td><span className={`rv-mode rv-mode--${p.signup_mode}`}>{SIGNUP_LABEL[p.signup_mode] ?? p.signup_mode}</span></td>
                    <td><span className={chipClass(p.status)}>{p.status}</span></td>
                    <td>{p.pay ?? ""}</td>
                    <td>{p.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sp-empty">No platforms listed yet.</div>
        )}
      </details>
    </div>
  );
}
