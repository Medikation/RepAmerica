// GET /admin/today/week  →  this week's "Trump rally schedule" graphic as PNG. `?v=1` = vertical 1080×1920 (Stories),
// default square 1080×1080 (YouTube posts, X, IG grid, TikTok). `?dl=1` downloads. Admin-only; always current.
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { renderWeekGraphic } from "@/lib/weekGraphic";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const state = await getAdmin();
  if (!state.user) return new NextResponse("Sign in at /admin/login first.", { status: 401 });
  const url = new URL(req.url);
  const vertical = url.searchParams.get("v") === "1";
  const png = await renderWeekGraphic({ vertical });
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const file = `trump-rally-schedule-week-${stamp}${vertical ? "-story" : ""}.png`;
  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Length": String(png.length),
      "Cache-Control": "private, max-age=600",
      ...(url.searchParams.get("dl") ? { "Content-Disposition": `attachment; filename="${file}"` } : {}),
    },
  });
}
