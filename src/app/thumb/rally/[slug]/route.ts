// GET /thumb/rally/<state-slug>.jpg?mode=live|replay — the rally thumbnail art, public (it is only the art, no data),
// CORS-open so YouTube Studio's page can fetch it when Claude swaps thumbnails. e.g. /thumb/rally/north-carolina.jpg?mode=replay
import { NextResponse } from "next/server";
import { renderRallyThumb } from "@/lib/rallyThumb";
import { US_STATES } from "@/lib/streamPackage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const name = slug.replace(/\.jpe?g$/i, "").replace(/-/g, " ").toUpperCase();
  if (!Object.values(US_STATES).some((s) => s.toUpperCase() === name)) return new NextResponse("Unknown state", { status: 404 });
  const mode = new URL(req.url).searchParams.get("mode") === "replay" ? "replay" : "live";
  const jpg = await renderRallyThumb(name, mode);
  return new NextResponse(new Uint8Array(jpg), {
    headers: { "Content-Type": "image/jpeg", "Content-Length": String(jpg.length), "Cache-Control": "public, max-age=86400", "Access-Control-Allow-Origin": "*" },
  });
}
