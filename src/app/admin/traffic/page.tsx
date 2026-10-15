import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

// Traffic: who lands on repamerica.com, where they come from and where they go. Reads the first-party tracker
// (`page_views`, written by /api/track) through the `traffic_report(p_days)` SQL function (service role only).
// No third-party analytics. `/admin` visits are excluded by the function. Round 84.
export const dynamic = "force-dynamic";

type Row = Record<string, string | number | null>;
type Report = {
  days: number; since: string | null; views: number; visitors: number; prev_views: number; prev_visitors: number;
  one_page_pct: number; avg_pages: number; tagged_pct: number;
  by_day: { d: string; views: number; visitors: number }[];
  sources: { src: string; visitors: number }[];
  mediums: { src: string; medium: string; visitors: number }[];
  referrers: { ref: string; visitors: number; views: number }[];
  sections: { sect: string; views: number; visitors: number; landings: number }[];
  top_pages: { path: string; views: number; visitors: number }[];
  landings: { path: string; n: number }[];
  src_to_sect: { src: string; sect: string; visitors: number }[];
  countries: { c: string; visitors: number }[];
  devices: { d: string; visitors: number }[];
};

const RANGES = [7, 28, 90];
const SRC_LABEL: Record<string, string> = { direct: "Direct / apps", youtube: "YouTube", instagram: "Instagram", facebook: "Facebook", search: "Search (Google etc.)", ai: "AI assistants", x: "X", other: "Other sites" };
const label = (s: string) => SRC_LABEL[s] ?? s;
const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);
const delta = (now: number, prev: number) => (prev ? `${now >= prev ? "+" : ""}${Math.round(((now - prev) / prev) * 100)}% vs prior ` : "no prior ");
const PT = "America/Los_Angeles";
const dayLabel = (d: string) => new Date(d + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

export default async function TrafficPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/traffic")}` : "/admin/login?next=/admin/traffic");

  const sp = await searchParams;
  const days = RANGES.includes(Number(sp.days)) ? Number(sp.days) : 28;
  const { data, error } = await supabaseAdmin().rpc("traffic_report", { p_days: days });
  const r = (data ?? null) as Report | null;

  const trackedSince = r?.since ? new Date(r.since).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: PT }) : null;
  const maxDay = r ? Math.max(1, ...r.by_day.map((d) => d.views)) : 1;
  const totalViews = r?.views ?? 0;
  const totalVisitors = r?.visitors ?? 0;
  const sectVisitors = r ? Math.max(1, ...r.sections.map((s) => s.views)) : 1;
  const bySrc = new Map<string, { sect: string; visitors: number }[]>();
  r?.src_to_sect.forEach((x) => bySrc.set(x.src, [...(bySrc.get(x.src) ?? []), { sect: x.sect, visitors: x.visitors }]));
  const mediumsBySrc = new Map<string, { medium: string; visitors: number }[]>();
  r?.mediums.forEach((m) => mediumsBySrc.set(m.src, [...(mediumsBySrc.get(m.src) ?? []), { medium: m.medium, visitors: m.visitors }]));

  return (
    <div>
      <style>{`
        .ra-admin .tr-head { display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:8px 16px; margin-bottom:14px; }
        .ra-admin .tr-range a { display:inline-block; padding:5px 11px; border:1px solid #ddd; border-radius:999px; margin-left:6px; font-size:1.2rem; font-weight:600; text-decoration:none; color:#333; }
        .ra-admin .tr-range a[aria-current=page] { background:#111; color:#fff; border-color:#111; }
        .ra-admin .tr-stats { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:10px; margin:0 0 20px; }
        @media (min-width:900px){ .ra-admin .tr-stats { grid-template-columns:repeat(5, minmax(0,1fr)); } }
        .ra-admin .tr-stat { border:1px solid #e2e2e2; border-radius:10px; padding:12px 14px; background:#fff; min-width:0; }
        .ra-admin .tr-stat b { display:block; font-size:2.2rem; line-height:1.1; }
        .ra-admin .tr-stat span { display:block; font-size:1.2rem; color:#777; margin-top:3px; }
        .ra-admin .tr-stat em { font-style:normal; font-size:1.1rem; color:#0f5c33; }
        .ra-admin .tr-stat em.down { color:#8a1c1c; }
        .ra-admin .tr-grid { display:grid; gap:18px; grid-template-columns:1fr; margin-bottom:22px; }
        @media (min-width:900px){ .ra-admin .tr-grid { grid-template-columns:1fr 1fr; } }
        .ra-admin .tr-box { border:1px solid #e2e2e2; border-radius:10px; background:#fff; padding:14px 16px; min-width:0; }
        .ra-admin .tr-box h2 { font-size:1.5rem; margin:0 0 4px; }
        .ra-admin .tr-box .sub { font-size:1.2rem; color:#777; margin:0 0 12px; }
        .ra-admin .tr-days { display:flex; align-items:flex-end; gap:3px; height:110px; }
        .ra-admin .tr-days div { flex:1; background:#111; border-radius:3px 3px 0 0; min-width:0; position:relative; }
        .ra-admin .tr-days div span { position:absolute; top:100%; left:50%; transform:translateX(-50%); font-size:1rem; color:#999; white-space:nowrap; padding-top:4px; }
        .ra-admin .tr-bar { display:grid; grid-template-columns:minmax(0,1.2fr) minmax(0,2fr) auto; gap:10px; align-items:center; font-size:1.3rem; padding:6px 0; border-bottom:1px solid #f0f0f0; }
        .ra-admin .tr-bar:last-child { border-bottom:0; }
        .ra-admin .tr-bar .lbl { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .ra-admin .tr-bar .lbl small { display:block; color:#888; font-size:1.1rem; white-space:normal; }
        .ra-admin .tr-bar .trk { height:10px; background:#f1f1f1; border-radius:999px; overflow:hidden; }
        .ra-admin .tr-bar .trk i { display:block; height:100%; background:#111; border-radius:999px; }
        .ra-admin .tr-bar .num { font-variant-numeric:tabular-nums; color:#333; white-space:nowrap; }
        .ra-admin .tr-bar .num small { color:#999; }
        .ra-admin .tr-flow { font-size:1.3rem; }
        .ra-admin .tr-flow > div { padding:8px 0; border-bottom:1px solid #f0f0f0; }
        .ra-admin .tr-flow > div:last-child { border-bottom:0; }
        .ra-admin .tr-flow b { display:block; margin-bottom:3px; }
        .ra-admin .tr-flow span { display:inline-block; margin:2px 6px 2px 0; padding:2px 8px; border-radius:999px; background:#f3f3f3; font-size:1.2rem; }
        .ra-admin .tr-table td.tr-path { font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:1.2rem; word-break:break-all; }
        .ra-admin .tr-table td.n { text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
        .ra-admin .tr-table th.n { text-align:right; }
        .ra-admin .tr-note { font-size:1.25rem; color:#666; line-height:1.5; }
        .ra-admin .tr-note code { background:#f3f3f3; padding:1px 5px; border-radius:4px; font-size:1.15rem; }
      `}</style>

      <div className="tr-head">
        <div>
          <h1>Traffic</h1>
          <p className="muted" style={{ margin: 0 }}>Who lands on repamerica.com, where they come from, where they go. First-party tracker, no cookies{trackedSince ? ` — logging since ${trackedSince}` : ""}. Your own /admin visits are excluded.</p>
        </div>
        <div className="tr-range">
          {RANGES.map((d) => (
            <Link key={d} href={`/admin/traffic?days=${d}`} aria-current={d === days ? "page" : undefined}>{d} days</Link>
          ))}
        </div>
      </div>

      {error || !r ? <div className="notice notice--error">Could not load the report{error ? `: ${error.message}` : ""}.</div> : (
        <>
          <div className="tr-stats">
            <div className="tr-stat"><b>{r.visitors.toLocaleString()}</b><span>visitors</span><em className={r.visitors < r.prev_visitors ? "down" : ""}>{delta(r.visitors, r.prev_visitors)}{r.days} d</em></div>
            <div className="tr-stat"><b>{r.views.toLocaleString()}</b><span>page views</span><em className={r.views < r.prev_views ? "down" : ""}>{delta(r.views, r.prev_views)}{r.days} d</em></div>
            <div className="tr-stat"><b>{Math.round(r.visitors / r.days)}</b><span>visitors / day</span></div>
            <div className="tr-stat"><b>{r.avg_pages}</b><span>pages per visitor · {r.one_page_pct}% see one page</span></div>
            <div className="tr-stat"><b>{r.tagged_pct}%</b><span>visitors with a known referrer</span></div>
          </div>

          <div className="tr-grid">
            <div className="tr-box">
              <h2>Views by day</h2>
              <p className="sub">Pacific days. Bars = page views.</p>
              <div className="tr-days" style={{ marginBottom: 22 }}>
                {r.by_day.map((d, i) => (
                  <div key={d.d} style={{ height: `${Math.max(2, (100 * d.views) / maxDay)}%` }} title={`${dayLabel(d.d)}: ${d.views} views · ${d.visitors} visitors`}>
                    {(r.by_day.length <= 10 || i % Math.ceil(r.by_day.length / 8) === 0) && <span>{dayLabel(d.d)}</span>}
                  </div>
                ))}
              </div>
            </div>

            <div className="tr-box">
              <h2>Where they come from</h2>
              <p className="sub">By the first page of the visit. "Direct / apps" = no referrer: the YouTube and Instagram apps, typed-in, bookmarks.</p>
              {r.sources.map((s) => {
                const meds = mediumsBySrc.get(s.src);
                return (
                  <div className="tr-bar" key={s.src}>
                    <div className="lbl">{label(s.src)}{meds?.length ? <small>{meds.map((m) => `${m.medium} ${m.visitors}`).join(" · ")}</small> : null}</div>
                    <div className="trk"><i style={{ width: `${pct(s.visitors, totalVisitors)}%` }} /></div>
                    <div className="num">{s.visitors} <small>· {pct(s.visitors, totalVisitors)}%</small></div>
                  </div>
                );
              })}
            </div>

            <div className="tr-box">
              <h2>Where they go</h2>
              <p className="sub">Page views by section of the site · visitors who landed there first.</p>
              {r.sections.map((s) => (
                <div className="tr-bar" key={s.sect}>
                  <div className="lbl">{s.sect}<small>{s.landings} landed here</small></div>
                  <div className="trk"><i style={{ width: `${pct(s.views, sectVisitors)}%` }} /></div>
                  <div className="num">{s.views} <small>· {pct(s.views, totalViews)}%</small></div>
                </div>
              ))}
            </div>

            <div className="tr-box">
              <h2>Source → section</h2>
              <p className="sub">What each audience actually looks at (visitors, direct excluded).</p>
              <div className="tr-flow">
                {[...bySrc.entries()].map(([src, rows]) => (
                  <div key={src}>
                    <b>{label(src)}</b>
                    {rows.map((x) => <span key={x.sect}>{x.sect} {x.visitors}</span>)}
                  </div>
                ))}
                {!bySrc.size && <p className="muted">Nothing attributable yet.</p>}
              </div>
            </div>

            <div className="tr-box">
              <h2>Landing pages</h2>
              <p className="sub">First page of the visit.</p>
              <table className="tr-table"><thead><tr><th>Page</th><th className="n">Visits</th></tr></thead><tbody>
                {r.landings.map((l) => <tr key={l.path}><td className="tr-path"><a href={l.path} target="_blank" rel="noreferrer">{decodeURIComponent(l.path)}</a></td><td className="n">{l.n}</td></tr>)}
              </tbody></table>
            </div>

            <div className="tr-box">
              <h2>Referring sites</h2>
              <p className="sub">Exact hostnames the browser reported.</p>
              <table className="tr-table"><thead><tr><th>Site</th><th className="n">Visitors</th><th className="n">Views</th></tr></thead><tbody>
                {r.referrers.map((x) => <tr key={x.ref}><td className="tr-path">{x.ref}</td><td className="n">{x.visitors}</td><td className="n">{x.views}</td></tr>)}
              </tbody></table>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 14 }}>
                <div className="tr-note"><b>Countries</b><br />{r.countries.map((c) => `${c.c} ${c.visitors}`).join(" · ")}</div>
                <div className="tr-note"><b>Devices</b><br />{r.devices.map((d) => `${d.d} ${d.visitors}`).join(" · ")}</div>
              </div>
            </div>
          </div>

          <div className="tr-box" style={{ marginBottom: 22 }}>
            <h2>Top pages</h2>
            <p className="sub">All page views in the period.</p>
            <table className="tr-table"><thead><tr><th>Page</th><th className="n">Views</th><th className="n">Visitors</th></tr></thead><tbody>
              {r.top_pages.map((p) => <tr key={p.path}><td className="tr-path"><a href={p.path} target="_blank" rel="noreferrer">{decodeURIComponent(p.path)}</a></td><td className="n">{p.views}</td><td className="n">{p.visitors}</td></tr>)}
            </tbody></table>
          </div>

          <p className="tr-note">"Direct / apps" is mostly people arriving from the YouTube and Instagram apps, which hide where the click came from. Links on the site stay plain by choice (no tracking tags), so read Direct as "social apps + typed-in", not as unknown.</p>
        </>
      )}
    </div>
  );
}
