import type { Article } from "@/lib/data";
import GreatBooksIndexRow from "./GreatBooksIndexRow";
import LiteYouTube from "./LiteYouTube";
import { articleUrl, editionOf, inCategory, metaStr } from "./meta";

/** Settings of the `great-books-article` section (templates/article.great-books.json → `template:article.great-books`). */
export interface GreatBooksArticleSettings {
  parent_label?: string;
  parent_url?: string;
  collector_eyebrow?: string;
  cta_label?: string;
  disclosure?: string;
}

const DEFAULTS: Required<GreatBooksArticleSettings> = {
  parent_label: "The Great Books Project",
  parent_url: "/pages/great-books-project",
  collector_eyebrow: "From my shelf",
  cta_label: "View the recommended edition",
  disclosure: "Some links on this page are affiliate links. Purchases made through them help support the Great Books Project at no additional cost to you.",
};

/** The reading-order maths of great-books-article.liquid: position/total within the article's list_category,
 *  plus up to three "Read next" works (the ones after it, wrapping to the top of the list). */
export function readingOrder(article: Article, all: Article[]) {
  const list = metaStr(article, "list_category") || "Great Books";
  const category = inCategory(all, list);
  const idx = category.findIndex((a) => a.handle === article.handle);
  const related: { article: Article; pos: number }[] = [];
  if (idx >= 0) {
    for (let step = 1; step <= category.length - 1 && related.length < 3; step++) {
      const i = (idx + step) % category.length;
      related.push({ article: category[i], pos: i + 1 });
    }
  }
  return { list, position: idx + 1, total: category.length, related, next: related[0] ?? null };
}

/** Extracts the YouTube video id (snippets/youtube-id.liquid). */
function youtubeId(url: string): string {
  const m = url.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : "";
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Port of sections/great-books-article.liquid. `all` = the whole great-books blog in reading order. */
export default function GreatBooksArticle({ article, all, settings }: { article: Article; all: Article[]; settings: GreatBooksArticleSettings }) {
  const s = { ...DEFAULTS, ...settings };
  const author = metaStr(article, "author");
  const written = metaStr(article, "written_display");
  const translation = editionOf(article);
  const url = metaStr(article, "affiliate_url");
  const content = article.body_html ?? "";
  const editionWord = content.includes("Which edition to read") ? "edition" : "translation";

  const readingTime = metaStr(article, "reading_time");
  const difficulty = metaStr(article, "difficulty");
  const language = metaStr(article, "original_language");
  const genre = metaStr(article, "genre");
  const period = metaStr(article, "historical_period");
  const bestFor = metaStr(article, "best_for");
  const influencedBy = metaStr(article, "influenced_by");
  const influenced = metaStr(article, "influenced");

  const { list, position, total, related, next } = readingOrder(article, all);

  const amazonInline = url
    ? `<a class="ra-gba__inline-buy" href="${escapeHtml(url)}" target="_blank" rel="nofollow sponsored noopener">View on Amazon &rarr;</a>`
    : "";
  const body = content.split("[[AMAZON]]").join(amazonInline);

  const colLabel = metaStr(article, "collector_label");
  const colNote = metaStr(article, "collector_note");
  const colVideo = metaStr(article, "collector_video");
  const colImagesRaw = article.meta?.collector_images;
  const colImages: string[] = Array.isArray(colImagesRaw) ? (colImagesRaw as unknown[]).map(String) : [];
  const colVideoId = colVideo ? youtubeId(colVideo) : "";

  const coverAlt = article.image_alt || article.title;

  /** Videos about this book from the channel: meta.videos = [{ id | url, title, href?, note?, vertical? }]. First one embeds, the rest list. */
  const videosRaw = article.meta?.videos;
  const videos = (Array.isArray(videosRaw) ? (videosRaw as Record<string, unknown>[]) : [])
    .map((v) => {
      const id = typeof v.id === "string" && v.id ? v.id : youtubeId(String(v.url ?? ""));
      return {
        id,
        title: String(v.title ?? article.title),
        href: typeof v.href === "string" ? v.href : `https://youtu.be/${id}`,
        note: typeof v.note === "string" ? v.note : "",
        vertical: v.vertical === true,
        date: typeof v.date === "string" ? v.date : "",
        seconds: typeof v.seconds === "number" ? v.seconds : 0,
      };
    })
    .filter((v) => v.id);

  /** schema.org VideoObject for each attached video (Google's video rich results need name, thumbnailUrl, uploadDate). */
  const videoJsonLd = videos
    .filter((v) => v.date)
    .map((v) => ({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: v.title,
      description: `${v.title} — Medi on ${article.title}, from the Rep America show.`,
      thumbnailUrl: [`https://i.ytimg.com/vi/${v.id}/maxresdefault.jpg`, `https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`],
      uploadDate: v.date,
      ...(v.seconds ? { duration: `PT${Math.floor(v.seconds / 60)}M${v.seconds % 60}S` } : {}),
      embedUrl: `https://www.youtube.com/embed/${v.id}`,
      publisher: { "@type": "Organization", name: "Rep America", url: "https://repamerica.com" },
    }));

  return (
    <article className="ra-section ra-gba">
      <div className="ra-container-md">
        <p className="ra-gba__eyebrow">
          <a href={s.parent_url}>{s.parent_label}</a>
          {list && (
            <>
              {" "}
              <span aria-hidden="true">·</span> {list}
            </>
          )}
        </p>

        <h1 className="ra-gba__title">{article.title}</h1>

        <p className="ra-gba__meta">
          {author}
          {written && (
            <>
              {" "}
              <span aria-hidden="true">·</span> Written {written}
            </>
          )}
          {translation && (
            <>
              {" "}
              <span aria-hidden="true">·</span> {translation} {editionWord}
            </>
          )}
        </p>

        {article.summary && <div className="ra-gba__lede" dangerouslySetInnerHTML={{ __html: article.summary }} />}

        <div className={`ra-gba__brief${article.image_url ? "" : " ra-gba__brief--nocover"}`}>
          {article.image_url && (
            <figure className="ra-gba__cover">
              {url ? (
                <>
                  <a href={url} target="_blank" rel="nofollow sponsored noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.image_url} alt={coverAlt} loading="eager" />
                  </a>
                  <figcaption className="ra-gba__cover-link">
                    <a href={url} target="_blank" rel="nofollow sponsored noopener">
                      View on Amazon &rarr;
                    </a>
                  </figcaption>
                </>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={article.image_url} alt={coverAlt} loading="eager" />
              )}
            </figure>
          )}

          <aside className="ra-gba__facts" aria-label="At a glance">
            <p className="ra-gba__facts-title">At a Glance</p>
            <dl className="ra-gba__facts-list">
              {author && (
                <div className="ra-gba__fact">
                  <dt>Author</dt>
                  <dd>{author}</dd>
                </div>
              )}
              {language && (
                <div className="ra-gba__fact">
                  <dt>Original language</dt>
                  <dd>{language}</dd>
                </div>
              )}
              {written && (
                <div className="ra-gba__fact">
                  <dt>Written</dt>
                  <dd>{written}</dd>
                </div>
              )}
              {genre && (
                <div className="ra-gba__fact">
                  <dt>Genre</dt>
                  <dd>{genre}</dd>
                </div>
              )}
              {readingTime && (
                <div className="ra-gba__fact">
                  <dt>Reading time</dt>
                  <dd>{readingTime}</dd>
                </div>
              )}
              {difficulty && (
                <div className="ra-gba__fact">
                  <dt>Reading difficulty</dt>
                  <dd>{difficulty}</dd>
                </div>
              )}
              {period && (
                <div className="ra-gba__fact">
                  <dt>Historical period</dt>
                  <dd>{period}</dd>
                </div>
              )}
              {bestFor && (
                <div className="ra-gba__fact">
                  <dt>Best for</dt>
                  <dd>{bestFor}</dd>
                </div>
              )}
              {translation && (
                <div className="ra-gba__fact">
                  <dt>Recommended {editionWord}</dt>
                  <dd>{translation}</dd>
                </div>
              )}
              {position > 0 && (
                <div className="ra-gba__fact">
                  <dt>Reading order</dt>
                  <dd>
                    No. {position} of {total} in {list}
                    {next && (
                      <>
                        {" "}
                        <span className="ra-gba__fact-next">
                          Next: <a href={articleUrl(next.article)}>{next.article.title}</a>
                        </span>
                      </>
                    )}
                  </dd>
                </div>
              )}
              {influencedBy && (
                <div className="ra-gba__fact">
                  <dt>Influenced by</dt>
                  <dd>{influencedBy}</dd>
                </div>
              )}
              {influenced && (
                <div className="ra-gba__fact">
                  <dt>Influenced</dt>
                  <dd>{influenced}</dd>
                </div>
              )}
            </dl>
          </aside>
        </div>

        {videos.length > 0 && (
          <section id="watch" className={`ra-gba__watch${videos[0].vertical ? " ra-gba__watch--vertical" : ""}`} aria-label="Watch">
            <p className="ra-gba__collector-eyebrow">From the show</p>
            <div className={`ra-gba__watch-frame${videos[0].vertical ? " ra-gba__watch-frame--vertical" : ""}`}>
              <LiteYouTube id={videos[0].id} title={videos[0].title} />
            </div>
            <p className="ra-gba__watch-caption">
              <a href={videos[0].href}>{videos[0].title}</a>
              {videos[0].note && (
                <>
                  {" "}
                  <span aria-hidden="true">·</span> {videos[0].note}
                </>
              )}
            </p>
            {videos.length > 1 && (
              <ul className="ra-gba__watch-more">
                {videos.slice(1).map((v) => (
                  <li key={v.id}>
                    <a href={v.href}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${v.id}/mqdefault.jpg`} alt="" loading="lazy" />
                      <span>
                        {v.title}
                        {v.note && <small> · {v.note}</small>}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <div className="ra-gba__body rte" dangerouslySetInnerHTML={{ __html: body }} />

        {url && (
          <div className="ra-gba__actions">
            <a className="ra-button ra-button--primary" href={url} target="_blank" rel="nofollow sponsored noopener">
              View on Amazon
            </a>
            {translation && (
              <span className="ra-gba__actions-note">
                The {translation} {editionWord} — the edition recommended for this work.
              </span>
            )}
          </div>
        )}

        {colLabel && (
          <section className="ra-gba__collector" aria-label="The edition I own">
            <p className="ra-gba__collector-eyebrow">{s.collector_eyebrow}</p>
            <h2 className="ra-gba__collector-title">{colLabel}</h2>

            {colImages.length > 0 && (
              <div className="ra-gba__collector-images">
                {colImages.map((src, i) => (
                  <figure key={i} className="ra-gba__collector-image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${colLabel} — ${article.title}`} loading="lazy" />
                  </figure>
                ))}
              </div>
            )}

            {colNote && <div className="ra-gba__collector-note" dangerouslySetInnerHTML={{ __html: escapeHtml(colNote).replace(/\r?\n/g, "<br />\n") }} />}

            {colVideoId && (
              <div className="ra-gba__collector-video">
                <iframe
                  src={`https://www.youtube.com/embed/${colVideoId}`}
                  title={`${colLabel} — ${article.title}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            )}
          </section>
        )}

        {s.disclosure && <p className="ra-gba__disclosure">{s.disclosure}</p>}
      </div>

      {related.length > 0 && (
        <div className="ra-container-md ra-gba__related">
          <h2 className="ra-gba__related-heading">Read next in {list}</h2>
          <ol className="ra-gb-index ra-gba__related-list">
            {related.map((r) => (
              <GreatBooksIndexRow key={r.article.handle} article={r.article} num={r.pos} />
            ))}
          </ol>
          <p className="ra-gba__back">
            <a className="ra-text-link" href={s.parent_url}>
              Back to {s.parent_label}
            </a>
          </p>
        </div>
      )}

      {videoJsonLd.map((obj) => (
        <script key={String(obj.embedUrl)} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }} />
      ))}
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
    </article>
  );
}

const STYLE = `
  .ra-gba__eyebrow {
    margin: 0 0 var(--ra-space-sm);
    font-size: var(--ra-text-xs);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ra-color-subtle);
  }

  .ra-gba__eyebrow a {
    color: inherit;
    text-decoration: none;
  }

  .ra-gba__eyebrow a:hover {
    color: var(--ra-color-ink);
  }

  .ra-gba__title {
    margin: 0 0 var(--ra-space-xs);
    font-size: clamp(34px, 5.5vw, 52px);
    line-height: 1.06;
    letter-spacing: -0.02em;
    color: var(--ra-color-ink);
  }

  .ra-gba__meta {
    margin: 0 0 var(--ra-space-xl);
    font-size: var(--ra-text-sm);
    letter-spacing: 0.02em;
    color: var(--ra-color-subtle);
  }

  .ra-gba__lede {
    margin-bottom: var(--ra-space-lg);
    font-size: 21px;
    line-height: 1.5;
    color: var(--ra-color-muted);
  }

  .ra-gba__brief {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: var(--ra-space-xl);
    align-items: start;
    margin: var(--ra-space-xl) 0 var(--ra-space-2xl);
  }

  .ra-gba__brief--nocover {
    grid-template-columns: 1fr;
  }

  .ra-gba__cover {
    margin: 0;
  }

  .ra-gba__cover-link {
    margin-top: var(--ra-space-sm);
    text-align: center;
    font-size: var(--ra-text-sm);
  }

  .ra-gba__cover-link a {
    color: var(--ra-color-subtle);
    text-decoration: none;
    border-bottom: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.18));
    padding-bottom: 1px;
  }

  .ra-gba__cover-link a:hover {
    color: var(--ra-color-ink);
    border-color: var(--ra-color-ink);
  }

  .ra-gba__inline-buy {
    white-space: nowrap;
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
    text-decoration: none;
    border-bottom: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.18));
  }

  .ra-gba__inline-buy:hover {
    color: var(--ra-color-ink);
    border-color: var(--ra-color-ink);
  }

  .ra-gba__cover img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 3px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  }

  .ra-gba__facts {
    margin: 0;
    padding: var(--ra-space-lg) var(--ra-space-xl);
    border: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.14));
    border-radius: 4px;
    background: var(--ra-color-soft, #f7f7f5);
  }

  .ra-gba__facts-title {
    margin: 0 0 var(--ra-space-md);
    font-size: var(--ra-text-xs);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #0f1e3d;
  }

  .ra-gba__facts-list {
    margin: 0;
  }

  .ra-gba__fact {
    display: grid;
    grid-template-columns: 190px 1fr;
    gap: var(--ra-space-md);
    padding: 9px 0;
    border-top: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.1));
  }

  .ra-gba__fact:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .ra-gba__fact dt {
    margin: 0;
    align-self: center;
    font-size: var(--ra-text-xs);
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ra-color-subtle);
  }

  .ra-gba__fact dd {
    margin: 0;
    font-size: 17px;
    line-height: 1.4;
    color: var(--ra-color-ink);
  }

  .ra-gba__fact-next {
    display: block;
    margin-top: 2px;
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
  }

  .ra-gba__fact dd a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--ra-color-border);
  }

  .ra-gba__fact dd a:hover {
    text-decoration-color: var(--ra-color-ink);
  }

  .ra-gba__watch {
    margin: var(--ra-space-xl) 0;
  }

  .ra-gba__watch--vertical .ra-gba__watch-caption {
    text-align: center;
  }

  .ra-gba__watch-frame {
    position: relative;
    height: 0;
    padding-bottom: 56.25%;
    overflow: hidden;
    border-radius: 4px;
    background: #000;
  }

  .ra-gba__watch-frame--vertical {
    height: auto;
    padding-bottom: 0;
    aspect-ratio: 9 / 16;
    max-width: 320px;
    margin: 0 auto;
  }

  .ra-gba__watch-frame iframe,
  .ra-gba__watch-frame .ra-lite-yt {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .ra-lite-yt {
    display: block;
    margin: 0;
    padding: 0;
    border: 0;
    background: #000;
    cursor: pointer;
  }

  .ra-lite-yt img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ra-lite-yt__play {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 68px;
    height: 48px;
    transform: translate(-50%, -50%);
    border-radius: 12px;
    background: rgba(230, 30, 30, 0.95);
    transition: transform 0.15s ease;
  }

  .ra-lite-yt__play::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-40%, -50%);
    border-style: solid;
    border-width: 11px 0 11px 19px;
    border-color: transparent transparent transparent #fff;
  }

  .ra-lite-yt:hover .ra-lite-yt__play {
    transform: translate(-50%, -50%) scale(1.08);
  }

  .ra-gba__watch-caption {
    margin: var(--ra-space-sm) 0 0;
    font-size: 15px;
    line-height: 1.5;
    color: var(--ra-color-muted);
  }

  .ra-gba__watch-caption a {
    color: var(--ra-color-ink);
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: var(--ra-color-border);
  }

  .ra-gba__watch-caption a:hover {
    text-decoration-color: var(--ra-color-ink);
  }

  .ra-gba__watch-more {
    display: grid;
    gap: var(--ra-space-sm);
    margin: var(--ra-space-md) 0 0;
    padding: 0;
    list-style: none;
  }

  .ra-gba__watch-more a {
    display: flex;
    align-items: center;
    gap: var(--ra-space-sm);
    font-size: 15px;
    line-height: 1.4;
    color: var(--ra-color-ink);
    text-decoration: none;
  }

  .ra-gba__watch-more a:hover span {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .ra-gba__watch-more img {
    flex: 0 0 120px;
    width: 120px;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    border-radius: 3px;
    background: var(--ra-color-soft);
  }

  .ra-gba__watch-more small {
    color: var(--ra-color-muted);
  }

  .ra-gba__collector {
    margin-top: var(--ra-space-4xl);
    padding-top: var(--ra-space-xl);
    border-top: 2px solid var(--ra-color-ink);
  }

  .ra-gba__collector-eyebrow {
    margin: 0 0 var(--ra-space-xs);
    font-size: var(--ra-text-xs);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ra-color-subtle);
  }

  .ra-gba__collector-title {
    margin: 0 0 var(--ra-space-lg);
    font-size: 28px;
    line-height: 1.15;
    letter-spacing: -0.02em;
    color: var(--ra-color-ink);
  }

  .ra-gba__collector-images {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: var(--ra-space-md);
    margin-bottom: var(--ra-space-lg);
  }

  .ra-gba__collector-image {
    margin: 0;
    overflow: hidden;
    border-radius: 4px;
    background: var(--ra-color-soft);
  }

  .ra-gba__collector-image img {
    display: block;
    width: 100%;
    height: auto;
  }

  .ra-gba__collector-note {
    font-size: 18px;
    line-height: 1.65;
    color: var(--ra-color-muted);
  }

  .ra-gba__collector-video {
    position: relative;
    margin-top: var(--ra-space-lg);
    padding-bottom: 56.25%;
    height: 0;
    overflow: hidden;
    border-radius: 4px;
  }

  .ra-gba__collector-video iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  @media screen and (max-width: 749px) {
    .ra-gba__brief {
      grid-template-columns: 1fr;
      justify-items: center;
    }

    .ra-gba__cover {
      max-width: 150px;
    }

    .ra-gba__facts {
      width: 100%;
      padding: var(--ra-space-md) var(--ra-space-lg);
    }

    .ra-gba__fact {
      grid-template-columns: 1fr;
      gap: 2px;
    }
  }

  .ra-gba__body h2 {
    margin: var(--ra-space-xl) 0 var(--ra-space-sm);
    font-size: 26px;
    line-height: 1.2;
    letter-spacing: -0.02em;
    color: var(--ra-color-ink);
  }

  .ra-gba__body p,
  .ra-gba__body li {
    font-size: 18px;
    line-height: 1.65;
    color: var(--ra-color-muted);
  }

  .ra-gba__body blockquote {
    margin: var(--ra-space-lg) 0;
    padding-left: var(--ra-space-lg);
    border-left: 2px solid var(--ra-color-border, rgba(0, 0, 0, 0.15));
    font-style: italic;
  }

  .ra-gba__actions {
    margin-top: var(--ra-space-2xl);
  }

  .ra-gba__actions-note {
    display: block;
    margin-top: var(--ra-space-sm);
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
  }

  .ra-gba__disclosure {
    margin-top: var(--ra-space-xl);
    padding-top: var(--ra-space-md);
    border-top: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.1));
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
  }

  .ra-gba__related {
    margin-top: var(--ra-space-4xl);
  }

  .ra-gba__related-heading {
    margin: 0 0 var(--ra-space-lg);
    font-size: 26px;
    letter-spacing: -0.02em;
    color: var(--ra-color-ink);
  }

  .ra-gba__related-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .ra-gba__related-item {
    padding: var(--ra-space-md) 0;
    border-top: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.1));
  }

  .ra-gba__related-title {
    margin: 0 0 4px;
    font-size: 21px;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .ra-gba__related-title a {
    color: var(--ra-color-ink);
    text-decoration: none;
  }

  .ra-gba__related-title a:hover {
    text-decoration: underline;
  }

  .ra-gba__related-meta {
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
  }

  .ra-gba__back {
    margin-top: var(--ra-space-xl);
  }
`;
