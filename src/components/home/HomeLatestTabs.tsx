"use client";

import { useState } from "react";
import type { Article } from "@/lib/data";
import YoutubeThumb from "./YoutubeThumb";
import { articleUrl, articleVideoId, shortDate, str } from "./util";

export interface LatestTab { label: string; category: string | null }

/** Recent Content grid with category tabs (All / Commentary / Books / Livestreams). Filtering is client-side over the
 *  pool the server hands down; `limit` cards show per tab. */
export default function HomeLatestTabs({ articles, tabs, limit }: { articles: Article[]; tabs: LatestTab[]; limit: number }) {
  const [active, setActive] = useState<string | null>(tabs[0]?.category ?? null);
  const list = articles.filter((a) => !active || str(a.meta?.category).toLowerCase() === active.toLowerCase()).slice(0, limit);
  return (
    <>
      {tabs.length > 1 && (
        <div className="ra-latest-tabs" role="tablist" aria-label="Filter videos">
          {tabs.map((t) => {
            const on = (t.category ?? null) === active;
            return (
              <button key={t.label} type="button" role="tab" aria-selected={on} className={`ra-latest-tabs__tab${on ? " is-active" : ""}`} onClick={() => setActive(t.category ?? null)}>
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="ra-grid-3">
        {list.length === 0 ? (
          <p className="ra-empty">Nothing here yet — check back soon.</p>
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
                      <img src={article.image_url} alt={article.title} width={article.image_width ?? undefined} height={article.image_height ?? undefined} loading="lazy" />
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
    </>
  );
}
