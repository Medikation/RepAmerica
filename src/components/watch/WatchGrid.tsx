"use client";

import { useState, type ReactNode } from "react";

export interface WatchFilter { label: string; value: string }
export interface WatchCard {
  handle: string;
  title: string;
  category: string;
  categoryHandle: string;
  videoId: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  duration: string;
  date: string;
}

/**
 * Port of sections/watch-video-grid.liquid — the markup plus its inline filter script.
 * The Liquid rendered one page of 250 cards and filtered them client-side by `data-category`;
 * the filter buttons only ever affected the cards already on the page. Same here: `cards` is
 * the current page, `children` is the server-rendered pagination.
 */
export default function WatchGrid({ id, heading, filters, cards, children }: {
  id: string; heading?: string; filters: WatchFilter[]; cards: WatchCard[]; children?: ReactNode;
}) {
  const domId = `WatchGrid-${id}`;
  const [active, setActive] = useState<string>(filters[0]?.value ?? "all");
  const visibleCount = cards.filter((c) => active === "all" || c.categoryHandle === active).length;

  const css = `
  #${domId} .ra-watch-grid__header {
    margin-left: 0;
    margin-right: auto;
    margin-bottom: var(--ra-space-lg);
    text-align: left;
  }

  #${domId} .ra-filters {
    gap: 14px;
    margin-bottom: var(--ra-space-2xl);
  }

  #${domId} .ra-filter {
    padding: 11px 20px;
    border-color: rgba(17, 17, 17, 0.22);
    color: rgba(17, 17, 17, 0.78);
  }

  #${domId} .ra-filter.is-active {
    color: #fff;
  }

  @media screen and (max-width: 749px) {
    #${domId}.ra-section {
      padding-top: var(--ra-space-xl);
    }

    #${domId} .ra-filters {
      flex-wrap: wrap;
      overflow-x: visible;
      gap: 10px;
      margin-bottom: var(--ra-space-xl);
    }

    #${domId} .ra-filter {
      padding: 9px 15px;
      font-size: 12px;
    }

    #${domId} .ra-grid-3 {
      gap: 26px;
    }
  }

  .ra-watch-grid__header {
    margin-left: auto;
    margin-right: auto;
    margin-bottom: var(--ra-space-xl);
  }`;

  return (
    <div id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <section className="ra-section ra-watch-grid" id={domId}>
        <div className="ra-container">
          {heading ? (
            <div className="ra-section-header ra-watch-grid__header">
              <h2 className="ra-section-header__title">{heading}</h2>
            </div>
          ) : null}

          {filters.length > 0 ? (
            <div className="ra-filters" aria-label="Video categories">
              {filters.map((f) => (
                <button
                  key={f.value}
                  className={`ra-filter${active === f.value ? " is-active" : ""}`}
                  data-filter={f.value}
                  type="button"
                  onClick={() => setActive(f.value)}
                >{f.label}</button>
              ))}
            </div>
          ) : null}

          <div className="ra-grid-3">
            {cards.length === 0 ? (
              <p className="ra-empty">No videos published yet — check back soon.</p>
            ) : cards.map((c) => {
              const match = active === "all" || c.categoryHandle === active;
              const url = `/blogs/watch/${c.handle}`;
              return (
                <article key={c.handle} className="ra-video-card" data-category={c.categoryHandle} style={match ? undefined : { display: "none" }}>
                  <a href={url} className="ra-video-card__link" aria-label={`Watch ${c.title}`}>
                    <div className="ra-video-card__thumb">
                      {c.videoId ? (
                        <img
                          src={`https://img.youtube.com/vi/${c.videoId}/maxresdefault.jpg`}
                          alt={c.title}
                          width={1280}
                          height={720}
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.onerror = null;
                            img.src = `https://img.youtube.com/vi/${c.videoId}/hqdefault.jpg`;
                          }}
                        />
                      ) : c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.title} width={c.imageWidth ?? undefined} height={c.imageHeight ?? undefined} loading="lazy" />
                      ) : null}
                      {c.duration ? <span className="ra-video-card__duration">{c.duration}</span> : null}
                    </div>

                    <div className="ra-video-card__body">
                      <div className="ra-video-card__category">{c.category}</div>
                      <h3 className="ra-video-card__title">{c.title}</h3>
                      <div className="ra-video-card__meta">{c.date}</div>
                    </div>
                  </a>
                </article>
              );
            })}
          </div>

          <p className="ra-empty" id={`WatchEmpty-${id}`} hidden={visibleCount !== 0}>No videos found in this category.</p>

          {children}
        </div>
      </section>
    </div>
  );
}
