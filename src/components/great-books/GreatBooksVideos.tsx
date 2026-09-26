import type { Article } from "@/lib/data";
import { handleize, metaString, shortDate, videoId } from "@/components/watch/utils";

/**
 * "From the channel" — the newest Watch videos in a given category (default "Books"),
 * rendered with the site's standard video cards. Driven by the `great-books-videos`
 * section in `template:page.great-books`; nothing to edit in code when new book videos
 * are published — tag them `category: Books` in the Watch blog and they appear here.
 */
export interface GreatBooksVideosSettings {
  eyebrow?: string;
  heading?: string;
  text?: string;
  category?: string;
  limit?: number;
  cta_label?: string;
  cta_url?: string;
}

const DEFAULTS: Required<GreatBooksVideosSettings> = {
  eyebrow: "From the channel",
  heading: "Rep America on the Books",
  text: "",
  category: "Books",
  limit: 3,
  cta_label: "More on Watch",
  cta_url: "/pages/watch",
};

export default function GreatBooksVideos({ id, settings, watch }: { id: string; settings: GreatBooksVideosSettings; watch: Article[] }) {
  const s = { ...DEFAULTS, ...settings };
  const wanted = handleize(s.category || "Books");
  const limit = Math.max(1, Number(s.limit) || 3);
  const items = watch.filter((a) => handleize(metaString(a, "category") || "") === wanted).slice(0, limit);
  if (items.length === 0) return null;

  const domId = `GreatBooksVideos-${id}`;
  const css = `
  #${domId} .ra-section-header--row { margin-bottom: var(--ra-space-2xl); }
  #${domId} .ra-gbv__grid--1 { grid-template-columns: minmax(0, 720px); }
  #${domId} .ra-gbv__grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media screen and (max-width: 749px) {
    #${domId} .ra-gbv__grid--1,
    #${domId} .ra-gbv__grid--2 { grid-template-columns: minmax(0, 1fr); }
  }`;

  return (
    <section className="ra-section ra-gbv" id={domId} aria-label={s.heading}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ra-container">
        <div className="ra-section-header ra-section-header--row">
          <div className="ra-section-header__text">
            {s.eyebrow ? <p className="ra-section-header__eyebrow">{s.eyebrow}</p> : null}
            <h2 className="ra-section-header__title">{s.heading}</h2>
            {s.text ? <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: s.text }} /> : null}
          </div>
          {s.cta_label && s.cta_url ? (
            <div className="ra-section-header__actions">
              <a className="ra-button ra-button--secondary" href={s.cta_url}>{s.cta_label}</a>
            </div>
          ) : null}
        </div>

        <div className={`ra-grid-3 ra-gbv__grid--${Math.min(items.length, 3)}`}>
          {items.map((a) => {
            const vid = videoId(a);
            const category = metaString(a, "category") || "Commentary";
            const duration = metaString(a, "duration");
            return (
              <article key={a.handle} className="ra-video-card" data-category={handleize(category)}>
                <a href={`/blogs/watch/${a.handle}`} className="ra-video-card__link" aria-label={`Watch ${a.title}`}>
                  <div className="ra-video-card__thumb">
                    {vid ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`https://img.youtube.com/vi/${vid}/hqdefault.jpg`} alt={a.title} width={480} height={360} loading="lazy" />
                    ) : a.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.image_url} alt={a.image_alt || a.title} width={a.image_width ?? undefined} height={a.image_height ?? undefined} loading="lazy" />
                    ) : null}
                    {duration ? <span className="ra-video-card__duration">{duration}</span> : null}
                  </div>
                  <div className="ra-video-card__body">
                    <div className="ra-video-card__category">{category}</div>
                    <h3 className="ra-video-card__title">{a.title}</h3>
                    <div className="ra-video-card__meta">{shortDate(a.published_at)}</div>
                  </div>
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
