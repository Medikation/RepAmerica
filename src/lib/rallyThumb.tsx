// Renders the "TRUMP LIVE IN <STATE>" thumbnail (1920×1080 JPEG) from the rally template.
// Template = Medi's Florida thumbnail with the text band blanked; the band text is drawn with next/og (Anton) and
// composited with sharp. Server-only — used by /admin/today/thumb/[id].
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ImageResponse } from "next/og";

const W = 1920, H = 1080;
const BAND_TOP = 795; // where the black band starts on the 1920×1080 template (1590/2160 on the 4K original)
const BAND_H = H - BAND_TOP;
const RED = "#e21a1a";

const assets = (f: string) => path.join(process.cwd(), "src", "assets", f);

let fontCache: Promise<ArrayBuffer> | null = null;
const anton = () => (fontCache ??= readFile(assets("fonts/Anton.ttf")).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer));

/** Font size that fits "TRUMP LIVE IN <STATE>" in the band: Anton caps are ~0.42 em wide, cap height ~1.1 em. */
function fontSize(text: string): number {
  const maxW = W - 100, maxCap = 240;
  return Math.floor(Math.min(maxCap / 1.1, maxW / (0.42 * text.length)));
}

type BandPart = { text: string; color: string };

/** Live: "TRUMP LIVE IN GEORGIA" (LIVE red). Replay: "GEORGIA · TRUMP RALLY" (state red) — what the video is once the stream is over. */
export function bandParts(state: string, mode: "live" | "replay" = "live"): BandPart[] {
  return mode === "replay"
    ? [{ text: state, color: RED }, { text: `\u00a0· TRUMP RALLY`, color: "#fff" }]
    : [{ text: "TRUMP\u00a0", color: "#fff" }, { text: "LIVE", color: RED }, { text: `\u00a0IN ${state}`, color: "#fff" }];
}

export async function renderBand(state: string, mode: "live" | "replay" = "live"): Promise<Buffer> {
  const parts = bandParts(state, mode);
  const text = parts.map((p) => p.text).join("");
  const size = fontSize(text);
  const res = new ImageResponse(
    (
      <div style={{ width: W, height: BAND_H, background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: size, color: "#fff", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
        {parts.map((p, i) => <span key={i} style={{ color: p.color }}>{p.text}</span>)}
      </div>
    ),
    { width: W, height: BAND_H, fonts: [{ name: "Anton", data: await anton(), weight: 400, style: "normal" }] },
  );
  return Buffer.from(await res.arrayBuffer());
}

export async function renderRallyThumb(state: string, mode: "live" | "replay" = "live"): Promise<Buffer> {
  const [template, band] = await Promise.all([readFile(assets("stream-thumbs/rally-template.jpg")), renderBand(state.toUpperCase(), mode)]);
  return sharp(template).composite([{ input: band, top: BAND_TOP, left: 0 }]).jpeg({ quality: 90, mozjpeg: true }).toBuffer();
}
