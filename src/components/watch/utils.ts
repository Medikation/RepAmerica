import type { Article } from "@/lib/data";

/** Port of snippets/youtube-id.liquid: bare video ID from a youtu.be / watch?v= / embed / live / shorts URL. */
export function youtubeIdFromUrl(url: string | undefined | null): string {
  if (!url) return "";
  const s = String(url);
  const take = (marker: string, stopAtQuery = true) => {
    const rest = s.split(marker).pop() ?? "";
    const q = stopAtQuery ? rest.split("?")[0] : rest;
    return q.split("&")[0];
  };
  if (s.includes("youtu.be/")) return take("youtu.be/");
  if (s.includes("watch?v=")) return take("watch?v=", false);
  if (s.includes("/embed/")) return take("/embed/");
  if (s.includes("/live/")) return take("/live/");
  if (s.includes("/shorts/")) return take("/shorts/");
  return "";
}

/** `meta.youtube_video_id` first, then parse `meta.youtube_url` like the Liquid did. */
export function videoId(article: Pick<Article, "meta">): string {
  const direct = article.meta?.youtube_video_id;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return youtubeIdFromUrl(article.meta?.youtube_url as string | undefined).trim();
}

export const metaString = (article: Pick<Article, "meta">, key: string): string => {
  const v = article.meta?.[key];
  return v === undefined || v === null ? "" : String(v);
};

/** Shopify store timezone (PDT/PST) — dates rendered by the theme used the store's zone. */
const TZ = "America/Los_Angeles";

/** Liquid `| date: "%b %-d, %Y"` → "Sep 8, 2026" */
export function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ });
}

/** Liquid `| time_tag: format: 'date'` → "September 8, 2026" */
export function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: TZ });
}

/** Liquid `| strip_html` */
export function stripHtml(html: string | null | undefined): string {
  return (html ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/** Liquid `| truncatewords: n` (default ellipsis "...") */
export function truncateWords(text: string, n: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length <= n) return words.join(" ");
  return words.slice(0, n).join(" ") + "...";
}

/** Liquid `| handleize` */
export function handleize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Article excerpt exactly as the watch sections computed it: excerpt | default: content | strip_html | truncatewords: N */
export function excerptOf(article: Pick<Article, "summary" | "body_html">, words: number): string {
  const src = article.summary && stripHtml(article.summary) ? article.summary : article.body_html;
  return truncateWords(stripHtml(src), words);
}

export const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
