// Renders the thumbnail for Medi's open-topic lives at its original size (3840×2160):
//   REP AMERICA [LIVE]   ← small branding line, LIVE in a red block
//   POLITICS.            ← the words: 1–4 lines, all the same size, fitted to the navy column
//   [LAUGHS.]            ← a line written *LIKE THIS* sits on a red block (the one accent)
//   LIFE.
//   [NOV 20]             ← today's date (Pacific), navy on a white block
// Base image = his own high-res photo with nothing on it (src/assets/stream-thumbs/live-blank.png, YouTube_Thumbnail_77,
// 2026-11-20). Every piece of lettering is drawn here with next/og (Anton, white; red blocks for emphasis), trimmed to its
// ink and composited with sharp — so new words are a one-line change (show_settings.live_thumb_words, lines split on "|"),
// and a new photo is a replacement of that one PNG. Output is a lossless PNG. Server-only — used by /admin/today/live-thumb.
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type OverlayOptions } from "sharp";
import { ImageResponse } from "next/og";

const COL_CENTER_X = 2999; // centre of the navy text column on the 3840-wide photo
const COL_MAX_W = 1340; // widest a line of the words may run
const RED = { r: 226, g: 26, b: 26, alpha: 1 };
const CAP = 0.879; // Anton cap height ÷ font size

const BRAND_TOP = 200, BRAND_SIZE = 116, BRAND_GAP = 26, BRAND_PAD_X = 20, BRAND_PAD_Y = 15;
const WORDS_TOP = 440, WORDS_BOTTOM = 1616; // the band the words sit in (centred in it when they are shorter)
const WORDS_PROBE_SIZE = 396; // size of the three-line default ("POLITICS." fills the column at this size)
const WORDS_MAX_SIZE = 540; // shorter or fewer lines grow up to this
const WORDS_LEAD = 0.25; // gap between lines ÷ cap height
const WORDS_PAD_X = 0.13, WORDS_PAD_Y = 0.085; // red block around an accented line, ÷ cap height
const DATE_TOP = 1790, DATE_SIZE = 150, DATE_PAD_X = 34, DATE_PAD_Y = 24;
const NAVY = "#01214b"; // the navy of the photo's right-hand panel
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

export const LIVE_THUMB_WORDS_DEFAULT = "POLITICS.|*LAUGHS.*|LIFE.";

const assets = (f: string) => path.join(process.cwd(), "src", "assets", f);
let fontCache: Promise<ArrayBuffer> | null = null;
const anton = () => (fontCache ??= readFile(assets("fonts/Anton.ttf")).then((b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer));

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
/** "NOV 20" from a day key (YYYY-MM-DD) — the way the date is written on the thumbnail (month abbreviation + day, no year). */
export const thumbDate = (key: string) => { const [, m, d] = key.split("-").map(Number); return `${MONTHS[m - 1]} ${d}`; };

type Line = { text: string; accent: boolean };
const parseLines = (words: string | null | undefined): Line[] =>
  (words || "").split(/[|\n]/).map((l) => l.trim().toUpperCase()).filter(Boolean).slice(0, 4)
    .map((l) => { const m = /^\*(.+)\*$/.exec(l); return { text: (m ? m[1] : l).trim(), accent: !!m }; }).filter((l) => l.text);
/** The words as plain lines (accent marks removed): split on "|" or line breaks, upper-cased, at most four. */
export const thumbLines = (words: string | null | undefined) => {
  const lines = parseLines(words);
  return (lines.length ? lines : parseLines(LIVE_THUMB_WORDS_DEFAULT)).map((l) => l.text);
};

type Ink = { png: Buffer; width: number; height: number };
/** One line of Anton at `size` (white unless `color` is given), trimmed to its ink. */
async function ink(text: string, size: number, color = "#fff"): Promise<Ink> {
  const W = Math.min(8000, Math.ceil(text.length * size * 0.75) + 400), H = Math.ceil(size * 1.6);
  const res = new ImageResponse(
    <div style={{ width: W, height: H, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Anton", fontSize: size, color, whiteSpace: "nowrap" }}>{text}</div>,
    { width: W, height: H, fonts: [{ name: "Anton", data: await anton(), weight: 400, style: "normal" }] },
  );
  const { data, info } = await sharp(Buffer.from(await res.arrayBuffer())).trim().png().toBuffer({ resolveWithObject: true });
  return { png: data, width: info.width, height: info.height };
}
const block = (width: number, height: number, background = RED) => sharp({ create: { width, height, channels: 4, background } }).png().toBuffer();
const redBlock = (width: number, height: number) => block(width, height);

/** Full-size PNG (lossless) by default; `previewWidth` gives a small JPEG for the admin page. */
export async function renderLiveThumb(dayKey: string, opts: { words?: string | null; previewWidth?: number } = {}): Promise<{ body: Buffer; type: "image/png" | "image/jpeg" }> {
  const parsed = parseLines(opts.words);
  const meta = parsed.length ? parsed : parseLines(LIVE_THUMB_WORDS_DEFAULT);
  const lines = meta.map((l) => l.text);
  const colW = meta.some((l) => l.accent) ? COL_MAX_W / (1 + 2 * WORDS_PAD_X * CAP * 0.5) : COL_MAX_W; // leave room for the block's side padding
  // Size the words: measure at the default size, then scale so the widest line fits the column and the stack fits the band.
  const probe = await Promise.all(lines.map((l) => ink(l, WORDS_PROBE_SIZE)));
  const widest = Math.max(...probe.map((p) => p.width));
  const stackAt = (size: number) => { const cap = size * CAP; return lines.length * cap + (lines.length - 1) * cap * WORDS_LEAD; };
  const size = Math.floor(Math.min(WORDS_MAX_SIZE, WORDS_PROBE_SIZE * (colW / widest), WORDS_PROBE_SIZE * ((WORDS_BOTTOM - WORDS_TOP) / stackAt(WORDS_PROBE_SIZE))));
  const [template, brand, live, date, wordInks] = await Promise.all([
    readFile(assets("stream-thumbs/live-blank.png")),
    ink("REP AMERICA", BRAND_SIZE),
    ink("LIVE", BRAND_SIZE),
    ink(thumbDate(dayKey), DATE_SIZE, NAVY),
    size === WORDS_PROBE_SIZE ? Promise.resolve(probe) : Promise.all(lines.map((l) => ink(l, size))),
  ]);
  const layers: OverlayOptions[] = [];
  // Branding line: REP AMERICA + LIVE in a red block, centred as one unit.
  const brandW = brand.width + BRAND_GAP + live.width + 2 * BRAND_PAD_X;
  const brandX = Math.round(COL_CENTER_X - brandW / 2);
  const liveX = brandX + brand.width + BRAND_GAP;
  layers.push({ input: brand.png, top: BRAND_TOP, left: brandX });
  layers.push({ input: await redBlock(live.width + 2 * BRAND_PAD_X, live.height + 2 * BRAND_PAD_Y), top: BRAND_TOP - BRAND_PAD_Y, left: liveX });
  layers.push({ input: live.png, top: BRAND_TOP, left: liveX + BRAND_PAD_X });
  // The words, stacked and centred in their band.
  const cap = size * CAP;
  let y = WORDS_TOP + ((WORDS_BOTTOM - WORDS_TOP) - stackAt(size)) / 2;
  for (let i = 0; i < wordInks.length; i++) {
    const w = wordInks[i], left = Math.round(COL_CENTER_X - w.width / 2);
    if (meta[i].accent) {
      const px = Math.round(cap * WORDS_PAD_X), py = Math.round(cap * WORDS_PAD_Y);
      layers.push({ input: await redBlock(w.width + 2 * px, Math.round(cap) + 2 * py), top: Math.round(y) - py, left: left - px });
    }
    layers.push({ input: w.png, top: Math.round(y), left });
    y += cap * (1 + WORDS_LEAD);
  }
  // Date: navy on a white block.
  const dateX = Math.round(COL_CENTER_X - date.width / 2);
  layers.push({ input: await block(date.width + 2 * DATE_PAD_X, date.height + 2 * DATE_PAD_Y, WHITE), top: DATE_TOP - DATE_PAD_Y, left: dateX - DATE_PAD_X });
  layers.push({ input: date.png, top: DATE_TOP, left: dateX });
  const full = sharp(template).composite(layers);
  if (opts.previewWidth) return { body: await sharp(await full.png({ compressionLevel: 1 }).toBuffer()).resize({ width: opts.previewWidth }).jpeg({ quality: 85 }).toBuffer(), type: "image/jpeg" };
  return { body: await full.png({ compressionLevel: 6 }).toBuffer(), type: "image/png" };
}
