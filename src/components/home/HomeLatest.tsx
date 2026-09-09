import type { Article } from "@/lib/data";
import YoutubeThumb from "./YoutubeThumb";
import { articleUrl, articleVideoId, isBlank, shortDate, str } from "./util";

export interface HomeLatestSettings {
  eyebrow?: string; heading?: string; text?: string; blog?: string; limit?: number; offset?: number;
  button_label?: string; button_link?: string;
}

/** Port of sections/home-latest.liquid. `articles` = the blog's articles newest-first; offset/limit applied here. */
export default function HomeLatest({ id, settings, articles }: { id: string; settings: HomeLatestSettings; articles: Article[] }) {
  const offset = Number(settings.offset ?? 0);
  const limit = Number(settings.limit ?? 3);
  const list = articles.slice(offset, offset + limit);
  const hasButton = !isBlank(settings.button_label) && !isBlank(settings.button_link);

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: latestStyle(id) }} />
      <section className="ra-section ra-home-latest" id={`HomeLatest-${id}`}>
        <div className="ra-container">
          <div className="ra-section-header ra-section-header--row">
            <div>
              {!isBlank(settings.eyebrow) && <p className="ra-section-header__eyebrow">{settings.eyebrow}</p>}
              <h2 className="ra-section-header__title">{settings.heading}</h2>
              {!isBlank(settings.text) && <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: str(settings.text) }} />}
            </div>
            {hasButton && (
              <div className="ra-section-header__actions">
                <a href={settings.button_link} className="ra-text-link">{settings.button_label}</a>
              </div>
            )}
          </div>

          <div className="ra-grid-3">
            {list.length === 0 ? (
              <p className="ra-empty">No videos published yet — check back soon.</p>
            ) : (
              list.map((article) => {
                const category = str(article.meta?.category) || "Commentary";
                const videoId = articleVideoId(article);
                const duration = str(article.meta?.duration);
                return (
                  <article className="ra-video-card" key={article.id}>
                    <a href={articleUrl(article)} className="ra-video-card__link" aria-label={`Watch ${article.title}`}>
                      <div className="ra-video-card__thumb">
                        {videoId ? (
                          <YoutubeThumb videoId={videoId} alt={article.title} loading="lazy" />
                        ) : article.image_url ? (
                          <img
                            src={article.image_url}
                            alt={article.title}
                            width={article.image_width ?? undefined}
                            height={article.image_height ?? undefined}
                            loading="lazy"
                          />
                        ) : null}
                        {duration && <span className="ra-video-card__duration">{duration}</span>}
                      </div>
                      <div className="ra-video-card__body">
                        <div className="ra-video-card__category">{category}</div>
                        <h3 className="ra-video-card__title">{article.title}</h3>
                        <div className="ra-video-card__meta">{shortDate(article.published_at)}</div>
                      </div>
                    </a>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>
    </section>
  );
}

function latestStyle(id: string): string {
  const S = `#HomeLatest-${id}`;
  return `
  ${S}.ra-section {
    padding-top: 56px;
    padding-bottom: 84px;
    background: #b01f2e;
  }
  ${S} .ra-section-header__eyebrow,
  ${S} .ra-video-card__category {
    color: #111;
  }
  ${S} .ra-section-header__title,
  ${S} .ra-video-card__title {
    color: #fff;
  }
  ${S} .ra-section-header__text,
  ${S} .ra-video-card__meta,
  ${S} .ra-empty {
    color: rgba(255, 255, 255, 0.78);
  }
  ${S} .ra-text-link {
    color: #fff;
  }
  ${S} .ra-video-card__body {
    padding-top: 8px;
  }
  ${S} .ra-video-card__category {
    margin-bottom: 3px;
  }
  ${S} .ra-video-card__title {
    margin-bottom: 3px;
  }
  ${S} .ra-section-header {
    margin-bottom: 52px;
  }
  ${S} .ra-section-header__title {
    font-size: clamp(44px, 5.9vw, 84px);
  }
  ${S} .ra-grid-3 {
    column-gap: 30px;
  }
  @media screen and (max-width: 749px) {
    ${S}.ra-section {
      padding-top: 40px;
      padding-bottom: 56px;
    }
    ${S} .ra-section-header {
      margin-bottom: 32px;
    }
    ${S} .ra-section-header__title {
      font-size: clamp(38px, 10vw, 48px);
    }
  }
`;
}
