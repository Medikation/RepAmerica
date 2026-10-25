// GET /schedule.ics — Rep America's own week (rallies Medi streams + his TikTok lives) as an iCalendar feed.
import { icsFeed } from "@/lib/scheduleFeeds";
import { MEDI_URL } from "@/lib/schedule";
export const dynamic = "force-dynamic";
export async function GET() {
  return icsFeed("medi", MEDI_URL, "Rep America LIVE — Medi's schedule", "The Trump rallies Medi streams live on YouTube and his TikTok lives after every rally. repamerica.com/schedule");
}
