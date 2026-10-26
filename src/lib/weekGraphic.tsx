// "This week" schedule graphic for social posts — square (1080×1080) for YouTube posts / X / IG grid / TikTok, or
// vertical (1080×1920) for Stories. Drawn with next/og (Anton) from the same schedule data as /trump-schedule.
// Server-only; used by /admin/today/week.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getPublicSchedule, type ScheduleEvent } from "@/lib/schedule";
import { shortTimeET } from "@/lib/streamPackage";

const RED = "#e21a1a";
const assets = (f: string) => path.join(process.cwd(), "src", "assets", f);
let fontCache: Promise<ArrayBuffer> | null = null;
const anton = () => (fontCache ??= readFile(assets("fonts/Anton.ttf")).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer));

const ET = "America/New_York";
const dayOf = (ms: number) => new Date(ms).toLocaleDateString("en-US", { weekday: "short", timeZone: ET }).toUpperCase();
const mdOf = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: ET });
const rangeLabel = (a: number, b: number) => {
  const f = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: ET });
  return `${f(a)} – ${f(b)}`;
};

/** The week the graphic covers: today (ET) through the next six days. */
export async function weekEvents(): Promise<{ events: ScheduleEvent[]; from: number; to: number; tiktokLine: string }> {
  // Rep America's own week: the rallies Medi streams + any standalone live; the after-rally TikTok lives collapse into one footer line.
  const s = await getPublicSchedule({ daysAhead: 7, daysBack: 0, scope: "medi" });
  const from = s.now;
  const to = s.now + 6 * 86400000;
  const events = s.upcoming.filter((e) => e.status !== "canceled" && !e.aftershowOf && e.startsMs <= to + 86400000).slice(0, 9);
  const tiktokLine = s.tiktok.aftershow ? `AFTER EVERY RALLY: LIVE ON TIKTOK @REPAMERICA` : "";
  return { events, from, to, tiktokLine };
}

export async function renderWeekGraphic(opts: { vertical?: boolean; data?: { events: ScheduleEvent[]; from: number; to: number; tiktokLine?: string } } = {}): Promise<Buffer> {
  const data = opts.data ?? (await weekEvents());
  const { events, from, to } = data;
  const tiktokLine = data.tiktokLine ?? "";
  const W = 1080, H = opts.vertical ? 1920 : 1080;
  const rows = events.length;
  const rowH = Math.min(92, Math.floor(((opts.vertical ? 1140 : 530) - 20) / Math.max(rows, 1)));
  const font = await anton();
  const res = new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", flexDirection: "column", background: "#0b0b0d", color: "#fff", fontFamily: "Anton", padding: opts.vertical ? "140px 72px 120px" : "64px 72px 56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: RED }} />
          <div style={{ fontSize: 30, letterSpacing: 4, color: "rgba(255,255,255,.72)" }}>{`THIS WEEK · ${rangeLabel(from, to).toUpperCase()}`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 18, lineHeight: 0.98 }}>
          <div style={{ fontSize: opts.vertical ? 118 : 104 }}>TRUMP RALLY</div>
          <div style={{ fontSize: opts.vertical ? 118 : 104, color: RED }}>SCHEDULE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: opts.vertical ? 60 : 36, borderTop: "3px solid rgba(255,255,255,.18)" }}>
          {events.map((e) => {
            const trump = e.performer === "trump";
            const tiktok = e.platform === "tiktok";
            const who = trump ? "" : tiktok ? "TIKTOK LIVE · " : e.performer === "vance" ? "JD VANCE · " : e.performer === "white-house" ? "WHITE HOUSE · " : "";
            const place = tiktok ? (e.sub ?? "TALK TO ME") : e.city && e.state ? `${e.city}, ${e.state}` : e.headline.replace(/^.*?—\s*/, "");
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", height: rowH, borderBottom: "2px solid rgba(255,255,255,.12)", gap: 22 }}>
                <div style={{ display: "flex", flexDirection: "column", width: 215, lineHeight: 1 }}>
                  <div style={{ fontSize: Math.min(36, rowH * 0.4), color: trump ? "#fff" : "rgba(255,255,255,.7)", whiteSpace: "nowrap" }}>{`${dayOf(e.startsMs)} ${mdOf(e.startsMs)}`}</div>
                </div>
                <div style={{ display: "flex", width: 165, fontSize: Math.min(36, rowH * 0.4), color: RED, lineHeight: 1, whiteSpace: "nowrap" }}>{e.all_day ? "TBA" : `${shortTimeET(e.startsMs)} ET`}</div>
                <div style={{ display: "flex", flex: 1, fontSize: Math.min(44, rowH * 0.46), lineHeight: 1, color: trump ? "#fff" : "rgba(255,255,255,.7)", whiteSpace: "nowrap", overflow: "hidden" }}>{`${who}${place.toUpperCase()}`}</div>
              </div>
            );
          })}
          {!events.length && <div style={{ fontSize: 40, padding: "40px 0", color: "rgba(255,255,255,.6)" }}>NOTHING ANNOUNCED YET — CHECK BACK</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto", paddingTop: 30, gap: 8 }}>
          <div style={{ fontSize: 38, color: "#fff" }}>WATCH LIVE WITH MEDI · YOUTUBE @REPAMERICA</div>
          {tiktokLine ? <div style={{ fontSize: 31, color: RED }}>{tiktokLine}</div> : null}
          <div style={{ fontSize: 28, color: "rgba(255,255,255,.72)", letterSpacing: 1 }}>UPDATES DAILY · REPAMERICA.COM/SCHEDULE</div>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: [{ name: "Anton", data: font, weight: 400, style: "normal" }] },
  );
  return Buffer.from(await res.arrayBuffer());
}
