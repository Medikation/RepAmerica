import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { fetchCalendarEvents, zonedDayStart, dayKey, addDays, PT, CALENDAR_USER, type CalEvent } from "@/lib/googleCalendar";

// The producer's desk: one page Medi opens before going live. Three things, top to bottom —
//   1. today's timeline: his Google Calendar (medi@ + team@, read live through a service account) merged with the
//      Trump / White House / campaign events in `show_events`, in Pacific time, with LIVE badges and overlap flags;
//   2. today's rundown: the outline for the stream (`show_rundowns`, one row per air date; Claude drafts, Medi reads);
//   3. the next 7 days, compact, with invites still waiting on a reply flagged.
// Read-only like /admin/show and /admin/reading. The Show tab keeps the strategy and the full 10-day event list.
export const dynamic = "force-dynamic";

type ShowEvent = { id: number; starts_at: string; ends_at: string | null; all_day: boolean; title: string; kind: "trump" | "white-house" | "campaign" | "other"; location: string | null; press: string | null; stream_url: string | null; source_url: string | null; status: "scheduled" | "tentative" | "covered" | "skipped" | "canceled"; notes: string | null };
type Block = { kind?: "open" | "event" | "reading" | "beat" | "stronger" | "close" | "other"; title?: string; body_html?: string; minutes?: number; is_cut?: boolean; url?: string };
type Rundown = { id: number; air_date: string; starts_at: string | null; minutes: number | null; status: "planned" | "aired" | "skipped"; title: string | null; lead: string | null; blocks: Block[]; notes: string | null; updated_at: string };
type Setting = { key: string; value: string | null };

type Item = {
  id: string;
  source: "cal" | "trump" | "show";
  title: string;
  startsAt: number;
  endsAt: number | null; // null = open-ended (Trump events rarely publish an end)
  allDay: boolean;
  live: boolean;
  done: boolean;
  dim: boolean; // declined / free / canceled / skipped — stays visible, drops out of overlap checks
  kindLabel: string; // badge text
  kindClass: string;
  meta: string | null;
  joinUrl: string | null;
  joinLabel: string;
  otherJoinUrls: string[];
  link: string | null; // open in Google Calendar / source
  response: CalEvent["response"];
  status: ShowEvent["status"] | null;
  conflicts: string[];
};

const KIND_LABEL: Record<ShowEvent["kind"], string> = { trump: "Trump", "white-house": "White House", campaign: "Campaign", other: "Event" };
const BLOCK_LABEL: Record<NonNullable<Block["kind"]>, string> = { open: "Open", event: "Live cover", reading: "Reading", beat: "The Beat", stronger: "Stronger", close: "Close", other: "Block" };
const TRUMP_DEFAULT_MIN = 90; // for overlap checks when an event has no end time

const timePT = (ms: number) => new Date(ms).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: PT });
const timeET = (ms: number) => new Date(ms).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
const dayLabel = (key: string) => new Date(zonedDayStart(key) + 12 * 3600 * 1000).toLocaleString("en-US", { weekday: "long", month: "short", day: "numeric", timeZone: PT });
const dayShort = (key: string) => new Date(zonedDayStart(key) + 12 * 3600 * 1000).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: PT });
const stampPT = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: PT });
function relative(ms: number, now: number): string {
  const d = Math.round((ms - now) / 60000);
  const abs = Math.abs(d);
  const txt = abs < 60 ? `${abs}m` : abs < 60 * 24 ? `${Math.floor(abs / 60)}h ${abs % 60 ? `${abs % 60}m` : ""}`.trim() : `${Math.round(abs / 60 / 24)}d`;
  return d >= 0 ? `in ${txt}` : `${txt} ago`;
}
const effectiveEnd = (i: Item) => i.endsAt ?? i.startsAt + TRUMP_DEFAULT_MIN * 60000;

export default async function TodayPage() {
  const state = await getAdmin();
  if (!state.user) redirect(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent("/admin/today")}` : "/admin/login?next=/admin/today");

  const now = Date.now();
  const todayKey = dayKey(now);
  const dayStart = zonedDayStart(todayKey);
  const windowEnd = zonedDayStart(addDays(todayKey, 8)); // today + 7 days
  const db = supabaseAdmin();

  const [calendar, { data: eventRows }, { data: rundownRows }, { data: settingRows }] = await Promise.all([
    fetchCalendarEvents(dayStart, windowEnd),
    db.from("show_events").select("*").gte("starts_at", new Date(dayStart - 12 * 3600 * 1000).toISOString()).lt("starts_at", new Date(windowEnd).toISOString()).order("starts_at", { ascending: true }).limit(120),
    db.from("show_rundowns").select("*").gte("air_date", todayKey).lte("air_date", addDays(todayKey, 7)).order("air_date", { ascending: true }),
    db.from("show_settings").select("key, value"),
  ]);
  const settings = new Map<string, string>(((settingRows ?? []) as Setting[]).filter((s) => s.value != null).map((s) => [s.key, s.value as string]));
  const showName = settings.get("show_name") ?? "Rep America Live";
  const schedule = settings.get("schedule") ?? "Not set";
  const rundowns = (rundownRows ?? []) as Rundown[];
  const todayRundown = rundowns.find((r) => r.air_date === todayKey) ?? null;
  const nextRundown = todayRundown ?? rundowns.find((r) => r.air_date > todayKey) ?? null;

  /* ---------- build the unified item list ---------- */
  const items: Item[] = [];
  for (const e of calendar.events) {
    const live = !e.allDay && e.startsAt <= now && e.endsAt > now;
    items.push({
      id: e.key, source: "cal", title: e.title, startsAt: e.startsAt, endsAt: e.endsAt, allDay: e.allDay, live,
      done: !live && !e.allDay && e.endsAt <= now,
      dim: e.response === "declined" || e.free,
      kindLabel: e.calendars.join(" + "), kindClass: e.calendars.includes("medi@") ? "td-kind--medi" : "td-kind--team",
      meta: [e.organizer ? `by ${e.organizer}` : null, e.location, e.attendeeCount > 1 ? `${e.attendeeCount} invited` : null].filter(Boolean).join(" · ") || null,
      joinUrl: e.joinUrl, joinLabel: "Join", otherJoinUrls: e.otherJoinUrls, link: e.htmlLink, response: e.response, status: null, conflicts: [],
    });
  }
  for (const e of (eventRows ?? []) as ShowEvent[]) {
    const s = Date.parse(e.starts_at);
    const en = e.ends_at ? Date.parse(e.ends_at) : null;
    if (!e.all_day && (en ?? s + 12 * 3600 * 1000) < dayStart) continue; // yesterday's, long over
    const live = !e.all_day && e.status !== "canceled" && s <= now && (en ? en >= now : s >= now - 2 * 3600 * 1000);
    items.push({
      id: `ev:${e.id}`, source: "trump", title: e.title, startsAt: s, endsAt: en, allDay: e.all_day, live,
      done: !live && !e.all_day && s < now && e.status !== "canceled",
      dim: e.status === "canceled" || e.status === "skipped",
      kindLabel: KIND_LABEL[e.kind], kindClass: `td-kind--${e.kind}`,
      meta: [e.location, e.press ? `${e.press} press` : null, e.notes].filter(Boolean).join(" · ") || null,
      joinUrl: e.stream_url, joinLabel: "Watch", otherJoinUrls: [], link: e.source_url, response: null, status: e.status, conflicts: [],
    });
  }
  for (const r of rundowns) {
    if (!r.starts_at) continue;
    const s = Date.parse(r.starts_at);
    const en = s + (r.minutes ?? 60) * 60000;
    const live = r.status !== "skipped" && s <= now && en > now;
    items.push({
      id: `show:${r.id}`, source: "show", title: `${showName}${r.title ? ` — ${r.title}` : ""}`, startsAt: s, endsAt: en, allDay: false, live,
      done: !live && en <= now, dim: r.status === "skipped",
      kindLabel: "Show", kindClass: "td-kind--show",
      meta: r.lead, joinUrl: null, joinLabel: "", otherJoinUrls: [], link: "#rundown", response: null, status: null, conflicts: [],
    });
  }
  items.sort((a, b) => Number(b.allDay) - Number(a.allDay) || a.startsAt - b.startsAt || a.title.localeCompare(b.title));

  // Overlaps (timed, not dimmed): a calendar commitment against anything else on the day.
  const timed = items.filter((i) => !i.allDay && !i.dim);
  for (const a of timed) for (const b of timed) {
    if (a === b || a.source === b.source && a.source === "trump") continue; // two Trump events colliding is Trump's problem
    if ((a.source === "show" && b.source === "trump") || (a.source === "trump" && b.source === "show")) continue; // the show covering an event is the point, not a clash
    if (a.startsAt < effectiveEnd(b) && b.startsAt < effectiveEnd(a)) a.conflicts.push(b.source === "cal" ? b.title : `${b.kindLabel} · ${b.title}`);
  }

  const todayItems = items.filter((i) => dayKey(i.startsAt) === todayKey || (i.startsAt < dayStart && (i.endsAt ?? i.startsAt) > dayStart));
  const laterItems = items.filter((i) => dayKey(i.startsAt) > todayKey);
  const laterDays = Array.from(laterItems.reduce((m, i) => { const k = dayKey(i.startsAt); m.set(k, [...(m.get(k) ?? []), i]); return m; }, new Map<string, Item[]>()).entries());
  const liveNow = todayItems.filter((i) => i.live && !i.dim);
  const nextUp = todayItems.find((i) => !i.allDay && !i.dim && !i.live && i.startsAt > now) ?? null;
  const nextTrump = items.find((i) => i.source === "trump" && !i.dim && (i.live || i.startsAt > now || i.allDay && dayKey(i.startsAt) >= todayKey)) ?? null;
  const awaiting = calendar.events.filter((e) => e.response === "needsAction" || e.response === "tentative");
  const conflictsToday = todayItems.filter((i) => i.source === "cal" && i.conflicts.length);
  const saEmail = "repamerica-calendar@rep-america-site.iam.gserviceaccount.com";

  return (
    <div>
      <style>{`
        .ra-admin .td-stats { display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:10px; margin:0 0 18px; }
        @media (min-width:1000px){ .ra-admin .td-stats { grid-template-columns:repeat(4, minmax(0,1fr)); } }
        .ra-admin .td-stat { border:1px solid #e2e2e2; border-radius:10px; padding:10px 14px; background:#fff; min-width:0; overflow:hidden; }
        .ra-admin .td-stat--live { border-color:#c00; background:#fff5f5; }
        .ra-admin .td-stat--warn { border-color:#f1e2b3; background:#fff8e6; }
        .ra-admin .td-stat b { display:block; font-size:1.8rem; line-height:1.15; }
        .ra-admin .td-stat b small { font-size:1.3rem; color:#777; font-weight:600; }
        .ra-admin .td-stat span { display:block; font-size:1.2rem; color:#777; margin-top:2px; overflow-wrap:normal; word-break:normal; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .ra-admin .td-section { margin-top:14px; border:1px solid #e2e2e2; border-radius:10px; background:#fff; padding:6px 16px 14px; scroll-margin-top:16px; }
        .ra-admin .td-h { font-size:1.5rem; font-weight:700; color:#111; margin:0; cursor:pointer; list-style:none; display:flex; align-items:center; gap:10px; user-select:none; padding:8px 0; }
        .ra-admin .td-h::-webkit-details-marker { display:none; }
        .ra-admin .td-h__caret { width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #999; transition:transform .15s; flex:0 0 auto; }
        .ra-admin details:not([open]) .td-h__caret { transform:rotate(-90deg); }
        .ra-admin .td-h__meta { font-size:1.15rem; color:#aaa; font-weight:500; margin-left:auto; white-space:nowrap; }
        .ra-admin .td-day { font-size:1.15rem; text-transform:uppercase; letter-spacing:.06em; color:#888; font-weight:600; margin:14px 0 4px; }
        .ra-admin .td-day:first-child { margin-top:4px; }
        .ra-admin .td-row { display:grid; grid-template-columns: 96px 1fr; gap:2px 12px; align-items:start; padding:9px 10px; border-top:1px solid #eee; border-radius:6px; }
        @media (min-width:750px){ .ra-admin .td-row { grid-template-columns: 150px 1fr auto; } }
        .ra-admin .td-row--live { background:#fde8e8; }
        .ra-admin .td-row--done, .ra-admin .td-row--dim { opacity:.5; }
        .ra-admin .td-row--dim .td-row__title { text-decoration:line-through; color:#999; }
        .ra-admin .td-row--conflict { background:#fff8e6; }
        .ra-admin .td-row__time { font-weight:700; font-size:1.4rem; font-variant-numeric:tabular-nums; white-space:nowrap; }
        .ra-admin .td-row__time small { display:block; font-weight:500; color:#999; font-size:1.15rem; }
        .ra-admin .td-row__title { font-weight:600; font-size:1.4rem; color:#111; }
        .ra-admin .td-row__meta { font-size:1.25rem; color:#777; }
        .ra-admin .td-row__meta a { color:#555; }
        .ra-admin .td-row__meta a.td-join { color:#111; font-weight:700; }
        .ra-admin .td-row__warn { font-size:1.2rem; color:#8a4b00; margin-top:2px; }
        .ra-admin .td-row__badges { display:flex; gap:6px; flex-wrap:wrap; align-items:center; grid-column: 2; }
        @media (min-width:750px){ .ra-admin .td-row__badges { grid-column:auto; justify-content:flex-end; } }
        .ra-admin .td-kind { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; white-space:nowrap; background:#eee; color:#444; }
        .ra-admin .td-kind--medi { background:#e4e4e4; color:#333; }
        .ra-admin .td-kind--team { background:#f0f0f0; color:#666; }
        .ra-admin .td-kind--trump { background:#fde0e0; color:#9b1c1c; }
        .ra-admin .td-kind--white-house { background:#dde8f7; color:#1d4a8a; }
        .ra-admin .td-kind--campaign { background:#fbead3; color:#8a4b00; }
        .ra-admin .td-kind--show { background:#111; color:#fff; }
        .ra-admin .td-live { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:800; letter-spacing:.06em; background:#c00; color:#fff; white-space:nowrap; }
        .ra-admin .td-chip { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:700; white-space:nowrap; border:1px solid #ddd; color:#777; background:#fff; }
        .ra-admin .td-chip--reply { border-color:#f1c56b; background:#fff3cd; color:#7a5a00; }
        .ra-admin .td-chip--conflict { border-color:#e8b4b4; background:#fde8e8; color:#9b1c1c; }
        .ra-admin .td-chip--ok { background:#d9f2e3; color:#0f5c33; border-color:#d9f2e3; }
        .ra-admin .td-empty { font-size:1.3rem; color:#777; padding:6px 0 2px; }
        /* rundown */
        .ra-admin .td-rd-head { display:flex; flex-wrap:wrap; gap:4px 14px; align-items:baseline; margin:4px 0 10px; }
        .ra-admin .td-rd-head b { font-size:1.6rem; }
        .ra-admin .td-rd-lead { font-size:1.4rem; color:#333; margin:0 0 12px; max-width:86ch; }
        .ra-admin .td-blk { display:grid; grid-template-columns: 64px 1fr; gap:2px 12px; padding:10px 8px; border-top:1px solid #eee; }
        @media (min-width:750px){ .ra-admin .td-blk { grid-template-columns: 84px 1fr; } }
        .ra-admin .td-blk--cut { background:#fafafa; }
        .ra-admin .td-blk__t { font-weight:700; font-size:1.35rem; font-variant-numeric:tabular-nums; white-space:nowrap; }
        .ra-admin .td-blk__t small { display:block; font-weight:500; color:#999; font-size:1.1rem; }
        .ra-admin .td-blk__title { font-weight:700; font-size:1.4rem; color:#111; display:flex; flex-wrap:wrap; gap:6px 8px; align-items:center; }
        .ra-admin .td-blk__body { font-size:1.35rem; line-height:1.55; color:#222; max-width:86ch; margin-top:3px; }
        .ra-admin .td-blk__body > :first-child { margin-top:0; } .ra-admin .td-blk__body > :last-child { margin-bottom:0; }
        .ra-admin .td-blk__body p { margin:0 0 6px; } .ra-admin .td-blk__body ul, .ra-admin .td-blk__body ol { margin:0 0 6px; padding-left:20px; } .ra-admin .td-blk__body li { margin:2px 0; } .ra-admin .td-blk__body a { color:#111; }
        .ra-admin .td-blk__body code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size:1.2rem; background:#f3f3f3; padding:1px 5px; border-radius:4px; }
        .ra-admin .td-tag { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:700; letter-spacing:.04em; text-transform:uppercase; white-space:nowrap; background:#eee; color:#444; }
        .ra-admin .td-tag--reading { background:#fbead3; color:#8a4b00; } .ra-admin .td-tag--beat { background:#fde0e0; color:#9b1c1c; } .ra-admin .td-tag--stronger { background:#dde8f7; color:#1d4a8a; } .ra-admin .td-tag--event { background:#111; color:#fff; }
        .ra-admin .td-cut { display:inline-block; padding:1px 8px; border-radius:999px; font-size:1.05rem; font-weight:800; letter-spacing:.06em; border:1.5px solid #111; color:#111; white-space:nowrap; }
        .ra-admin .td-notes { font-size:1.3rem; color:#555; margin-top:10px; padding-top:8px; border-top:1px dashed #e5e5e5; }
      `}</style>
      <h1>Today</h1>
      <p className="muted">{dayLabel(todayKey)} · everything in Pacific. Your calendars (medi@ + team@), the Trump / White House schedule, and the rundown for the stream. Private — nothing here shows on the site.</p>

      {!calendar.configured ? (
        <div className="notice">Google Calendar isn&apos;t connected yet — add <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> in Vercel (the key for <code>{saEmail}</code>, authorised for calendar.readonly by domain-wide delegation) and redeploy. The Trump schedule and rundown below still work.</div>
      ) : null}
      {calendar.errors.map((e) => (
        <div key={e.calendar} className="notice notice--error">{e.calendar}: {e.message}{/not found/i.test(e.message) ? ` — ${CALENDAR_USER} can't see that calendar.` : ""}</div>
      ))}

      <div className="td-stats">
        <div className={`td-stat${liveNow.length ? " td-stat--live" : ""}`}>
          {liveNow.length ? (
            <><b><span className="td-live">LIVE</span> {timePT(liveNow[0].startsAt)}</b><span>{liveNow[0].title}</span></>
          ) : nextUp ? (
            <><b>{timePT(nextUp.startsAt)} <small>{relative(nextUp.startsAt, now)}</small></b><span>next · {nextUp.title}</span></>
          ) : (
            <><b>Clear</b><span>nothing else on the clock today</span></>
          )}
        </div>
        <div className="td-stat">
          {todayRundown?.starts_at ? (
            <><b>{timePT(Date.parse(todayRundown.starts_at))} <small>PT</small></b><span>{showName} · rundown {todayRundown.status === "aired" ? "aired" : `${(todayRundown.blocks ?? []).length} blocks`}</span></>
          ) : todayRundown ? (
            <><b>Today <small>time TBD</small></b><span>{showName} · rundown {(todayRundown.blocks ?? []).length} blocks</span></>
          ) : (
            <><b>{schedule}</b><span>{nextRundown ? `next rundown ${dayShort(nextRundown.air_date)}` : "no rundown for today"}</span></>
          )}
        </div>
        <div className={`td-stat${nextTrump?.live ? " td-stat--live" : ""}`}>
          {nextTrump ? (
            <><b>{nextTrump.allDay ? `${dayShort(dayKey(nextTrump.startsAt))} · TBD` : `${timePT(nextTrump.startsAt)} ${nextTrump.live ? "" : "PT"}`}{nextTrump.live ? <> <span className="td-live">LIVE</span></> : null}</b><span>{dayKey(nextTrump.startsAt) === todayKey ? "today · " : `${dayShort(dayKey(nextTrump.startsAt)).split(",")[0]} · `}{nextTrump.title}</span></>
          ) : (
            <><b>—</b><span>no Trump / White House events listed</span></>
          )}
        </div>
        <div className={`td-stat${awaiting.length || conflictsToday.length ? " td-stat--warn" : ""}`}>
          {conflictsToday.length ? (
            <><b>{conflictsToday.length} <small>overlap{conflictsToday.length === 1 ? "" : "s"} today</small></b><span>{conflictsToday[0].title} ↔ {conflictsToday[0].conflicts[0]}</span></>
          ) : awaiting.length ? (
            <><b>{awaiting.length} <small>awaiting reply</small></b><span>{awaiting[0].title} · {dayShort(dayKey(awaiting[0].startsAt))}</span></>
          ) : (
            <><b>0 <small>awaiting reply</small></b><span>every invite answered</span></>
          )}
        </div>
      </div>

      <details id="today" className="td-section" open>
        <summary className="td-h"><span className="td-h__caret" aria-hidden />Today<span className="td-h__meta">{todayItems.length ? `${todayItems.length} on the clock` : "nothing scheduled"}</span></summary>
        {todayItems.length ? <div>{todayItems.map((i) => <Row key={i.id} i={i} now={now} />)}</div> : <div className="td-empty">Nothing on either calendar or the Trump schedule today.</div>}
      </details>

      <details id="rundown" className="td-section" open>
        <summary className="td-h"><span className="td-h__caret" aria-hidden />Rundown{nextRundown && nextRundown.air_date !== todayKey ? ` — next show ${dayShort(nextRundown.air_date)}` : ""}<span className="td-h__meta">{nextRundown ? `updated ${stampPT(nextRundown.updated_at)} PT` : "none drafted"}</span></summary>
        {nextRundown ? <RundownView r={nextRundown} showName={showName} now={now} /> : (
          <div className="td-empty">No rundown drafted for today or the next 7 days. Tell Claude &ldquo;draft today&rsquo;s rundown&rdquo; — it comes from the Trump schedule, the book you&rsquo;re on, and the Stronger Americans questions.</div>
        )}
      </details>

      <details id="week" className="td-section" open>
        <summary className="td-h"><span className="td-h__caret" aria-hidden />Next 7 days<span className="td-h__meta">{laterItems.length ? `${laterItems.length} item${laterItems.length === 1 ? "" : "s"} · through ${dayShort(addDays(todayKey, 7))}` : `through ${dayShort(addDays(todayKey, 7))}`}</span></summary>
        {laterDays.length ? (
          <div>
            {laterDays.map(([day, list]) => (
              <div key={day}>
                <div className="td-day">{dayLabel(day)}</div>
                {list.map((i) => <Row key={i.id} i={i} now={now} compact />)}
              </div>
            ))}
          </div>
        ) : (
          <div className="td-empty">Nothing on the calendars or the Trump schedule for the next 7 days.</div>
        )}
      </details>
    </div>
  );
}

function Row({ i, now, compact }: { i: Item; now: number; compact?: boolean }) {
  const cls = ["td-row", i.live ? "td-row--live" : "", i.done ? "td-row--done" : "", i.dim ? "td-row--dim" : "", !i.live && !i.done && !i.dim && i.conflicts.length ? "td-row--conflict" : ""].filter(Boolean).join(" ");
  const endLabel = i.endsAt && !i.allDay ? ` – ${timePT(i.endsAt)}` : "";
  return (
    <div className={cls}>
      <div className="td-row__time">
        {i.allDay ? (i.source === "trump" ? "Time TBD" : "All day") : `${timePT(i.startsAt)}${compact ? "" : endLabel}`}
        {!i.allDay && !compact ? <small>{i.source === "trump" ? `${timeET(i.startsAt)} ET` : i.live ? "now" : i.done ? "done" : relative(i.startsAt, now)}</small> : null}
      </div>
      <div>
        <div className="td-row__title">{i.link && i.source !== "show" ? <a href={i.link} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>{i.title}</a> : i.source === "show" ? <a href="#rundown" style={{ color: "inherit", textDecoration: "none" }}>{i.title}</a> : i.title}</div>
        {i.meta && !compact ? <div className="td-row__meta">{i.meta}</div> : null}
        {i.joinUrl ? (
          <div className="td-row__meta">
            <a className="td-join" href={i.joinUrl} target="_blank" rel="noreferrer">{i.joinLabel}</a>
            {i.link && i.source === "trump" ? <> · <a href={i.link} target="_blank" rel="noreferrer">Source</a></> : null}
            {i.otherJoinUrls.length ? <span className="td-row__warn"> · another link on the invite: {i.otherJoinUrls.map((u, n) => <a key={u} href={u} target="_blank" rel="noreferrer">{n ? ", " : ""}{u.replace(/^https?:\/\//, "")}</a>)} — the bold one is what the organizer sent</span> : null}
          </div>
        ) : null}
        {i.conflicts.length && !i.dim ? <div className="td-row__warn">overlaps {i.conflicts.join(" · ")}</div> : null}
      </div>
      <div className="td-row__badges">
        {i.live ? <span className="td-live">LIVE</span> : null}
        <span className={`td-kind ${i.kindClass}`}>{i.kindLabel}</span>
        {i.response === "needsAction" ? <span className="td-chip td-chip--reply">reply?</span> : null}
        {i.response === "tentative" ? <span className="td-chip">maybe</span> : null}
        {i.response === "declined" ? <span className="td-chip">declined</span> : null}
        {i.status === "tentative" ? <span className="td-chip">tentative</span> : null}
        {i.status === "covered" ? <span className="td-chip td-chip--ok">covered</span> : null}
        {i.status === "skipped" || i.status === "canceled" ? <span className="td-chip">{i.status}</span> : null}
      </div>
    </div>
  );
}

function RundownView({ r, showName, now }: { r: Rundown; showName: string; now: number }) {
  const blocks = Array.isArray(r.blocks) ? r.blocks : [];
  const start = r.starts_at ? Date.parse(r.starts_at) : null;
  const total = blocks.reduce((s, b) => s + (b.minutes ?? 0), 0) || r.minutes || 0;
  let clock = start;
  const cut = blocks.find((b) => b.is_cut);
  return (
    <div>
      <div className="td-rd-head">
        <b>{r.title ?? showName}</b>
        <span className="muted">{start ? `${timePT(start)} PT` : "time TBD"}{total ? ` · ~${total} min` : ""}{r.status === "aired" ? " · aired" : r.status === "skipped" ? " · skipped" : start && start > now ? ` · ${relative(start, now)}` : ""}</span>
        {cut ? <span className="td-cut">CUT: {cut.title ?? BLOCK_LABEL[cut.kind ?? "other"]}</span> : null}
      </div>
      {r.lead ? <p className="td-rd-lead">{r.lead}</p> : null}
      {blocks.length ? blocks.map((b, n) => {
        const at = clock;
        if (clock != null) clock += (b.minutes ?? 0) * 60000;
        const kind = b.kind ?? "other";
        return (
          <div key={n} className={`td-blk${b.is_cut ? " td-blk--cut" : ""}`}>
            <div className="td-blk__t">{at != null ? timePT(at) : `${n + 1}.`}{b.minutes ? <small>{b.minutes} min</small> : null}</div>
            <div>
              <div className="td-blk__title"><span className={`td-tag td-tag--${kind}`}>{BLOCK_LABEL[kind]}</span>{b.title ?? ""}{b.is_cut ? <span className="td-cut">CUT</span> : null}{b.url ? <a href={b.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: "1.25rem" }}>link</a> : null}</div>
              {b.body_html ? <div className="td-blk__body" dangerouslySetInnerHTML={{ __html: b.body_html }} /> : null}
            </div>
          </div>
        );
      }) : <div className="td-empty">The rundown has no blocks yet.</div>}
      {r.notes ? <div className="td-notes">{r.notes}</div> : null}
    </div>
  );
}
