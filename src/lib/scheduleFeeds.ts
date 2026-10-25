// The .ics and .json feeds for both schedule pages (political reference + Rep America's own week). Server-only.
import { getPublicSchedule, isoET, plainDescription, whenET, whenPT, SITE, type ScheduleEvent, type ScheduleScope } from "@/lib/schedule";
import { CHANNEL_URL } from "@/lib/youtubeLives";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const out: string[] = []; let l = line; while (l.length > 73) { out.push(l.slice(0, 73)); l = " " + l.slice(73); } out.push(l); return out.join("\r\n"); };
const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const dateOnly = (ms: number) => isoET(ms).slice(0, 10).replace(/-/g, "");

function vevent(e: ScheduleEvent, stamp: string, pageUrl: string): string {
  const streamed = e.watchUrl && e.status !== "canceled";
  const url = streamed ? e.watchUrl! : e.source_url ?? `${pageUrl}#event-${e.id}`;
  const tag = e.platform === "tiktok" ? " — Rep America LIVE on TikTok" : streamed ? " — LIVE with Rep America" : "";
  const lines = [
    "BEGIN:VEVENT",
    `UID:show-event-${e.id}@repamerica.com`,
    `DTSTAMP:${stamp}`,
    e.all_day ? `DTSTART;VALUE=DATE:${dateOnly(e.startsMs)}` : `DTSTART:${utc(e.startsMs)}`,
    e.all_day ? `DTEND;VALUE=DATE:${dateOnly(e.startsMs + 86400000)}` : `DTEND:${utc(e.endsMs ?? e.startsMs + 3 * 3600 * 1000)}`,
    `SUMMARY:${esc(`${e.headline}${tag}`)}`,
    e.location ? `LOCATION:${esc(e.location)}` : null,
    `DESCRIPTION:${esc(`${plainDescription(e)}\n\nSchedule: ${pageUrl}`)}`,
    `URL:${url}`,
    `STATUS:${e.status === "canceled" ? "CANCELLED" : e.status === "tentative" ? "TENTATIVE" : "CONFIRMED"}`,
    `CATEGORIES:${e.platform === "tiktok" ? "Rep America LIVE" : e.performer === "vance" ? "JD Vance" : e.performer === "white-house" ? "White House" : e.performer === "medi" ? "Rep America LIVE" : "Trump"}`,
    "END:VEVENT",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n");
}

export async function icsFeed(scope: ScheduleScope, pageUrl: string, calName: string, calDesc: string): Promise<Response> {
  const s = await getPublicSchedule({ daysAhead: 14, daysBack: 7, scope });
  const stamp = utc(s.now);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rep America//Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${calName}`,
    `X-WR-CALDESC:${esc(calDesc)}`,
    "X-WR-TIMEZONE:America/New_York",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    `URL:${pageUrl}.ics`,
    ...[...s.upcoming, ...s.past].map((e) => vevent(e, stamp, pageUrl)),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${pageUrl.split("/").pop()}-rep-america.ics"`,
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}

const item = (e: ScheduleEvent, pageUrl: string) => ({
  id: e.id,
  title: e.headline,
  type: e.platform === "tiktok" ? "Rep America LIVE on TikTok" : e.sub ?? (e.performer === "white-house" ? "White House event" : e.performer === "medi" ? "Rep America LIVE" : "Event"),
  topic: e.platform === "tiktok" ? e.sub : null,
  performer: e.performerName || null,
  platform: e.platform,
  after_event_id: e.aftershowOf,
  start: isoET(e.startsMs),
  start_utc: new Date(e.startsMs).toISOString(),
  start_is_approximate: !!e.aftershowOf,
  end: e.endsMs ? isoET(e.endsMs) : null,
  time_et: whenET(e),
  time_pt: whenPT(e) || null,
  all_day: e.all_day,
  status: e.status === "canceled" ? "canceled" : e.phase === "live" ? "live" : e.phase === "past" ? "past" : e.status === "tentative" ? "tentative" : "scheduled",
  venue: e.location,
  city: e.city,
  state: e.state,
  details: e.notes,
  official_url: e.source_url,
  rep_america_live: e.status !== "canceled" ? e.watchUrl : null,
  rep_america_live_widescreen: e.status !== "canceled" ? e.liveLinks?.horizontal ?? null : null,
  rep_america_highlights: e.video_url,
  description: plainDescription(e),
  page_url: `${pageUrl}#event-${e.id}`,
});

export async function jsonFeed(scope: ScheduleScope, pageUrl: string, name: string, description: string): Promise<Response> {
  const s = await getPublicSchedule({ daysAhead: 7, daysBack: 14, scope });
  const body = {
    name,
    description,
    publisher: { name: "Rep America", url: SITE, youtube: CHANNEL_URL, tiktok: "https://www.tiktok.com/@repamerica", host: "Medi" },
    page: pageUrl,
    calendar_feed: `${pageUrl}.ics`,
    generated_at: new Date(s.now).toISOString(),
    timezone_note: "start is ISO 8601 in US Eastern time with offset; start_utc is the same instant in UTC. TikTok lives after a rally start when the rally ends, so their start is approximate. Times can change; this feed regenerates every 5 minutes from the daily-refreshed schedule.",
    upcoming: s.upcoming.map((e) => item(e, pageUrl)),
    recently_covered: s.past.map((e) => item(e, pageUrl)),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600", "Access-Control-Allow-Origin": "*" },
  });
}
