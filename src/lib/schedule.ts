// Data for the public Trump / White House live schedule (/trump-schedule, its .ics and .json feeds, the homepage strip).
// Reads show_events with the service role on the server (the table has no public policies), exposes only the public
// columns, and attaches Rep America's live / replay links from the channel (see youtubeLives.ts). Server-only.
import { supabaseAdmin } from "@/lib/supabase";
import { performerOf, placeOf, publicLabel, PERFORMER_NAME, timeET, timePT, type StreamEvent } from "@/lib/streamPackage";
import { primaryLive, withLiveLinks, type LiveLinks } from "@/lib/youtubeLives";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
// Two doors onto one dataset: /trump-schedule is the political reference (everything, Medi's links where he streams);
// /schedule is Rep America's own week (what Medi covers + his TikTok lives). Same rows, filtered by `scope`.
export const SCHEDULE_PATH = "/trump-schedule";
export const SCHEDULE_URL = `${SITE}${SCHEDULE_PATH}`;
export const SCHEDULE_TITLE = "Trump & White House Schedule This Week — Rallies, Briefings, Live Streams";
export const SCHEDULE_DESCRIPTION = "Upcoming Trump rallies, White House press briefings and events, JD Vance rallies and other political events for the next 7 days, with times in ET and PT, venues and status — plus Rep America's live stream for every event Medi covers on YouTube. Updated daily.";
export const MEDI_PATH = "/schedule";
export const MEDI_URL = `${SITE}${MEDI_PATH}`;
export const MEDI_TITLE = "Rep America LIVE — This Week's Schedule | Medi's Trump Rally Coverage & TikTok Lives";
export const MEDI_DESCRIPTION = "Medi's live schedule for the week: the Trump rallies and White House events he streams live on YouTube, and his TikTok lives after every rally — Talk to Me: Trump, money, family, your future. Times in ET and PT. Updated daily.";
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

export type Schedule = { now: number; upcoming: ScheduleEvent[]; past: ScheduleEvent[]; updatedAt: string | null; tiktok: TikTokSettings };

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
  try { db = supabaseAdmin(); } catch { return { now, upcoming: [], past: [], updatedAt: null, tiktok: TIKTOK_DEFAULTS }; } // no service key (local build) → empty page, never a 500
  const [{ data }, { data: settingRows }] = await Promise.all([
    db
      .from("show_events")
      .select("id, starts_at, ends_at, all_day, title, kind, location, press, stream_url, source_url, status, notes, stream_title, live_url, live_url_alt, video_url, is_public, updated_at")
      .eq("is_public", true)
      .gte("starts_at", new Date(now - back * DAY).toISOString())
      .lt("starts_at", new Date(now + (ahead + 1) * DAY).toISOString())
      .order("starts_at", { ascending: true })
      .limit(200),
    db.from("show_settings").select("key, value").like("key", "tiktok_%"),
  ]);
  const st = new Map<string, string>(((settingRows ?? []) as { key: string; value: string | null }[]).map((r) => [r.key, r.value ?? ""]));
  const tiktok: TikTokSettings = {
    url: st.get("tiktok_live_url") || TIKTOK_DEFAULTS.url,
    headline: st.get("tiktok_headline") || TIKTOK_DEFAULTS.headline,
    aftershow: (st.get("tiktok_aftershow") ?? "on") !== "off",
    offsetMin: Number(st.get("tiktok_aftershow_offset_min")) || TIKTOK_DEFAULTS.offsetMin,
  };
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
    all = [...covered, ...after, ...mediRows.map((e) => shapeMedi(e, now, tiktok.url))].sort((a, b) => a.startsMs - b.startsMs);
  }
  const upcoming = all.filter((e) => e.phase !== "past" && e.status !== "skipped");
  // Past: only what Rep America actually covered (there is a replay to point at), newest first. TikTok lives have no replay.
  const past = all.filter((e) => e.phase === "past" && e.platform !== "tiktok" && (e.watchUrl || e.video_url || e.status === "covered")).reverse();
  const updatedAt = rows.reduce<string | null>((m, r) => (r.updated_at && (!m || r.updated_at > m) ? r.updated_at : m), null);
  return { now, upcoming, past, updatedAt, tiktok };
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
  if (e.phase === "past") return { text: e.platform === "tiktok" ? "Done" : e.watchUrl || e.video_url ? "Replay" : "Covered", tone: "muted" };
  if (e.status === "tentative") return { text: "Tentative", tone: "warn" };
  return { text: "Scheduled", tone: "ok" };
}

/** Plain-text description for feeds and JSON-LD. */
export function plainDescription(e: ScheduleEvent): string {
  if (e.platform === "tiktok") return [`Medi live on TikTok (@repamerica) — ${e.sub ?? ""}`.trim(), e.notes, `Join: ${e.watchUrl}`].filter(Boolean).join(". ");
  const bits = [e.sub ? `${e.sub} with ${e.performerName}` : e.performerName, e.location, e.notes, e.watchUrl ? `Watch live with Medi on Rep America: ${e.watchUrl}` : null];
  return bits.filter(Boolean).join(". ").replace(/\.\./g, ".");
}
