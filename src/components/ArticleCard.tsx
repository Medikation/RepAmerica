/* Port of snippets/article-card.liquid. Props mirror the snippet's render params.
 * Theme settings baked in from config/settings_data.json: blog_card_style = "standard",
 * blog_card_color_scheme = "scheme-2", badge_position = "bottom left", first color scheme = "scheme-1"
 * (override via props if a caller reads them from getSetting("theme")). */
import type { Article, Blog } from "@/lib/data";

export interface ArticleCardProps {
  article: Article;
  /** Blog handle for the URL; defaults to `article.blog`. */
  blog?: Blog | string;
  showImage?: boolean;
  showDate?: boolean;
  showAuthor?: boolean;
  showExcerpt?: boolean;
  showBadge?: boolean;
  /** section `image_height` setting: "adapt" | "small" | "medium" | "large" */
  mediaHeight?: string;
  /** `media_aspect_ratio`; defaults to 1 like the snippet. Blog index passes the image's own ratio. */
  mediaAspectRatio?: number | null;
  lazyLoad?: boolean;
  cardStyle?: "standard" | "card";
  colorScheme?: string;
  badgePosition?: string;
  badgeColorScheme?: string;
}

/** Liquid `| truncate: 50` (the ellipsis counts toward the length). */
export function truncate(s: string, n = 50): string {
  return s.length > n ? s.slice(0, n - 3).trimEnd() + "..." : s;
}

/** Liquid `| strip_html | truncatewords: 30` */
export function excerpt(html: string, words = 30): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  const parts = text.split(" ");
  return parts.length > words ? parts.slice(0, words).join(" ") + "..." : text;
}

/** `{{ article.published_at | time_tag: format: 'date' }}` — "January 3, 1971" in the shop timezone (PDT). */
export function ArticleDate({ iso }: { iso: string }) {
  const d = new Date(iso);
  const label = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "America/Los_Angeles" }).format(d);
  return <time dateTime={d.toISOString().replace(/\.\d{3}Z$/, "Z")}>{label}</time>;
}

/** YouTube video id from the metafield, mirroring the snippet's `split` chains. */
export function youtubeVideoId(article: Article): string {
  const fromMeta = article.meta?.youtube_video_id;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  const url = String(article.meta?.youtube_url ?? "");
  for (const marker of ["watch?v=", "youtu.be/", "/live/", "/embed/"]) {
    if (url.includes(marker)) return url.split(marker).pop()!.split(marker === "watch?v=" ? "&" : "?")[0];
  }
  return "";
}

export default function ArticleCard({
  article, blog, showImage = true, showDate = false, showAuthor = false, showExcerpt = false, showBadge = false,
  mediaHeight, mediaAspectRatio, lazyLoad = true, cardStyle = "standard", colorScheme = "scheme-2",
  badgePosition = "bottom left", badgeColorScheme = "scheme-1",
}: ArticleCardProps) {
  const ratio = mediaAspectRatio ?? 1;
  const ratioPercent = `${(1 / ratio) * 100}%`;
  const videoId = youtubeVideoId(article);
  const youtubeThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";
  const hasMedia = !!showImage && (!!article.image_url || !!youtubeThumbnail);
  const url = `/blogs/${blog ?? article.blog}/${article.handle}`;
  const title = truncate(article.title);

  const cardClass = [
    "card article-card", `card--${cardStyle}`,
    mediaHeight && mediaHeight !== "adapt" ? `article-card__image--${mediaHeight}` : "",
    hasMedia ? "card--media" : "card--text",
    cardStyle === "card" ? `color-${colorScheme} gradient` : "",
    (cardStyle === "card" && mediaHeight == null && !hasMedia) || showImage === false ? "ratio" : "",
  ].filter(Boolean).join(" ");
  const innerClass = [
    "card__inner",
    cardStyle === "standard" ? `color-${colorScheme} gradient` : "",
    hasMedia || cardStyle === "standard" ? "ratio" : "",
  ].filter(Boolean).join(" ");

  const excerptText = showExcerpt ? excerpt(article.summary || article.body_html || "") : "";

  const info = (
    <div className="article-card__info caption-with-letter-spacing h5">
      {showDate && <span className="circle-divider"><ArticleDate iso={article.published_at} /></span>}
      {showAuthor && <span>{article.author}</span>}
    </div>
  );
  const heading = (
    <h3 className={`card__heading${showExcerpt ? " h2" : ""}`}>
      <a href={url} className="full-unstyled-link">{title}</a>
    </h3>
  );

  return (
    <div className="article-card-wrapper card-wrapper underline-links-hover">
      <div className={cardClass} style={{ "--ratio-percent": ratioPercent } as React.CSSProperties}>
        <div className={innerClass} style={{ "--ratio-percent": ratioPercent } as React.CSSProperties}>
          {hasMedia && (
            <div className="article-card__image-wrapper card__media">
              <div className="article-card__image media media--hover-effect">
                {article.image_url ? (
                  <img
                    src={article.image_url}
                    alt={article.image_alt ?? ""}
                    className="motion-reduce"
                    loading={lazyLoad ? "lazy" : undefined}
                    width={article.image_width ?? undefined}
                    height={article.image_height ?? undefined}
                  />
                ) : (
                  <img src={youtubeThumbnail} alt={article.title} className="motion-reduce" loading={lazyLoad ? "lazy" : undefined} width={1280} height={720} />
                )}
              </div>
            </div>
          )}
          <div className="card__content">
            <div className="card__information">
              {heading}
              {info}
            </div>
          </div>
        </div>

        <div className="card__content">
          <div className="card__information">
            {heading}
            {info}
            {showExcerpt && excerptText && <p className="article-card__excerpt rte-width">{excerptText}</p>}
          </div>
          {showBadge && (
            <div className={`card__badge ${badgePosition}`}>
              <span className={`badge color-${badgeColorScheme}`}>Blog</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
