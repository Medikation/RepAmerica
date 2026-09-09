import type { Article } from "@/lib/data";

/** Port of snippets/youtube-id.liquid: bare video ID from a full YouTube URL, or "" if unrecognised. */
export function youtubeId(url: unknown): string {
  if (typeof url !== "string" || !url) return "";
  const pick = (marker: string, dropQuery: boolean) => {
    let s = url.split(marker).pop() ?? "";
    if (dropQuery) s = s.split("?")[0];
    return s.split("&")[0].trim();
  };
  if (url.includes("youtu.be/")) return pick("youtu.be/", true);
  if (url.includes("watch?v=")) return pick("watch?v=", false);
  if (url.includes("/embed/")) return pick("/embed/", true);
  if (url.includes("/live/")) return pick("/live/", true);
  if (url.includes("/shorts/")) return pick("/shorts/", true);
  return "";
}

/** `article.metafields.custom.youtube_video_id` with the URL-parsing fallback the Liquid used. */
export function articleVideoId(article: Article): string {
  const id = article.meta?.youtube_video_id;
  if (typeof id === "string" && id.trim()) return id.trim();
  return youtubeId(article.meta?.youtube_url);
}

export const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
export const isBlank = (v: unknown): boolean => v == null || (typeof v === "string" && v.trim() === "");

/** Liquid `| date: "%b %-d, %Y"` (e.g. "Sep 4, 2026") in the shop's timezone (America/Los_Angeles). */
export function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" });
}

export const articleUrl = (a: Article) => `/blogs/${a.blog}/${a.handle}`;
