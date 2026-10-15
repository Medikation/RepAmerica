import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

// Rep America Social: the plan to turn repamerica.com into a social platform for the audience.
// Read-only by design, same as /admin/revenue: the content lives in Supabase — `social_settings` (header facts)
// and `social_sections` (outline sections, trusted HTML) — and Medi tells Claude what changed; Claude updates the rows.
// RLS is on with no policies (service role only). A section with status 'hidden' is skipped (retire instead of delete).
export const dynamic = "force-dynamic";

type Setting = { key: string; value: string | null };
type Section = { id: number; slug: string; title: string; status: string | null; body_html: string; sort_order: number; updated_at: string };

const PT = "America/Los_Angeles";
const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: PT });
const chipClass = (s: string) => `rv-chip rv-chip--${s.toLowerCase().replace(/[^a-z]+/g, "-")}`;

export default async function SocialPage() {
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/social")}` : "/admin/login?next=/admin/social");

  const db = supabaseAdmin();
  const [{ data: settingRows }, { data: sectionRows }] = await Promise.all([
    db.from("social_settings").select("key, value"),
    db.from("social_sections").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true }),
  ]);
  const settings = new Map<string, string>(((settingRows ?? []) as Setting[]).filter((s) => s.value != null).map((s) => [s.key, s.value as string]));
  const sections = ((sectionRows ?? []) as Section[]).filter((s) => s.status !== "hidden");

  const goal = settings.get("goal") ?? "Not set";
  const goalLabel = settings.get("goal_label") ?? "the plan";
  const status = settings.get("status") ?? "—";
  const statusNote = settings.get("status_note") ?? "status";
  const money = settings.get("money") ?? "—";
  const moneyNote = settings.get("money_note") ?? "money";

  return (
    <div>
      <style>{`
        .ra-admin .sp-stats { display:grid; grid-template-columns:minmax(0,1fr); gap:10px; margin:0 0 18px; }
        @media (min-width:750px){ .ra-admin .sp-stats { grid-template-columns:2fr 1fr 1fr; } }
        .ra-admin .sp-stat { border:1px solid #e2e2e2; border-radius:10px; padding:10px 14px; background:#fff; min-width:0; overflow:hidden; }
        .ra-admin .sp-stat b { display:block; font-size:1.8rem; line-height:1.15; }
        .ra-admin .sp-stat--wide b { font-size:1.5rem; }
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
        .ra-admin .sp-prose li { margin:6px 0; }
        .ra-admin .sp-prose li > p { margin:0; }
        .ra-admin .sp-prose a { color:#111; }
        .ra-admin .sp-prose .rule { background:#fff8e6; border:1px solid #f1e2b3; padding:10px 14px; border-radius:8px; margin:10px 0 12px; }
        .ra-admin .sp-prose .rule > :last-child { margin-bottom:0; }
        .ra-admin .sp-prose .note { background:#f6f6f6; border-radius:8px; padding:10px 14px; margin:10px 0 12px; color:#444; }
        .ra-admin .sp-prose .note > :last-child { margin-bottom:0; }
        .ra-admin .sp-prose .quote { font-style:italic; color:#333; font-size:1.5rem; }
        .ra-admin .rv-chip { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:700; letter-spacing:.03em; text-transform:uppercase; white-space:nowrap; border:1px solid #ddd; color:#777; background:#fff; vertical-align:middle; }
        .ra-admin .rv-chip--developing, .ra-admin .rv-chip--in-progress, .ra-admin .rv-chip--planning { background:#fff3cd; color:#7a5a00; border-color:#fff3cd; }
        .ra-admin .rv-chip--decided, .ra-admin .rv-chip--done, .ra-admin .rv-chip--live { background:#d9f2e3; color:#0f5c33; border-color:#d9f2e3; }
        .ra-admin .rv-chip--parked, .ra-admin .rv-chip--paused, .ra-admin .rv-chip--off { background:#eee; color:#555; border-color:#eee; }
        .ra-admin .rv-chip--not-yet, .ra-admin .rv-chip--not-started { background:#fff; color:#888; }
      `}</style>
      <h1>Rep America Social</h1>
      <p className="muted">The plan to turn repamerica.com into a social platform for the Rep America audience. Private — nothing here shows on the site. Tell Claude what changes and this updates.</p>

      <div className="sp-stats">
        <div className="sp-stat sp-stat--wide"><b>{goal}</b><span>{goalLabel}</span></div>
        <div className="sp-stat"><b>{status}</b><span>{statusNote}</span></div>
        <div className="sp-stat"><b>{money}</b><span>{moneyNote}</span></div>
      </div>

      {sections.length ? (
        <nav className="sp-jump" aria-label="Sections">
          {sections.map((s) => <a key={s.slug} href={`#${s.slug}`}>{s.title}</a>)}
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
    </div>
  );
}
