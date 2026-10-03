import { NextResponse } from "next/server";
import sharp from "sharp";
import { getAdmin } from "@/lib/adminAuth";
import { supabaseAdmin, MEDIA_BASE } from "@/lib/supabase";

// Admin media upload: puts one image into the public `media` Storage bucket under a path the admin chooses.
// Source is either an uploaded file or a URL fetched server-side (book covers come from the affiliate listing).
// Optional resize to a target height (covers are stored 750px tall, JPEG q85 — the Round 47 rule). Signed-in admins only;
// the service role does the write (the bucket has no insert policy for anon/authenticated on purpose).
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

function back(params: Record<string, string>) {
  const u = new URL("/admin/media", SITE);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  return NextResponse.redirect(u.toString(), 303);
}

export async function POST(req: Request) {
  const state = await getAdmin();
  if (!state.user) return NextResponse.redirect(`${SITE}/admin/login?next=${encodeURIComponent("/admin/media")}`, 303);

  const form = await req.formData();
  const rawPath = String(form.get("path") ?? "").trim().replace(/^\/+/, "");
  const url = String(form.get("url") ?? "").trim();
  const file = form.get("file");
  const height = Number(form.get("height") ?? 0) || 0;
  const quality = Math.min(95, Math.max(40, Number(form.get("quality") ?? 85) || 85));

  if (!rawPath || /\.\.|[^A-Za-z0-9/_\-.]/.test(rawPath)) return back({ error: "path must be like articles/name.jpg (letters, digits, - _ . / only)" });

  let input: Buffer;
  try {
    if (file instanceof File && file.size > 0) {
      input = Buffer.from(await file.arrayBuffer());
    } else if (url) {
      const r = await fetch(url, { headers: { "user-agent": UA, accept: "image/*,*/*;q=0.8" }, redirect: "follow" });
      if (!r.ok) return back({ error: `fetch failed: ${r.status}` });
      input = Buffer.from(await r.arrayBuffer());
    } else {
      return back({ error: "choose a file or paste a URL" });
    }
  } catch (e) {
    return back({ error: `could not read the source: ${(e as Error).message}` });
  }
  if (input.length > 25 * 1024 * 1024) return back({ error: "source is over 25 MB" });

  let out: Buffer;
  let contentType = "image/jpeg";
  const meta = await sharp(input).metadata().catch(() => null);
  if (!meta?.width || !meta.height) return back({ error: "not an image sharp can read" });
  const wantsJpeg = /\.jpe?g$/i.test(rawPath);
  const wantsPng = /\.png$/i.test(rawPath);
  const wantsWebp = /\.webp$/i.test(rawPath);
  let pipeline = sharp(input).rotate();
  if (height > 0 && meta.height !== height) pipeline = pipeline.resize({ height, withoutEnlargement: false });
  if (wantsPng) { out = await pipeline.png().toBuffer(); contentType = "image/png"; }
  else if (wantsWebp) { out = await pipeline.webp({ quality }).toBuffer(); contentType = "image/webp"; }
  else if (wantsJpeg) { out = await pipeline.flatten({ background: "#ffffff" }).jpeg({ quality, mozjpeg: true }).toBuffer(); }
  else return back({ error: "path must end in .jpg, .png or .webp" });
  const info = await sharp(out).metadata();

  const { error } = await supabaseAdmin().storage.from("media").upload(rawPath, out, { contentType, upsert: true, cacheControl: "31536000" });
  if (error) return back({ error: `storage: ${error.message}` });
  return back({ ok: `${MEDIA_BASE}/${rawPath}`, size: `${info.width}×${info.height} · ${Math.round(out.length / 1024)} KB` });
}
