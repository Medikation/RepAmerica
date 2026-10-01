import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

// The Rep America Live playbook: strategy, segments, schedule, title/thumbnail system and the 60-day pilot.
// Read-only by design (same as /admin/reading): the content lives in Supabase — `show_settings` (header facts),
// `show_playbook` (sections, trusted HTML), `show_scorecard` (weekly pilot numbers), `show_episodes` (what aired) —
// and Medi tells Claude what changed; Claude updates the rows directly. RLS is on with no policies (service role only).
export const dynamic = "force-dynamic";

type Setting = { key: string; value: string | null };
type Section = { id: number; slug: string; title: string; body_html: string; sort_order: number; updated_at: string };
type Score = { id: number; week_start: string; uploads: number | null; views: number | null; avg_view_duration_sec: number | null; ctr_pct: number | null; subs_gained: number | null; rpm_cents: number | null; revenue_cents: number | null; notes: string | null };
type Episode = { id: number; aired_on: string; segment: "reading" | "beat" | "stronger" | "live" | "other"; title: string; youtube_url: string | null; is_cut: boolean; views: number | null; notes: string | null };

const SEGMENT_LABEL: Record<Episode["segment"], string> = { reading: "Reading", beat: "The Beat", stronger: "Stronger", live: "Live", other: "Other" };
const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateLabel = (iso: string) => new Date(iso.slice(0, 10) + "T12:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const stamp = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const num = (n: number) => n.toLocaleString("en-US");

export default async function ShowPage() {
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/show")}` : "/admin/login?next=/admin/show");

  const db = supabaseAdmin();
  const [{ data: settingRows }, { data: sectionRows }, { data: scoreRows }, { data: episodeRows }] = await Promise.all([
    db.from("show_settings").select("key, value"),
    db.from("show_playbook").select("*").order("sort_order", { ascending: true }).order("id", { ascending: true }),
    db.from("show_scorecard").select("*").order("week_start", { ascending: false }),
    db.from("show_episodes").select("*").order("aired_on", { ascending: false }).order("id", { ascending: false }).limit(40),
  ]);
  const settings = new Map<string, string>(((settingRows ?? []) as Setting[]).filter((s) => s.value != null).map((s) => [s.key, s.value as string]));
  const sections = (sectionRows ?? []) as Section[];
  const scores = (scoreRows ?? []) as Score[];
  const episodes = (episodeRows ?? []) as Episode[];

  const showName = settings.get("show_name") ?? "Rep America Live";
  const schedule = settings.get("schedule") ?? "Not set";
  const scheduleNote = settings.get("schedule_note") ?? "";
  const pilotDays = Number(settings.get("pilot_days") ?? 60) || 60;
  const pilotStart = settings.get("pilot_start") ?? null;
  const todayPT = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const pilotDay = pilotStart ? Math.floor((Date.UTC(todayPT.getFullYear(), todayPT.getMonth(), todayPT.getDate()) - Date.parse(pilotStart + "T00:00:00Z")) / 86400000) + 1 : null;
  const pilotPct = pilotDay != null ? Math.max(0, Math.min(100, Math.round((pilotDay / pilotDays) * 100))) : 0;
  const cuts = episodes.filter((e) => e.is_cut);
  const cutViews = cuts.reduce((s, e) => s + (e.views ?? 0), 0);
  const lastUpdated = sections.map((s) => s.updated_at).sort().at(-1) ?? null;

  return (
    <div>
      <style>{`
        .ra-admin .sp-stats { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; margin:0 0 18px; }
        @media (min-width:1000px){ .ra-admin .sp-stats { grid-template-columns:repeat(4, minmax(0,1fr)); } }
        .ra-admin .sp-stat { border:1px solid #e2e2e2; border-radius:10px; padding:10px 14px; background:#fff; min-width:0; overflow:hidden; }
        .ra-admin .sp-stat b { display:block; font-size:1.8rem; line-height:1.15; }
        .ra-admin .sp-stat b small { font-size:1.3rem; color:#777; font-weight:600; }
        .ra-admin .sp-stat span { display:block; font-size:1.2rem; color:#777; margin-top:2px; overflow-wrap:normal; word-break:normal; }
        .ra-admin .sp-progress { height:6px; background:#eee; border-radius:999px; overflow:hidden; margin:6px 0 0; }
        .ra-admin .sp-progress i { display:block; height:100%; background:#111; }
        .ra-admin .sp-jump { display:flex; flex-wrap:wrap; gap:6px 8px; margin:0 0 18px; }
        .ra-admin .sp-jump a { font-size:1.2rem; font-weight:600; text-decoration:none; color:#333; border:1px solid #ddd; border-radius:999px; padding:4px 10px; white-space:nowrap; }
        .ra-admin .sp-jump a:hover { border-color:#111; color:#111; }
        .ra-admin .sp-section { margin-top:14px; border:1px solid #e2e2e2; border-radius:10px; background:#fff; padding:6px 16px 14px; scroll-margin-top:16px; }
        .ra-admin .sp-h { font-size:1.5rem; font-weight:700; color:#111; margin:0; cursor:pointer; list-style:none; display:flex; align-items:center; gap:10px; user-select:none; padding:8px 0; }
        .ra-admin .sp-h::-webkit-details-marker { display:none; }
        .ra-admin .sp-h__caret { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #999; transition:transform .15s; flex:0 0 auto; }
        .ra-admin details:not([open]) .sp-h__caret { transform:rotate(-90deg); }
        .ra-admin .sp-h__meta { font-size:1.15rem; color:#aaa; font-weight:500; margin-left:auto; white-space:nowrap; }
        .ra-admin .sp-prose { font-size:1.4rem; line-height:1.6; color:#222; max-width:86ch; padding-top:4px; }
        .ra-admin .sp-prose > :first-child { margin-top:0; }
        .ra-admin .sp-prose h3 { font-size:1.45rem; font-weight:700; margin:18px 0 6px; }
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
        .ra-admin .sp-prose .tag { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.1rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; vertical-align:middle; }
        .ra-admin .sp-prose .tag--reading { background:#fbead3; color:#8a4b00; }
        .ra-admin .sp-prose .tag--beat { background:#fde0e0; color:#9b1c1c; }
        .ra-admin .sp-prose .tag--stronger { background:#dde8f7; color:#1d4a8a; }
        .ra-admin .sp-prose .tag--live { background:#eee; color:#444; }
        .ra-admin .sp-table-wrap { overflow-x:auto; }
        .ra-admin .sp-num { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
        .ra-admin .sp-seg { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.1rem; font-weight:700; white-space:nowrap; background:#eee; color:#444; }
        .ra-admin .sp-seg--reading { background:#fbead3; color:#8a4b00; }
        .ra-admin .sp-seg--beat { background:#fde0e0; color:#9b1c1c; }
        .ra-admin .sp-seg--stronger { background:#dde8f7; color:#1d4a8a; }
        .ra-admin .sp-empty { font-size:1.3rem; color:#777; padding:6px 0 2px; }
      `}</style>
      <h1>Show</h1>
      <p className="muted">The {showName} playbook — strategy, the three segments, schedule, titles and thumbnails, and the pilot scorecard. Private — nothing here shows on the site. Tell Claude what changes and this updates.</p>

      <div className="sp-stats">
        <div className="sp-stat"><b>{schedule}</b><span>{scheduleNote || "schedule"}</span></div>
        <div className="sp-stat">
          {pilotDay != null ? (
            <>
              <b>Day {pilotDay} <small>/ {pilotDays}</small></b>
              <span>pilot · started {dateLabel(pilotStart!)}</span>
              <div className="sp-progress"><i style={{ width: `${pilotPct}%` }} /></div>
            </>
          ) : (
            <>
              <b>Not started</b>
              <span>{pilotDays}-day pilot · set a start date</span>
            </>
          )}
        </div>
        <div className="sp-stat">
          {cuts.length ? (
            <>
              <b>{cuts.length} <small>cuts</small></b>
              <span>{cutViews ? `${num(cutViews)} views logged` : "views not logged yet"}</span>
            </>
          ) : (
            <>
              <b>3 <small>segments</small></b>
              <span>Reading · The Beat · Stronger Americans</span>
            </>
          )}
        </div>
        <div className="sp-stat"><b>{sections.length} <small>sections</small></b><span>{lastUpdated ? `updated ${stamp(lastUpdated)}` : "nothing written yet"}</span></div>
      </div>

      {sections.length ? (
        <nav className="sp-jump" aria-label="Sections">
          {sections.map((s) => <a key={s.slug} href={`#${s.slug}`}>{s.title}</a>)}
          <a href="#scorecard">Scorecard</a>
          {episodes.length ? <a href="#episodes">Episodes</a> : null}
        </nav>
      ) : (
        <div className="notice">The playbook has no sections yet.</div>
      )}

      {sections.map((s) => (
        <details key={s.slug} id={s.slug} className="sp-section" open>
          <summary className="sp-h"><span className="sp-h__caret" aria-hidden />{s.title}<span className="sp-h__meta">{stamp(s.updated_at)}</span></summary>
          <div className="sp-prose" dangerouslySetInnerHTML={{ __html: s.body_html }} />
        </details>
      ))}

      <details id="scorecard" className="sp-section" open>
        <summary className="sp-h"><span className="sp-h__caret" aria-hidden />Scorecard<span className="sp-h__meta">{scores.length ? `${scores.length} week${scores.length === 1 ? "" : "s"}` : "weekly"}</span></summary>
        {scores.length ? (
          <div className="sp-table-wrap">
            <table>
              <thead>
                <tr><th>Week of</th><th className="sp-num">Uploads</th><th className="sp-num">Views</th><th className="sp-num">Avg view</th><th className="sp-num">CTR</th><th className="sp-num">Subs</th><th className="sp-num">RPM</th><th className="sp-num">Revenue</th><th>Notes</th></tr>
              </thead>
              <tbody>
                {scores.map((w) => (
                  <tr key={w.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{dateLabel(w.week_start)}</td>
                    <td className="sp-num">{w.uploads ?? "—"}</td>
                    <td className="sp-num">{w.views != null ? num(w.views) : "—"}</td>
                    <td className="sp-num">{w.avg_view_duration_sec != null ? mmss(w.avg_view_duration_sec) : "—"}</td>
                    <td className="sp-num">{w.ctr_pct != null ? `${w.ctr_pct}%` : "—"}</td>
                    <td className="sp-num">{w.subs_gained != null ? (w.subs_gained >= 0 ? `+${num(w.subs_gained)}` : num(w.subs_gained)) : "—"}</td>
                    <td className="sp-num">{w.rpm_cents != null ? money(w.rpm_cents) : "—"}</td>
                    <td className="sp-num">{w.revenue_cents != null ? money(w.revenue_cents) : "—"}</td>
                    <td>{w.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sp-empty">No weeks logged yet. Once the pilot runs, read the week off YouTube Studio (uploads, views, average view duration, click-through, subscribers from uploads, RPM, revenue) and tell Claude — one row per week lands here.</div>
        )}
      </details>

      {episodes.length ? (
        <details id="episodes" className="sp-section" open>
          <summary className="sp-h"><span className="sp-h__caret" aria-hidden />Episodes<span className="sp-h__meta">latest {episodes.length}</span></summary>
          <div className="sp-table-wrap">
            <table>
              <thead><tr><th>Aired</th><th>Segment</th><th>Title</th><th className="sp-num">Views</th><th>Notes</th></tr></thead>
              <tbody>
                {episodes.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap" }}>{dateLabel(e.aired_on)}</td>
                    <td><span className={`sp-seg sp-seg--${e.segment}`}>{SEGMENT_LABEL[e.segment]}</span>{e.is_cut ? "" : <span className="muted" style={{ marginLeft: 6 }}>live only</span>}</td>
                    <td>{e.youtube_url ? <a href={e.youtube_url} target="_blank" rel="noreferrer">{e.title}</a> : e.title}</td>
                    <td className="sp-num">{e.views != null ? num(e.views) : "—"}</td>
                    <td>{e.notes ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}
    </div>
  );
}
