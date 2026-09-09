/** Server-side helper: a tiny base64 YouTube thumbnail (default.jpg, ~2-3 KB) to use as an instant blurred placeholder
 *  while the full-size thumbnail loads. Cached by Next's fetch cache alongside the page's revalidate window. */
export async function youtubeBlurDataUrl(videoId: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://img.youtube.com/vi/${videoId}/default.jpg`, { next: { revalidate: 3600 } });
    if (!res.ok) return undefined;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 20_000) return undefined; // not tiny → don't inline
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return undefined;
  }
}

export const youtubeThumbUrl = (videoId: string, kind: "maxresdefault" | "hqdefault" = "maxresdefault") =>
  `https://img.youtube.com/vi/${videoId}/${kind}.jpg`;
