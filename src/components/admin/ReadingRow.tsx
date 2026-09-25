"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveReading } from "@/app/admin/actions";

export type ReadingRowData = {
  articleId: number;
  n: number;
  title: string;
  author: string | null;
  handle: string;
  status: "unread" | "reading" | "read";
  finishedMonth: string; // "YYYY-MM" or ""
  owned: boolean;
  paid: string;          // "12.99" or ""
  purchasedOn: string;   // "YYYY-MM-DD" or ""
  edition: string;
  translation: string;
  secondCopy: string;
  notes: string;
};

const MONTH_FMT = (m: string) => { const [y, mm] = m.split("-"); return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][Number(mm) - 1]} ${y}`; };
const DATE_FMT = (d: string) => { const [y, m, dd] = d.split("-"); return `${Number(m)}/${Number(dd)}/${y}`; };

/** One book. Status / owned save immediately; text fields save on blur. The row shows a small "Saved" / "Not saved" state. */
export default function ReadingRow({ row }: { row: ReadingRowData }) {
  const [s, setS] = useState(row);
  const [saved, setSaved] = useState(row);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pending, start] = useTransition();
  const router = useRouter();

  const commit = (next: ReadingRowData) => {
    setS(next);
    setState("saving");
    start(async () => {
      const r = await saveReading({ articleId: next.articleId, status: next.status, finishedMonth: next.finishedMonth, paid: next.paid, edition: next.edition, notes: next.notes, owned: next.owned, purchasedOn: next.purchasedOn, translation: next.translation, secondCopy: next.secondCopy });
      setState(r.ok ? "saved" : "error");
      if (r.ok) { setSaved(next); router.refresh(); setTimeout(() => setState("idle"), 1200); }
    });
  };
  const blur = (key: keyof ReadingRowData) => () => { if (s[key] !== saved[key] || state === "error") commit(s); };

  const summary = [
    s.edition, s.translation ? `tr. ${s.translation}` : null,
    s.paid ? `$${s.paid}` : null, s.purchasedOn ? DATE_FMT(s.purchasedOn) : null,
    s.secondCopy ? "2nd copy" : null, s.notes,
  ].filter(Boolean).join(" · ");

  const cls = "rl-row" + (s.status === "read" ? " rl-row--read" : s.status === "reading" ? " rl-row--reading" : "") + (open ? " rl-row--open" : "");
  return (
    <div className={cls}>
      <div className="rl-n">{s.n}</div>
      <div className="rl-title">
        <a href={`/blogs/great-books/${s.handle}`} target="_blank" rel="noreferrer">{s.title}</a>
        {s.author ? <span className="muted"> — {s.author}</span> : null}
        <div className="rl-summary">
          {s.status === "read" && s.finishedMonth ? <span className="rl-chip rl-chip--read">Finished {MONTH_FMT(s.finishedMonth)}</span> : null}
          {summary ? <span className="muted">{summary}</span> : <span className="muted rl-summary--empty">No details yet</span>}
        </div>
      </div>
      <div className="rl-status" role="group" aria-label="Status">
        {(["unread", "reading", "read"] as const).map((v) => (
          <button key={v} type="button" className={s.status === v ? "seg seg--on" : "seg"} disabled={pending} onClick={() => commit({ ...s, status: v, finishedMonth: v === "read" ? (s.finishedMonth || defaultMonth()) : "" })}>
            {v === "unread" ? "Not yet" : v === "reading" ? "Reading" : "Read"}
          </button>
        ))}
      </div>
      <label className="rl-owned">
        <input type="checkbox" checked={s.owned} disabled={pending} onChange={(e) => commit({ ...s, owned: e.target.checked })} /> Own it
      </label>
      <div className="rl-more">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setOpen(!open)}>{open ? "Close" : "Details"}</button>
        <span className={`rl-state rl-state--${state}`}>{state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}</span>
      </div>
      {open ? (
        <div className="rl-details">
          <label>Finished<input type="month" value={s.finishedMonth} disabled={s.status !== "read"} onChange={(e) => commit({ ...s, finishedMonth: e.target.value })} /></label>
          <label>Paid<span className="rl-money"><span className="rl-dollar">$</span><input type="text" inputMode="decimal" placeholder="0.00" value={s.paid} onChange={(e) => setS({ ...s, paid: e.target.value })} onBlur={blur("paid")} /></span></label>
          <label>Purchased<input type="date" value={s.purchasedOn} onChange={(e) => commit({ ...s, purchasedOn: e.target.value })} /></label>
          <label>Edition<input type="text" placeholder="Folio Society, Penguin Classics…" value={s.edition} onChange={(e) => setS({ ...s, edition: e.target.value })} onBlur={blur("edition")} /></label>
          <label>Translation<input type="text" placeholder="Translator" value={s.translation} onChange={(e) => setS({ ...s, translation: e.target.value })} onBlur={blur("translation")} /></label>
          <label>Second copy<input type="text" placeholder="Edition, price, date, translator" value={s.secondCopy} onChange={(e) => setS({ ...s, secondCopy: e.target.value })} onBlur={blur("secondCopy")} /></label>
          <label className="rl-details__wide">Notes<input type="text" placeholder="Anything else" value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} onBlur={blur("notes")} /></label>
        </div>
      ) : null}
    </div>
  );
}

function defaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
