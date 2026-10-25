// GET /trump-schedule.ics — the political schedule as an iCalendar feed (subscribe in Google / Apple / Outlook).
import { icsFeed } from "@/lib/scheduleFeeds";
import { SCHEDULE_URL } from "@/lib/schedule";
export const dynamic = "force-dynamic";
export async function GET() {
  return icsFeed("political", SCHEDULE_URL, "Trump & White House Schedule — Rep America", "Upcoming Trump rallies, White House events and JD Vance rallies, with Rep America's live streams. repamerica.com/trump-schedule");
}
