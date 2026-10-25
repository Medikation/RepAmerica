// GET /admin/today/thumb/<event id>  →  the "TRUMP LIVE IN <STATE>" thumbnail for that show_events row, as a 1920×1080 JPEG.
// Rendered on demand from the rally template (src/lib/rallyThumb.tsx) so every future rally has one with nothing to upload.
// Admin-only, like the rest of /admin. `?dl=1` downloads it with a clean file name.
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin } from "@/lib/supabase";
import { renderRallyThumb } from "@/lib/rallyThumb";
import { thumbState } from "@/lib/streamPackage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const state = await getAdmin();
  if (!state.user) {
    const here = new URL(req.url).pathname + new URL(req.url).search;
    return NextResponse.redirect(new URL(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent(here)}` : `/admin/login?next=${encodeURIComponent(here)}`, req.url));
  }
  const { id } = await ctx.params;
  const eventId = Number(id.replace(/\.jpe?g$/i, ""));
  if (!Number.isFinite(eventId)) return new NextResponse("Bad id", { status: 400 });

  const { data: e } = await supabaseAdmin().from("show_events").select("id, title, location").eq("id", eventId).maybeSingle();
  if (!e) return new NextResponse("No such event", { status: 404 });
  const st = thumbState(e);
  if (!st) return new NextResponse("Can't read a US state from this event — add it to the title as 'in City, ST'.", { status: 422 });

  const jpg = await renderRallyThumb(st);
  const url = new URL(req.url);
  const file = `trump-live-in-${st.toLowerCase().replace(/[^a-z]+/g, "-")}.jpg`;
  return new NextResponse(new Uint8Array(jpg), {
    headers: {
      "Content-Type": "image/jpeg",
      "Content-Length": String(jpg.length),
      "Cache-Control": "private, max-age=3600",
      ...(url.searchParams.get("dl") ? { "Content-Disposition": `attachment; filename="${file}"` } : {}),
    },
  });
}
