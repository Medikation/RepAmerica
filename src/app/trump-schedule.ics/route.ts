// GET /trump-schedule.ics — the public schedule as an iCalendar feed people can subscribe to (Google / Apple / Outlook).
// Next 14 days + the last 7. Each event carries the official link and, when Medi covers it, the Rep America live URL.
import { getPublicSchedule, isoET, plainDescription, SCHEDULE_URL, type ScheduleEvent } from "@/lib/schedule";

export const dynamic = "force-dynamic"; // rendered per request; the data behind it is cached 5 min and the response carries its own Cache-Control

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => { const out: string[] = []; let l = line; while (l.length > 73) { out.push(l.slice(0, 73)); l = " " + l.slice(73); } out.push(l); return out.join("\r\n"); };
const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const dateOnly = (ms: number) => isoET(ms).slice(0, 10).replace(/-/g, "");

function vevent(e: ScheduleEvent, stamp: string): string {
  const url = e.watchUrl && e.status !== "canceled" ? e.watchUrl : e.source_url ?? `${SCHEDULE_URL}#event-${e.id}`;
  const lines = [
    "BEGIN:VEVENT",
    `UID:show-event-${e.id}@repamerica.com`,
    `DTSTAMP:${stamp}`,
    e.all_day ? `DTSTART;VALUE=DATE:${dateOnly(e.startsMs)}` : `DTSTART:${utc(e.startsMs)}`,
    e.all_day ? `DTEND;VALUE=DATE:${dateOnly(e.startsMs + 86400000)}` : `DTEND:${utc(e.endsMs ?? e.startsMs + 3 * 3600 * 1000)}`,
    `SUMMARY:${esc(`${e.headline}${e.watchUrl && e.status !== "canceled" ? " — LIVE with Rep America" : ""}`)}`,
    e.location ? `LOCATION:${esc(e.location)}` : null,
    `DESCRIPTION:${esc(`${plainDescription(e)}\n\nSchedule: ${SCHEDULE_URL}`)}`,
    `URL:${url}`,
    `STATUS:${e.status === "canceled" ? "CANCELLED" : e.status === "tentative" ? "TENTATIVE" : "CONFIRMED"}`,
    `CATEGORIES:${e.performer === "vance" ? "JD Vance" : e.performer === "white-house" ? "White House" : "Trump"}`,
    "END:VEVENT",
  ].filter(Boolean) as string[];
  return lines.map(fold).join("\r\n");
}

export async function GET() {
  const s = await getPublicSchedule({ daysAhead: 14, daysBack: 7 });
  const stamp = utc(s.now);
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Rep America//Trump Rally Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Trump Rally Schedule — Rep America",
    "X-WR-CALDESC:Upcoming Trump rallies\\, JD Vance rallies and White House events\\, with Rep America's live streams. repamerica.com/trump-schedule",
    "X-WR-TIMEZONE:America/New_York",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
    `URL:${SCHEDULE_URL}.ics`,
    ...[...s.upcoming, ...s.past].map((e) => vevent(e, stamp)),
    "END:VCALENDAR",
    "",
  ].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="trump-rally-schedule-rep-america.ics"',
      "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
