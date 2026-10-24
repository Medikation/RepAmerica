// GET /trump-schedule.json — the public schedule as plain JSON for developers and AI assistants.
import { getPublicSchedule, isoET, plainDescription, SCHEDULE_DESCRIPTION, SCHEDULE_TITLE, SCHEDULE_URL, whenET, whenPT, type ScheduleEvent } from "@/lib/schedule";
import { CHANNEL_URL } from "@/lib/youtubeLives";

export const dynamic = "force-dynamic"; // rendered per request; the data behind it is cached 5 min and the response carries its own Cache-Control

const item = (e: ScheduleEvent) => ({
  id: e.id,
  title: e.headline,
  type: e.sub ?? (e.performer === "white-house" ? "White House event" : "Event"),
  performer: e.performerName || null,
  start: isoET(e.startsMs),
  start_utc: new Date(e.startsMs).toISOString(),
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
  page_url: `${SCHEDULE_URL}#event-${e.id}`,
});

export async function GET() {
  const s = await getPublicSchedule({ daysAhead: 7, daysBack: 14 });
  const body = {
    name: SCHEDULE_TITLE,
    description: SCHEDULE_DESCRIPTION,
    publisher: { name: "Rep America", url: "https://repamerica.com", youtube: CHANNEL_URL, host: "Medi" },
    page: SCHEDULE_URL,
    calendar_feed: `${SCHEDULE_URL}.ics`,
    generated_at: new Date(s.now).toISOString(),
    timezone_note: "start is ISO 8601 in US Eastern time with offset; start_utc is the same instant in UTC. Times can change; this feed regenerates every 5 minutes from the daily-refreshed schedule.",
    upcoming: s.upcoming.map(item),
    recently_covered: s.past.map(item),
  };
  return new Response(JSON.stringify(body, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600", "Access-Control-Allow-Origin": "*" },
  });
}
