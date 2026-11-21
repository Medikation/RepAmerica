// GET /trump-schedule.ics — the political schedule as an iCalendar feed (subscribe in Google / Apple / Outlook).
import { icsFeed } from "@/lib/scheduleFeeds";
import { SCHEDULE_URL } from "@/lib/schedule";
export const dynamic = "force-dynamic";
export async function GET() {
  return icsFeed("political", SCHEDULE_URL, "Trump & White House Schedule — Rep America", "President Trump's public schedule, White House briefings, JD Vance, Marco Rubio, Congress and the Supreme Court. Updated daily. repamerica.com/trump-schedule");
}
