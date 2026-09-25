"use client";
import { useState, useTransition } from "react";
import { saveReading } from "@/app/admin/actions";

export type ReadingRowData = {
  articleId: number;
  n: number;
  title: string;
  author: string | null;
  handle: string;
  status: "unread" | "reading" | "read";
  finishedMonth: string; // "YYYY-MM" or ""
  paid: string;          // "12.99" or ""
  edition: string;
  notes: string;
};

/** One book. Every change saves immediately (server action); the row shows a small "Saved" / "Error" state. */
export default function ReadingRow({ row }: { row: ReadingRowData }) {
  const [s, setS] = useState(row);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [pending, start] = useTransition();

  const commit = (next: ReadingRowData) => {
    setS(next);
    setState("saving");
    start(async () => {
      const r = await saveReading({ articleId: next.articleId, status: next.status, finishedMonth: next.finishedMonth, paid: next.paid, edition: next.edition, notes: next.notes });
      setState(r.ok ? "saved" : "error");
      if (r.ok) setTimeout(() => setState("idle"), 1200);
    });
  };

  const cls = s.status === "read" ? "rl-row rl-row--read" : s.status === "reading" ? "rl-row rl-row--reading" : "rl-row";
  return (
    <div className={cls}>
      <div className="rl-n">{s.n}</div>
      <div className="rl-title">
        <a href={`/blogs/great-books/${s.handle}`} target="_blank" rel="noreferrer">{s.title}</a>
        {s.author ? <div className="muted">{s.author}</div> : null}
      </div>
      <div className="rl-status" role="group" aria-label="Status">
        {(["unread", "reading", "read"] as const).map((v) => (
          <button key={v} type="button" className={s.status === v ? "seg seg--on" : "seg"} disabled={pending} onClick={() => commit({ ...s, status: v, finishedMonth: v === "read" ? (s.finishedMonth || defaultMonth()) : s.finishedMonth })}>
            {v === "unread" ? "Not yet" : v === "reading" ? "Reading" : "Read"}
          </button>
        ))}
      </div>
      <div className="rl-month">
        <input type="month" aria-label="Month finished" value={s.finishedMonth} disabled={s.status !== "read"} onChange={(e) => commit({ ...s, finishedMonth: e.target.value })} />
      </div>
      <div className="rl-paid">
        <span className="rl-dollar">$</span>
        <input type="text" inputMode="decimal" aria-label="Price paid" placeholder="0.00" value={s.paid} onChange={(e) => setS({ ...s, paid: e.target.value })} onBlur={(e) => { if (e.target.value !== row.paid || state === "error") commit({ ...s, paid: e.target.value }); }} />
      </div>
      <div className="rl-notes">
        <input type="text" aria-label="Edition / notes" placeholder="Edition, translator, notes…" value={s.notes} onChange={(e) => setS({ ...s, notes: e.target.value })} onBlur={(e) => { if (e.target.value !== row.notes) commit({ ...s, notes: e.target.value }); }} />
      </div>
      <div className={`rl-state rl-state--${state}`}>{state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : state === "error" ? "Not saved" : ""}</div>
    </div>
  );
}

function defaultMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
