// Renders the "REP AMERICA LIVE · <date>" thumbnail for Medi's open-topic lives at its original size (3840×2160).
// Template = his own Canva thumbnail (2026-11-19) with the lettering he set and only the date strip left blank, stored
// lossless; the date is drawn with next/og (Anton), trimmed to its ink, and composited with sharp where his date sat.
// Server-only — used by /admin/today/live-thumb.
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { ImageResponse } from "next/og";

const DATE_CENTER_X = 2999; // centre of the navy text column on the 3840-wide template
const DATE_TOP = 1698; // top of the date's capitals on his original
const DATE_SIZE = 233; // Anton size that reproduces his "NOV 19, 2026" (1154 px wide)
const DATE_MAX_W = 1400; // the column is ~1470 wide; longer dates shrink to fit

const assets = (f: string) => path.join(process.cwd(), "src", "assets", f);
let fontCache: Promise<ArrayBuffer> | null = null;
const anton = () => (fontCache ??= readFile(assets("fonts/Anton.ttf")).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer));

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** "NOV 19, 2026" from a day key (YYYY-MM-DD) — the way the date is written on the thumbnail. */
export const thumbDate = (key: string) => { const [y, m, d] = key.split("-").map(Number); return `${MONTHS[m - 1]} ${d}, ${y}`; };

async function renderDate(text: string): Promise<{ png: Buffer; width: number; height: number }> {
  const W = 2200, H = 520;
  const res = new ImageResponse(
    <div style={{ width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: DATE_SIZE, color: "#fff", whiteSpace: "nowrap" }}>{text}</div>,
    { width: W, height: H, fonts: [{ name: "Anton", data: await anton(), weight: 400, style: "normal" }] },
  );
  let img = sharp(Buffer.from(await res.arrayBuffer())).trim();
  let { data, info } = await img.png().toBuffer({ resolveWithObject: true });
  if (info.width > DATE_MAX_W) {
    img = sharp(data).resize({ width: DATE_MAX_W });
    ({ data, info } = await img.png().toBuffer({ resolveWithObject: true }));
  }
  return { png: data, width: info.width, height: info.height };
}

/** Full-size PNG (lossless) by default; `previewWidth` gives a small JPEG for the admin page. */
export async function renderLiveThumb(dayKey: string, previewWidth?: number): Promise<{ body: Buffer; type: "image/png" | "image/jpeg" }> {
  const [template, date] = await Promise.all([readFile(assets("stream-thumbs/live-template.png")), renderDate(thumbDate(dayKey))]);
  const full = sharp(template).composite([{ input: date.png, top: DATE_TOP, left: Math.round(DATE_CENTER_X - date.width / 2) }]);
  if (previewWidth) return { body: await sharp(await full.png({ compressionLevel: 1 }).toBuffer()).resize({ width: previewWidth }).jpeg({ quality: 85 }).toBuffer(), type: "image/jpeg" };
  return { body: await full.png({ compressionLevel: 6 }).toBuffer(), type: "image/png" };
}
