// Data for the public Trump / White House live schedule (/trump-schedule, its .ics and .json feeds, the homepage strip).
// Reads show_events with the service role on the server (the table has no public policies), exposes only the public
// columns, and attaches Rep America's live / replay links from the channel (see youtubeLives.ts). Server-only.
import { supabaseAdmin } from "@/lib/supabase";
import { performerOf, placeOf, publicLabel, PERFORMER_NAME, timeET, timePT, type StreamEvent } from "@/lib/streamPackage";
import { CHANNEL_URL, primaryLive, withLiveLinks, type LiveLinks } from "@/lib/youtubeLives";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
// Two doors onto one dataset: /trump-schedule is the political reference (everything, Medi's links where he streams);
// /schedule is Rep America's own week (what Medi covers + his TikTok lives). Same rows, filtered by `scope`.
export const SCHEDULE_PATH = "/trump-schedule";
export const SCHEDULE_URL = `${SITE}${SCHEDULE_PATH}`;
export const SCHEDULE_TITLE = "Trump Schedule Today & This Week — White House, JD Vance, Marco Rubio";
export const SCHEDULE_DESCRIPTION = "What President Trump is doing today and this week: remarks, signings, news conferences, meetings and travel, with White House press briefings, Vice President JD Vance, Secretary of State Marco Rubio, Congress and the Supreme Court. Times in ET and PT, where to watch, and what happened in the last few days. Updated daily.";
export const MEDI_PATH = "/schedule";
export const MEDI_URL = `${SITE}${MEDI_PATH}`;
export const MEDI_TITLE = "Rep America LIVE Schedule — Live with Medi, Monday to Friday";
export const MEDI_DESCRIPTION = "When Rep America is live: Medi's weekday show on YouTube — politics, laughs and life — plus the Trump and White House events he covers as they happen. Times in ET and PT.";
export type ScheduleScope = "political" | "medi";
export const TIKTOK_URL_DEFAULT = "https://www.tiktok.com/@repamerica/live";

const DAY = 24 * 3600 * 1000;
const LIVE_WINDOW_MS = 3 * 3600 * 1000; // a rally stream runs about three hours


/** The daily refresh task sometimes writes sourcing remarks into `notes`; the public never needs those. */
export function publicNote(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let n = raw;
  n = n.replace(/\b(\d{1,2}(?::\d{2})?)\s*([ap])\.?m\.?(?=[\s;,.)]|$)/gi, (_, t, ap) => `${t} ${ap.toUpperCase()}M`); // "11:40 a.m." → "11:40 AM"
  n = n.replace(/\((?:[^()]*\b(?:assumed|not stated|unconfirmed|per [A-Z]|zone|says|reports|reported|lists|according)[^()]*)\)/gi, " "); // "(zone not stated; assumed …)", "(WXYZ says noon ET)"
  n = n.replace(/\b(?:per|according to|as per|via|source:?)\s+[^;,.()]*/gi, " "); // "per WH schedule", "per MLive"
  n = n.replace(/\b(?:assumed|unconfirmed|not confirmed|tentatively|reportedly|allegedly|rumou?red)\b[^;.,()]*/gi, " ");
  n = n.replace(/\bvenue now\b/gi, "venue");
  n = n.replace(/\(\s*\)/g, " ").replace(/\s+([;,.)])/g, "$1").replace(/([;,])(?=[;,])/g, "").replace(/\s{2,}/g, " ").replace(/^[\s;,.]+|[\s;,.]+$/g, "").trim();
  return n || null;
}

/** Rumours stay off the public page even when a row forgot is_public = false. */
export const isRumour = (e: Pick<StreamEvent, "title" | "status" | "notes">) =>
  /\b(unconfirmed|possible|possibly|expected|rumou?r|may (?:hold|attend|travel)|reportedly)\b/i.test(`${e.title} ${e.status === "tentative" ? e.notes ?? "" : ""}`) && e.status !== "covered";

export type ScheduleEvent = StreamEvent & {
  liveLinks: LiveLinks | null;
  platform: "youtube" | "tiktok" | null; // where Medi's stream for this row lives
  aftershowOf: number | null; // for a derived TikTok live: the rally it follows
  virtual?: boolean; // derived from settings (the weekday show), not a show_events row
  streamable?: boolean | null;
  startsMs: number;
  endsMs: number | null;
  headline: string; // "Trump rally — Perry, Georgia"
  sub: string | null; // "Midterm rally"
  performer: ReturnType<typeof performerOf>;
  performerName: string;
  city: string | null;
  state: string | null;
  watchUrl: string | null; // Rep America live / replay (vertical first)
  phase: "live" | "upcoming" | "past";
  status: string;
};

function shape(e: StreamEvent & { liveLinks: LiveLinks | null }, now: number): ScheduleEvent {
  const startsMs = Date.parse(e.starts_at);
  const endsMs = e.ends_at ? Date.parse(e.ends_at) : null;
  const { headline, sub } = publicLabel(e);
  const performer = performerOf(e);
  const p = placeOf(e);
  const watchUrl = primaryLive(e.liveLinks);
  const over = endsMs ? endsMs < now : startsMs + LIVE_WINDOW_MS < now;
  const onAir = !!e.liveLinks && (e.liveLinks.live || (startsMs <= now && !over));
  const phase: ScheduleEvent["phase"] = onAir ? "live" : over || (startsMs < now && !e.all_day) ? "past" : "upcoming";
  return { ...e, notes: publicNote(e.notes), liveLinks: e.liveLinks, platform: watchUrl ? "youtube" : null, aftershowOf: null, startsMs, endsMs, headline, sub, performer, performerName: PERFORMER_NAME[performer], city: p?.city ?? null, state: p?.state ?? null, watchUrl, phase, status: e.status ?? "scheduled" };
}

/** Medi's own row (kind "medi"): a TikTok or YouTube talk live he told Claude about. stream_url is where it happens. */
function shapeMedi(e: StreamEvent, now: number, tiktokUrl: string): ScheduleEvent {
  const startsMs = Date.parse(e.starts_at);
  const endsMs = e.ends_at ? Date.parse(e.ends_at) : startsMs + 2 * 3600 * 1000;
  const url = e.stream_url || tiktokUrl;
  const platform: ScheduleEvent["platform"] = /tiktok\.com/i.test(url) ? "tiktok" : "youtube";
  const over = endsMs < now;
  const phase: ScheduleEvent["phase"] = startsMs <= now && !over ? "live" : over ? "past" : "upcoming";
  return { ...e, notes: e.notes ?? null, liveLinks: null, platform, aftershowOf: null, startsMs, endsMs, headline: e.title, sub: null, performer: "medi", performerName: "Medi", city: null, state: null, watchUrl: url, phase, status: e.status ?? "scheduled" };
}

export type TikTokSettings = { url: string; headline: string; aftershow: boolean; offsetMin: number };

/** The TikTok live that follows a rally Medi streams: starts when Trump wraps, usually 1½–2 hours after the rally starts. */
function aftershowFor(rally: ScheduleEvent, now: number, tk: TikTokSettings): ScheduleEvent {
  const startsMs = rally.startsMs + tk.offsetMin * 60000;
  const endsMs = startsMs + 2 * 3600 * 1000;
  const over = endsMs < now;
  const phase: ScheduleEvent["phase"] = startsMs <= now && !over ? "live" : over ? "past" : "upcoming";
  return {
    ...rally,
    id: rally.id + 1000000, // virtual id, stable per rally
    kind: "medi",
    title: `Rep America LIVE on TikTok — after the ${rally.city ?? ""} rally`.replace("  ", " "),
    headline: "Rep America LIVE on TikTok — after the rally",
    sub: tk.headline,
    location: null,
    notes: "Starts as soon as Trump wraps — usually 1½ to 2 hours after the rally begins. Debates, questions, real talk.",
    source_url: null,
    stream_url: tk.url,
    live_url: null, live_url_alt: null, video_url: null,
    liveLinks: null,
    platform: "tiktok",
    aftershowOf: rally.id,
    startsMs, endsMs,
    performer: "medi", performerName: "Medi",
    watchUrl: tk.url,
    phase,
    status: rally.status === "canceled" ? "canceled" : "scheduled",
    all_day: false,
  };
}

/** Medi's standing show: which weekdays (0 = Sunday) and what Pacific time. Lives in show_settings (daily_live_*). */
export type DailyLive = { days: number[]; hour: number; minute: number; minutes: number; title: string; sub: string; url: string; skip: string[]; label: string };
export type Schedule = { now: number; upcoming: ScheduleEvent[]; past: ScheduleEvent[]; updatedAt: string | null; tiktok: TikTokSettings; daily: DailyLive | null };

const PT = "America/Los_Angeles";
const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
/** A wall-clock time in a zone → the UTC instant (handles DST by measuring the zone's offset at that moment). */
function zonedToUtc(y: number, mo: number, d: number, h: number, mi: number, tz: string): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const shown = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour") % 24, n("minute"));
  return guess - (shown - guess);
}

function dailyFrom(st: Map<string, string>): DailyLive | null {
  const days = (st.get("daily_live_days") ?? "").split(",").map((x) => Number(x.trim())).filter((x) => Number.isInteger(x) && x >= 0 && x <= 6);
  const m = /^(\d{1,2}):(\d{2})$/.exec((st.get("daily_live_time") ?? "").trim());
  if (!days.length || !m) return null;
  const hour = Number(m[1]), minute = Number(m[2]);
  const sorted = [...days].sort((a, b) => a - b);
  const run = sorted.every((d, i) => i === 0 || d === sorted[i - 1] + 1);
  const dayText = sorted.length === 7 ? "Every day" : run && sorted.length > 2 ? `${DOW[sorted[0]]} to ${DOW[sorted[sorted.length - 1]]}` : sorted.map((d) => DOW[d]).join(", ");
  const at = zonedToUtc(2026, 1, 15, hour, minute, PT); // any date — only used to print the clock time in both zones
  const label = `${dayText} at ${timePT(at)} PT (${timeET(at)} ET)`;
  return {
    days: sorted, hour, minute,
    minutes: Number(st.get("daily_live_minutes")) || 120,
    title: st.get("daily_live_title") || "Rep America LIVE with Medi",
    sub: st.get("daily_live_sub") || "Politics, laughs and life",
    url: st.get("daily_live_url") || `${CHANNEL_URL}/live`,
    skip: (st.get("daily_live_skip") ?? "").split(",").map((x) => x.trim()).filter(Boolean),
    label,
  };
}

/** One row per show day in the window. Virtual ids: 9YYYYMMDD. */
function dailyRows(d: DailyLive, now: number, ahead: number): ScheduleEvent[] {
  const out: ScheduleEvent[] = [];
  for (let i = 0; i <= ahead; i++) {
    const key = new Date(now + i * DAY).toLocaleDateString("en-CA", { timeZone: PT }); // YYYY-MM-DD in Pacific
    const [y, mo, da] = key.split("-").map(Number);
    const dow = new Date(Date.UTC(y, mo - 1, da)).getUTCDay();
    if (!d.days.includes(dow) || d.skip.includes(key)) continue;
    const startsMs = zonedToUtc(y, mo, da, d.hour, d.minute, PT);
    const endsMs = startsMs + d.minutes * 60000;
    if (endsMs < now) continue;
    const phase: ScheduleEvent["phase"] = startsMs <= now ? "live" : "upcoming";
    out.push({
      id: Number(`9${key.replace(/-/g, "")}`), starts_at: new Date(startsMs).toISOString(), ends_at: new Date(endsMs).toISOString(), all_day: false,
      title: d.title, kind: "medi", location: null, notes: "Live on YouTube, in vertical and widescreen. Jump in the chat.", status: "scheduled", stream_url: d.url, source_url: null,
      liveLinks: null, platform: "youtube", aftershowOf: null, virtual: true, startsMs, endsMs, headline: d.title, sub: d.sub,
      performer: "medi", performerName: "Medi", city: null, state: null, watchUrl: d.url, phase,
    });
  }
  return out;
}

const TIKTOK_DEFAULTS: TikTokSettings = { url: TIKTOK_URL_DEFAULT, headline: "Talk to Me: Trump, Money, Family, Your Future", aftershow: true, offsetMin: 120 };

/**
 * scope "political" (default, /trump-schedule): every public political event, with Medi's YouTube link where he streams.
 * scope "medi" (/schedule, homepage, graphic): only what Rep America is doing — events Medi streams (a live link exists),
 * his own rows (kind "medi"), and the TikTok live that follows each rally he covers.
 * Next N days (upcoming + anything on air) and the last M days of events Medi covered (a replay exists).
 */
export async function getPublicSchedule(opts: { daysAhead?: number; daysBack?: number; scope?: ScheduleScope } = {}): Promise<Schedule> {
  const now = Date.now();
  const ahead = opts.daysAhead ?? 7, back = opts.daysBack ?? 14, scope = opts.scope ?? "political";
  let db: ReturnType<typeof supabaseAdmin>;
  try { db = supabaseAdmin(); } catch { return { now, upcoming: [], past: [], updatedAt: null, tiktok: TIKTOK_DEFAULTS, daily: null }; } // no service key (local build) → empty page, never a 500
  const [{ data }, { data: settingRows }] = await Promise.all([
    db
      .from("show_events")
      .select("id, starts_at, ends_at, all_day, title, kind, location, press, stream_url, source_url, status, notes, stream_title, live_url, live_url_alt, video_url, is_public, streamable, updated_at")
      .eq("is_public", true)
      .gte("starts_at", new Date(now - back * DAY).toISOString())
      .lt("starts_at", new Date(now + (ahead + 1) * DAY).toISOString())
      .order("starts_at", { ascending: true })
      .limit(400),
    db.from("show_settings").select("key, value").or("key.like.tiktok_%,key.like.daily_live_%"),
  ]);
  const st = new Map<string, string>(((settingRows ?? []) as { key: string; value: string | null }[]).map((r) => [r.key, r.value ?? ""]));
  const tiktok: TikTokSettings = {
    url: st.get("tiktok_live_url") || TIKTOK_DEFAULTS.url,
    headline: st.get("tiktok_headline") || TIKTOK_DEFAULTS.headline,
    aftershow: (st.get("tiktok_aftershow") ?? "on") !== "off",
    offsetMin: Number(st.get("tiktok_aftershow_offset_min")) || TIKTOK_DEFAULTS.offsetMin,
  };
  const daily = dailyFrom(st);
  const rows = ((data ?? []) as (StreamEvent & { updated_at?: string })[]).filter((r) => !isRumour(r));
  const mediRows = rows.filter((r) => r.kind === "medi");
  const political = rows.filter((r) => r.kind !== "medi");
  const withLinks = await withLiveLinks(political);
  const shaped = withLinks.map((e) => shape(e, now));
  let all: ScheduleEvent[];
  if (scope === "political") {
    all = shaped;
  } else {
    const covered = shaped.filter((e) => e.watchUrl && e.status !== "canceled");
    const after = tiktok.aftershow ? covered.filter((e) => e.performer === "trump" && isRallyEvent(e)).map((e) => aftershowFor(e, now, tiktok)) : [];
    all = [...covered, ...after, ...mediRows.map((e) => shapeMedi(e, now, tiktok.url)), ...(daily ? dailyRows(daily, now, ahead) : [])].sort((a, b) => a.startsMs - b.startsMs);
  }
  const upcoming = all.filter((e) => e.phase !== "past" && e.status !== "skipped");
  // Past, newest first. The political reference keeps everything that happened (that is what "what did Trump do
  // yesterday" needs); Rep America's own page keeps only what Medi covered. TikTok lives have no replay.
  const past = all
    .filter((e) => e.phase === "past" && e.platform !== "tiktok" && !e.virtual && e.status !== "canceled" && e.status !== "skipped" && (scope === "political" || e.watchUrl || e.video_url || e.status === "covered"))
    .reverse();
  const updatedAt = rows.reduce<string | null>((m, r) => (r.updated_at && (!m || r.updated_at > m) ? r.updated_at : m), null);
  return { now, upcoming, past, updatedAt, tiktok, daily };
}

const isRallyEvent = (e: ScheduleEvent) => /rally/i.test(e.title);

/* ---------- formatting shared by the page, the feeds and the homepage strip ---------- */

export const dayKeyET = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
export const dayLabelET = (ms: number) => new Date(ms).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/New_York" });
export const dayShortET = (ms: number) => new Date(ms).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
export const whenET = (e: ScheduleEvent) => (e.all_day ? "Time TBA" : `${timeET(e.startsMs)} ET`);
export const whenPT = (e: ScheduleEvent) => (e.all_day ? "" : `${timePT(e.startsMs)} PT`);

/** ISO 8601 with the Eastern offset, e.g. 2026-10-24T19:00:00-04:00 — what schema.org and calendars expect. */
export function isoET(ms: number): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(ms));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  const [y, mo, d, h, mi, s] = [n("year"), n("month"), n("day"), n("hour") % 24, n("minute"), n("second")];
  const offMin = Math.round((Date.UTC(y, mo - 1, d, h, mi, s) - Math.floor(ms / 1000) * 1000) / 60000);
  const sign = offMin < 0 ? "-" : "+";
  const a = Math.abs(offMin);
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(s)}${sign}${pad(Math.floor(a / 60))}:${pad(a % 60)}`;
}

/** The one-line status the public sees. */
export function statusLabel(e: ScheduleEvent): { text: string; tone: "live" | "ok" | "warn" | "muted" } {
  if (e.status === "canceled") return { text: "Canceled", tone: "muted" };
  if (e.phase === "live") return { text: "Live now", tone: "live" };
  if (e.phase === "past") return { text: e.platform === "tiktok" ? "Done" : e.watchUrl || e.video_url ? "Replay" : "Ended", tone: "muted" };
  if (e.status === "tentative") return { text: "Tentative", tone: "warn" };
  return { text: "Scheduled", tone: "ok" };
}

/** Plain-text description for feeds and JSON-LD. */
export function plainDescription(e: ScheduleEvent): string {
  if (e.virtual) return [`${e.headline} — ${e.sub ?? ""}`.replace(/ — $/, ""), e.notes, `Watch: ${e.watchUrl}`].filter(Boolean).join(". ");
  if (e.platform === "tiktok") return [`Medi live on TikTok (@repamerica) — ${e.sub ?? ""}`.trim(), e.notes, `Join: ${e.watchUrl}`].filter(Boolean).join(". ");
  const bits = [e.sub ? `${e.sub} with ${e.performerName}` : e.headline, e.location, e.notes, e.watchUrl ? `Watch live with Medi on Rep America: ${e.watchUrl}` : null];
  return bits.filter(Boolean).join(". ").replace(/\.\./g, ".");
}
