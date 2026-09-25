import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";

// Read-only. Medi tells Claude when he buys / reads something and the rows in `reading_log` / `reading_copies`
// are updated directly in Supabase — no editing UI by design (owner decision, 2026-09-25).
export const dynamic = "force-dynamic";

type Article = { id: number; handle: string; title: string; published_at: string; meta: { author?: string; list_category?: string } | null };
type Log = { id: number; article_id: number | null; title: string | null; author: string | null; status: "unread" | "reading" | "read"; finished_month: string | null; owned: boolean; translation: string | null; notes: string | null };
type Copy = { id: number; log_id: number; edition: string | null; translation: string | null; paid_cents: number | null; purchased_on: string | null; source: string | null; notes: string | null };
type Row = { key: string; n: number; title: string; author: string | null; handle: string | null; log: Log | null; copies: Copy[] };

const money = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthLabel = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
const dateLabel = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export default async function ReadingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/reading")}` : "/admin/login?next=/admin/reading");

  const db = supabaseAdmin();
  const [{ data: arts }, { data: logs }, { data: copies }] = await Promise.all([
    db.from("articles").select("id, handle, title, published_at, meta").eq("blog", "great-books").eq("is_published", true).order("published_at", { ascending: true }),
    db.from("reading_log").select("*"),
    db.from("reading_copies").select("*").order("purchased_on", { ascending: true, nullsFirst: false }),
  ]);
  const logList = (logs ?? []) as Log[];
  const byArticle = new Map<number, Log>(logList.filter((l) => l.article_id != null).map((l) => [l.article_id as number, l]));
  const copiesByLog = new Map<number, Copy[]>();
  for (const c of (copies ?? []) as Copy[]) copiesByLog.set(c.log_id, [...(copiesByLog.get(c.log_id) ?? []), c]);

  const articles = (arts ?? []) as Article[];
  const isBeyond = (a: Article) => (a.meta?.list_category ?? "").toLowerCase().startsWith("beyond");
  const toRow = (a: Article, n: number): Row => {
    const log = byArticle.get(a.id) ?? null;
    return { key: `a${a.id}`, n, title: a.title, author: a.meta?.author ?? null, handle: a.handle, log, copies: log ? copiesByLog.get(log.id) ?? [] : [] };
  };
  const coreRows = articles.filter((a) => !isBeyond(a)).map(toRow);
  const beyondRows = articles.filter(isBeyond).map(toRow);
  const otherRows: Row[] = logList.filter((l) => l.article_id == null).sort((a, b) => (a.title ?? "").localeCompare(b.title ?? "")).map((l, i) => ({ key: `l${l.id}`, n: i + 1, title: l.title ?? "", author: l.author, handle: null, log: l, copies: copiesByLog.get(l.id) ?? [] }));
  const all = [...coreRows, ...beyondRows, ...otherRows];

  const status = (r: Row) => r.log?.status ?? "unread";
  const owned = (r: Row) => !!r.log?.owned || r.copies.length > 0;
  const view = ["read", "reading", "unread", "owned", "wishlist"].includes(sp.view ?? "") ? (sp.view as string) : "all";
  const keep = (r: Row) => view === "all" || (view === "owned" ? owned(r) : view === "wishlist" ? !owned(r) : status(r) === view);

  const readCount = all.filter((r) => status(r) === "read").length;
  const reading = all.filter((r) => status(r) === "reading");
  const ownedCount = all.filter(owned).length;
  const copyCount = (copies ?? []).length;
  const spent = ((copies ?? []) as Copy[]).reduce((s, c) => s + (c.paid_cents ?? 0), 0);
  const lastFinished = logList.filter((l) => l.status === "read" && l.finished_month).sort((a, b) => (a.finished_month! < b.finished_month! ? 1 : -1))[0];
  const lastBought = ((copies ?? []) as Copy[]).filter((c) => c.purchased_on).sort((a, b) => (a.purchased_on! < b.purchased_on! ? 1 : -1))[0];
  const lastBoughtTitle = lastBought ? all.find((r) => r.log?.id === lastBought.log_id)?.title : null;

  return (
    <div>
      <style>{`
        .ra-admin .rl-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin:0 0 18px; }
        @media (min-width:750px){ .ra-admin .rl-stats { grid-template-columns:repeat(4,1fr); } }
        .ra-admin .rl-stat { border:1px solid #e2e2e2; border-radius:10px; padding:12px 14px; background:#fff; }
        .ra-admin .rl-stat b { display:block; font-size:2.2rem; line-height:1.1; }
        .ra-admin .rl-stat b small { font-size:1.3rem; color:#777; font-weight:600; }
        .ra-admin .rl-stat span { font-size:1.2rem; color:#777; }
        .ra-admin .rl-progress { height:6px; background:#eee; border-radius:999px; overflow:hidden; margin:6px 0 0; }
        .ra-admin .rl-progress i { display:block; height:100%; background:#111; }
        .ra-admin .rl-section { margin-top:22px; }
        .ra-admin .rl-h { font-size:1.2rem; text-transform:uppercase; letter-spacing:.08em; color:#888; margin:0 0 4px; font-weight:600; cursor:pointer; list-style:none; display:flex; align-items:center; gap:8px; user-select:none; padding:6px 0; }
        .ra-admin .rl-h::-webkit-details-marker { display:none; }
        .ra-admin .rl-h__caret { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #999; transition:transform .15s; }
        .ra-admin details:not([open]) .rl-h__caret { transform:rotate(-90deg); }
        .ra-admin .rl-row { display:grid; grid-template-columns: 30px 1fr auto; gap:2px 10px; align-items:start; padding:9px 8px; border-bottom:1px solid #eee; }
        .ra-admin .rl-row--read { background:#f6fbf8; }
        .ra-admin .rl-row--reading { background:#fffbf0; }
        .ra-admin .rl-n { color:#999; font-size:1.2rem; font-variant-numeric:tabular-nums; padding-top:2px; }
        .ra-admin .rl-title { font-weight:600; font-size:1.4rem; color:#111; text-decoration:none; }
        .ra-admin a.rl-title:hover { text-decoration:underline; }
        .ra-admin .rl-author { font-weight:400; color:#777; }
        .ra-admin .rl-chips { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
        .ra-admin .rl-chip { display:inline-block; padding:2px 9px; border-radius:999px; font-size:1.1rem; font-weight:600; white-space:nowrap; }
        .ra-admin .rl-chip--read { background:#d9f2e3; color:#0f5c33; }
        .ra-admin .rl-chip--reading { background:#fff3cd; color:#7a5a00; }
        .ra-admin .rl-chip--owned { background:#eee; color:#555; }
        .ra-admin .rl-chip--want { background:#fff; color:#999; border:1px solid #ddd; }
        .ra-admin .rl-copies { grid-column: 2 / -1; margin:4px 0 0; padding:0; list-style:none; font-size:1.25rem; color:#555; }
        .ra-admin .rl-copies li { display:flex; gap:8px; flex-wrap:wrap; padding:2px 0; }
        .ra-admin .rl-copies .p { color:#111; font-weight:600; font-variant-numeric:tabular-nums; min-width:64px; }
        .ra-admin .rl-copies .d { color:#999; }
        .ra-admin .rl-copies .s { color:#999; }
        .ra-admin .rl-note { grid-column: 2 / -1; font-size:1.2rem; color:#777; font-style:italic; }
      `}</style>
      <h1>Reading</h1>
      <p className="muted">Your library and progress on the Great Books list. Private — nothing here shows on the site. Tell Claude when you buy or finish something and this updates.</p>

      <div className="rl-stats">
        <div className="rl-stat"><b>{readCount} <small>/ {all.length}</small></b><span>books read</span><div className="rl-progress"><i style={{ width: `${Math.round((readCount / Math.max(all.length, 1)) * 100)}%` }} /></div></div>
        <div className="rl-stat"><b style={{ fontSize: "1.4rem" }}>{reading.length ? reading.map((r) => r.title).join(", ") : "—"}</b><span>in progress</span></div>
        <div className="rl-stat"><b>{ownedCount} <small>/ {all.length}</small></b><span>owned · {copyCount} copies · {money(spent)}</span><div className="rl-progress"><i style={{ width: `${Math.round((ownedCount / Math.max(all.length, 1)) * 100)}%`, background: "#999" }} /></div></div>
        <div className="rl-stat"><b style={{ fontSize: "1.5rem" }}>{lastBought ? `${lastBoughtTitle ?? ""}` : "—"}</b><span>last bought{lastBought?.purchased_on ? ` · ${dateLabel(lastBought.purchased_on)}` : ""}{lastFinished ? ` · last finished ${monthLabel(lastFinished.finished_month!)}` : ""}</span></div>
      </div>

      <div className="tabs">
        {([["all", "All"], ["read", "Read"], ["reading", "Reading"], ["unread", "Not yet"], ["owned", "Own"], ["wishlist", "Don't own"]] as const).map(([v, label]) => (
          <Link key={v} href={v === "all" ? "/admin/reading" : `/admin/reading?view=${v}`} aria-current={view === v ? "page" : undefined}>{label}</Link>
        ))}
      </div>

      {([["Great Books", coreRows, "great"], ["Beyond the Great Books", beyondRows, "beyond"], ["Not on either list", otherRows, "other"]] as const).map(([label, rows, key]) => {
        const list = (rows as Row[]).filter(keep);
        if (!list.length) return null;
        return (
          <details key={key} id={key} className="rl-section" open>
            <summary className="rl-h"><span className="rl-h__caret" aria-hidden />{label} <span style={{ color: "#bbb" }}>· {list.length}{view !== "all" ? ` of ${(rows as Row[]).length}` : ""}</span></summary>
            {list.map((r) => {
              const st = status(r);
              return (
                <div key={r.key} className={`rl-row${st === "read" ? " rl-row--read" : st === "reading" ? " rl-row--reading" : ""}`}>
                  <div className="rl-n">{r.n}</div>
                  <div>
                    {r.handle ? <a className="rl-title" href={`/blogs/great-books/${r.handle}`} target="_blank" rel="noreferrer">{r.title}</a> : <span className="rl-title">{r.title}</span>}
                    {r.author ? <span className="rl-author"> — {r.author}</span> : null}
                  </div>
                  <div className="rl-chips">
                    {st === "read" ? <span className="rl-chip rl-chip--read">Read{r.log?.finished_month ? ` · ${monthLabel(r.log.finished_month)}` : ""}</span> : null}
                    {st === "reading" ? <span className="rl-chip rl-chip--reading">{r.log?.notes && /^(partial|mostly)$/i.test(r.log.notes) ? r.log.notes : "Reading"}</span> : null}
                    {owned(r) ? <span className="rl-chip rl-chip--owned">{r.copies.length > 1 ? `${r.copies.length} copies` : "Own"}</span> : <span className="rl-chip rl-chip--want">Don&apos;t own</span>}
                  </div>
                  {r.copies.length ? (
                    <ul className="rl-copies">
                      {r.copies.map((c) => (
                        <li key={c.id}>
                          <span className="p">{c.paid_cents != null ? money(c.paid_cents) : "—"}</span>
                          <span>{[c.edition, c.translation ? `tr. ${c.translation}` : null].filter(Boolean).join(" · ") || "Copy"}</span>
                          {c.purchased_on ? <span className="d">{dateLabel(c.purchased_on)}</span> : null}
                          {c.source ? <span className="s">{c.source}</span> : null}
                          {c.notes ? <span className="s">— {c.notes}</span> : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {r.log?.notes && !/^(partial|mostly)$/i.test(r.log.notes) ? <div className="rl-note">{r.log.notes}</div> : null}
                </div>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}
