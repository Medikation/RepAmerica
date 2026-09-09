import type { Article } from "@/lib/data";
import Image from "next/image";
import { youtubeBlurDataUrl } from "@/lib/thumb";
import { excerptOf, metaString, shortDate, videoId } from "./utils";

export interface WatchHeroSettings {
  eyebrow?: string;
  heading?: string;
  text?: string;
  featured_label?: string;
}

/** Port of sections/watch-hero.liquid. `featured` = newest watch article (the Liquid's `watch_blog.articles.first`). */
export default async function WatchHero({ id, settings, featured }: { id: string; settings: WatchHeroSettings; featured: Article | null }) {
  const domId = `WatchHero-${id}`;
  const css = `
  #${domId} .ra-section-header__eyebrow {
    color: #c62436;
  }

  #${domId} .ra-featured-video__eyebrow {
    margin-bottom: 18px;
    color: #c62436;
    font-weight: 700;
    letter-spacing: 0.16em;
  }

  /* Bigger than a card title (which tops out around 24px), and never underlined. */
  #${domId} .ra-featured-video__body a {
    text-decoration: none;
  }

  #${domId} .ra-featured-video__title {
    margin: 0 0 18px;
    font-size: clamp(30px, 2.6vw, 40px);
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  #${domId} .ra-featured-video__body a:hover .ra-featured-video__title {
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  #${domId} .ra-featured-video__excerpt {
    margin: 0 0 20px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  #${domId} .ra-featured-video__meta {
    margin-bottom: 28px;
  }

  @media screen and (max-width: 749px) {
    #${domId}.ra-section {
      padding-top: var(--ra-space-xl);
      padding-bottom: var(--ra-space-md);
    }

    #${domId} .ra-featured-video {
      gap: var(--ra-space-lg);
      margin-bottom: var(--ra-space-lg);
    }

    #${domId} .ra-featured-video__eyebrow {
      margin-bottom: 12px;
    }

    #${domId} .ra-featured-video__title {
      margin-bottom: 12px;
      font-size: clamp(24px, 6.6vw, 30px);
    }

    #${domId} .ra-featured-video__meta {
      margin-bottom: 20px;
    }
  }`;

  const article = featured;
  const vid = article ? videoId(article) : "";
  const blur = vid ? await youtubeBlurDataUrl(vid) : undefined;
  const category = article ? metaString(article, "category") || "Commentary" : "";
  const duration = article ? metaString(article, "duration") : "";
  const excerpt = article ? excerptOf(article, 22) : "";
  const url = article ? `/blogs/watch/${article.handle}` : "";

  return (
    <div id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <section className="ra-section ra-watch-hero" id={domId}>
        <div className="ra-container">
          <div className="ra-section-header">
            {settings.eyebrow ? <p className="ra-section-header__eyebrow">{settings.eyebrow}</p> : null}
            <h1 className="ra-section-header__title">{settings.heading}</h1>
            {settings.text ? <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: settings.text }} /> : null}
          </div>

          {article ? (
            <div className="ra-featured-video">
              <a href={url} className="ra-featured-video__link" aria-label={`Watch ${article.title}`}>
                <div className="ra-featured-video__thumb">
                  {vid ? (
                    <Image src={`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`} alt={article.title} width={1280} height={720} priority sizes="(max-width: 749px) 100vw, 60vw" placeholder={blur ? "blur" : "empty"} blurDataURL={blur} />
                  ) : article.image_url ? (
                    <img src={article.image_url} alt={article.title} loading="eager" />
                  ) : null}
                  <span className="ra-featured-video__play" aria-hidden="true">▶</span>
                  {duration ? <span className="ra-featured-video__duration">{duration}</span> : null}
                </div>
              </a>

              <div className="ra-featured-video__body">
                {settings.featured_label ? <p className="ra-featured-video__eyebrow">{settings.featured_label}</p> : null}
                <a href={url}>
                  <h2 className="ra-featured-video__title">{article.title}</h2>
                </a>
                {excerpt ? <p className="ra-featured-video__excerpt">{excerpt}</p> : null}
                <p className="ra-featured-video__meta">{category} · {shortDate(article.published_at)}</p>
                <a href={url} className="ra-button ra-button--primary">Watch Now</a>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
