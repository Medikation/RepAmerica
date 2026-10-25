// GET /trump-schedule.json — the political schedule as plain JSON for developers and AI assistants.
import { jsonFeed } from "@/lib/scheduleFeeds";
import { SCHEDULE_DESCRIPTION, SCHEDULE_TITLE, SCHEDULE_URL } from "@/lib/schedule";
export const dynamic = "force-dynamic";
export async function GET() {
  return jsonFeed("political", SCHEDULE_URL, SCHEDULE_TITLE, SCHEDULE_DESCRIPTION);
}
