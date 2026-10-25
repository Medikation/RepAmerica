// GET /schedule.json — Rep America's own week as plain JSON for developers and AI assistants.
import { jsonFeed } from "@/lib/scheduleFeeds";
import { MEDI_DESCRIPTION, MEDI_TITLE, MEDI_URL } from "@/lib/schedule";
export const dynamic = "force-dynamic";
export async function GET() {
  return jsonFeed("medi", MEDI_URL, MEDI_TITLE, MEDI_DESCRIPTION);
}
