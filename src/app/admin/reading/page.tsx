import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import ReadingRow, { type ReadingRowData } from "@/components/admin/ReadingRow";

export const dynamic = "force-dynamic";

type Article = { id: number; handle: string; title: string; published_at: string; meta: { author?: string; list_category?: string } | null };
type Log = { article_id: number; status: "unread" | "reading" | "read"; finished_month: string | null; paid_cents: number | null; edition: string | null; notes: string | null; owned: boolean; purchased_on: string | null; translation: string | null; second_copy: string | null };

const money = (c: number) => `$${(c / 100).toFixed(2)}`;
const monthLabel = (iso: string) => new Date(iso + "T12:00:00Z").toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });

export default async function ReadingPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/reading")}` : "/admin/login?next=/admin/reading");

  const db = supabaseAdmin();
  const [{ data: arts }, { data: logs }] = await Promise.all([
    db.from("articles").select("id, handle, title, published_at, meta").eq("blog", "great-books").eq("is_published", true).order("published_at", { ascending: true }),
    db.from("reading_log").select("*"),
  ]);
  const byId = new Map<number, Log>((logs ?? []).map((l: Log) => [l.article_id, l]));
  const articles = (arts ?? []) as Article[];

  // Same split as the public page: the chronological "Great Books" list, then "Beyond the Great Books".
  const isBeyond = (a: Article) => (a.meta?.list_category ?? "").toLowerCase().startsWith("beyond");
  const core = articles.filter((a) => !isBeyond(a));
  const beyond = articles.filter(isBeyond);

  const toRow = (a: Article, n: number): ReadingRowData => {
    const l = byId.get(a.id);
    return {
      articleId: a.id, n, title: a.title, author: a.meta?.author ?? null, handle: a.handle,
      status: l?.status ?? "unread",
      finishedMonth: l?.finished_month ? l.finished_month.slice(0, 7) : "",
      paid: l?.paid_cents != null ? (l.paid_cents / 100).toFixed(2) : "",
      owned: l?.owned ?? false, purchasedOn: l?.purchased_on ?? "",
      edition: l?.edition ?? "", translation: l?.translation ?? "", secondCopy: l?.second_copy ?? "", notes: l?.notes ?? "",
    };
  };
  const coreRows = core.map((a, i) => toRow(a, i + 1));
  const beyondRows = beyond.map((a, i) => toRow(a, i + 1));
  const all = [...coreRows, ...beyondRows];

  const view = sp.view === "read" ? "read" : sp.view === "reading" ? "reading" : sp.view === "unread" ? "unread" : sp.view === "owned" ? "owned" : sp.view === "wishlist" ? "wishlist" : "all";
  const keep = (r: ReadingRowData) => view === "all" || (view === "owned" ? r.owned : view === "wishlist" ? !r.owned : r.status === view);

  const readCount = all.filter((r) => r.status === "read").length;
  const reading = all.filter((r) => r.status === "reading");
  const spent = (logs ?? []).reduce((s: number, l: Log) => s + (l.paid_cents ?? 0), 0);
  const owned = all.filter((r) => r.owned).length;
  const lastFinished = (logs ?? []).filter((l: Log) => l.status === "read" && l.finished_month).sort((a: Log, b: Log) => (a.finished_month! < b.finished_month! ? 1 : -1))[0];

  return (
    <div>
      <style>{`
        .ra-admin .rl-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; margin:0 0 18px; }
        @media (min-width:750px){ .ra-admin .rl-stats { grid-template-columns:repeat(4,1fr); } }
        .ra-admin .rl-stat { border:1px solid #e2e2e2; border-radius:10px; padding:12px 14px; background:#fff; }
        .ra-admin .rl-stat b { display:block; font-size:2.2rem; line-height:1.1; }
        .ra-admin .rl-stat span { font-size:1.2rem; color:#777; }
        .ra-admin .rl-progress { height:6px; background:#eee; border-radius:999px; overflow:hidden; margin:6px 0 0; }
        .ra-admin .rl-progress i { display:block; height:100%; background:#111; }
        .ra-admin h2.rl-h { font-size:1.2rem; text-transform:uppercase; letter-spacing:.08em; color:#888; margin:26px 0 8px; font-weight:600; }
        .ra-admin .rl-head, .ra-admin .rl-row { display:grid; gap:8px 12px; align-items:center; padding:10px 8px; border-bottom:1px solid #eee; }
        .ra-admin .rl-head { display:none; }
        .ra-admin .rl-row { grid-template-columns: 30px 1fr; grid-template-areas: "n title" "status status" "owned more" "details details"; }
        @media (min-width:900px){
          .ra-admin .rl-head, .ra-admin .rl-row { grid-template-columns: 34px 1fr 250px 90px 150px; }
          .ra-admin .rl-row { grid-template-areas: "n title status owned more" "details details details details details"; }
          .ra-admin .rl-head { display:grid; font-size:1.1rem; text-transform:uppercase; letter-spacing:.05em; color:#888; font-weight:600; border-bottom:1px solid #e5e5e5; }
        }
        .ra-admin .rl-n { grid-area:n; } .ra-admin .rl-title { grid-area:title; } .ra-admin .rl-status { grid-area:status; }
        .ra-admin .rl-owned { grid-area:owned; } .ra-admin .rl-more { grid-area:more; } .ra-admin .rl-details { grid-area:details; }
        .ra-admin .rl-row--read { background:#f6fbf8; }
        .ra-admin .rl-row--reading { background:#fffbf0; }
        .ra-admin .rl-n { color:#999; font-size:1.2rem; font-variant-numeric:tabular-nums; }
        .ra-admin .rl-title a { font-weight:600; font-size:1.4rem; text-decoration:none; color:#111; }
        .ra-admin .rl-title a:hover { text-decoration:underline; }
        .ra-admin .rl-summary { font-size:1.2rem; margin-top:2px; display:flex; flex-wrap:wrap; gap:4px 8px; align-items:center; }
        .ra-admin .rl-summary--empty { color:#bbb; }
        .ra-admin .rl-chip { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.1rem; font-weight:600; }
        .ra-admin .rl-chip--read { background:#d9f2e3; color:#0f5c33; }
        .ra-admin .rl-status { display:inline-flex; border:1px solid #bbb; border-radius:6px; overflow:hidden; justify-self:start; }
        .ra-admin .seg { font:inherit; font-size:1.2rem; font-weight:600; padding:7px 10px; background:#fff; color:#555; border:0; border-right:1px solid #bbb; cursor:pointer; min-height:0; min-width:0; }
        .ra-admin .seg:last-child { border-right:0; }
        .ra-admin .seg--on { background:#111; color:#fff; }
        .ra-admin .seg:disabled { opacity:.6; cursor:default; }
        .ra-admin .rl-owned { font-size:1.3rem; display:flex; align-items:center; gap:6px; white-space:nowrap; cursor:pointer; }
        .ra-admin .rl-owned input { width:16px; height:16px; margin:0; }
        .ra-admin .rl-more { display:flex; align-items:center; gap:8px; justify-content:flex-end; }
        .ra-admin .rl-state { font-size:1.1rem; color:#777; white-space:nowrap; }
        .ra-admin .rl-state--saved { color:#0f5c33; } .ra-admin .rl-state--error { color:#8a1c1c; font-weight:600; }
        .ra-admin .rl-details { display:grid; grid-template-columns:1fr 1fr; gap:10px 12px; padding:10px 0 4px; }
        @media (min-width:750px){ .ra-admin .rl-details { grid-template-columns:repeat(3,1fr); } }
        .ra-admin .rl-details label { font-size:1.1rem; text-transform:uppercase; letter-spacing:.05em; color:#888; font-weight:600; display:flex; flex-direction:column; gap:4px; }
        .ra-admin .rl-details__wide { grid-column:1 / -1; }
        .ra-admin .rl-details input { font:inherit; font-size:1.3rem; padding:7px 9px; border:1px solid #bbb; border-radius:6px; width:100%; min-width:0; -webkit-appearance:none; appearance:none; background:#fff; min-height:36px; text-transform:none; letter-spacing:0; color:#111; }
        .ra-admin .rl-details input:disabled { background:#f5f5f5; color:#aaa; }
        .ra-admin .rl-money { display:flex; align-items:center; gap:4px; }
        .ra-admin .rl-dollar { color:#777; font-size:1.3rem; }
      `}</style>
      <h1>Reading</h1>
      <p className="muted">Your own progress on the Great Books list. Private — nothing here shows on the site. Changes save as you make them.</p>

      <div className="rl-stats">
        <div className="rl-stat"><b>{readCount} <span style={{ fontSize: "1.3rem", color: "#777" }}>/ {all.length}</span></b><span>books read</span><div className="rl-progress"><i style={{ width: `${all.length ? Math.round((readCount / all.length) * 100) : 0}%` }} /></div></div>
        <div className="rl-stat"><b style={{ fontSize: "1.5rem" }}>{reading.length ? reading.map((r) => r.title).join(", ") : "—"}</b><span>currently reading</span></div>
        <div className="rl-stat"><b>{owned} <span style={{ fontSize: "1.3rem", color: "#777" }}>/ {all.length}</span></b><span>owned · {money(spent)} spent</span><div className="rl-progress"><i style={{ width: `${all.length ? Math.round((owned / all.length) * 100) : 0}%`, background: "#999" }} /></div></div>
        <div className="rl-stat"><b style={{ fontSize: "1.5rem" }}>{lastFinished ? monthLabel(lastFinished.finished_month!) : "—"}</b><span>last finished</span></div>
      </div>

      <div className="tabs">
        <Link href="/admin/reading" aria-current={view === "all" ? "page" : undefined}>All</Link>
        <Link href="/admin/reading?view=read" aria-current={view === "read" ? "page" : undefined}>Read</Link>
        <Link href="/admin/reading?view=reading" aria-current={view === "reading" ? "page" : undefined}>Reading</Link>
        <Link href="/admin/reading?view=unread" aria-current={view === "unread" ? "page" : undefined}>Not yet</Link>
        <Link href="/admin/reading?view=owned" aria-current={view === "owned" ? "page" : undefined}>Own</Link>
        <Link href="/admin/reading?view=wishlist" aria-current={view === "wishlist" ? "page" : undefined}>Don&apos;t own</Link>
      </div>

      {[["Great Books", coreRows], ["Beyond the Great Books", beyondRows]].map(([label, rows]) => {
        const list = (rows as ReadingRowData[]).filter(keep);
        if (!list.length) return null;
        return (
          <section key={label as string}>
            <h2 className="rl-h">{label as string} <span style={{ color: "#bbb" }}>· {list.length}</span></h2>
            <div className="rl-head"><div>#</div><div>Book</div><div>Status</div><div>Owned</div><div></div></div>
            {list.map((r) => <ReadingRow key={r.articleId} row={r} />)}
          </section>
        );
      })}
    </div>
  );
}
