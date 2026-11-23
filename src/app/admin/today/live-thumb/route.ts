// GET /admin/today/live-thumb  →  today's "REP AMERICA LIVE · POLITICS. LAUGHS. LIFE. · NOV 20" thumbnail (3840×2160 PNG, his original size).
// Drawn on his blank photo: the words come from show_settings.live_thumb_words, the date is today's in Pacific, same as the title in the go-live box — or any day with `?date=2026-11-25` (the date picker in the go-live box, for scheduling streams ahead). `?dl=1` downloads it; `?w=480` is the small preview.
// Admin-only, like the rest of /admin.
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/adminAuth";
import { dayKey } from "@/lib/googleCalendar";
import { liveDateKey } from "@/lib/liveThumb";
import { renderLiveThumb } from "@/lib/liveThumb";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const state = await getAdmin();
  const url = new URL(req.url);
  if (!state.user) {
    const here = url.pathname + url.search;
    return NextResponse.redirect(new URL(state.canRefresh ? `/admin/refresh?next=${encodeURIComponent(here)}` : `/admin/login?next=${encodeURIComponent(here)}`, req.url));
  }
  const key = liveDateKey(url.searchParams.get("date")) ?? dayKey(Date.now());
  const w = Number(url.searchParams.get("w"));
  // The words on it live in show_settings.live_thumb_words ("POLITICS.|LAUGHS.|LIFE." — "|" starts a new line); missing → the default.
  const { data: row } = await supabaseAdmin().from("show_settings").select("value").eq("key", "live_thumb_words").maybeSingle();
  const img = await renderLiveThumb(key, { words: (row as { value: string | null } | null)?.value, previewWidth: w >= 100 && w <= 1920 ? Math.round(w) : undefined });
  return new NextResponse(new Uint8Array(img.body), {
    headers: {
      "Content-Type": img.type,
      "Content-Length": String(img.body.length),
      "Cache-Control": "private, no-store",
      ...(url.searchParams.get("dl") ? { "Content-Disposition": `attachment; filename="rep-america-live-${key}.png"` } : {}),
    },
  });
}
