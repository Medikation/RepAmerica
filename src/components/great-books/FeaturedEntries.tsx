import type { Article } from "@/lib/data";
import { articleUrl, metaStr } from "./meta";

/** Port of sections/featured-entries.liquid ("Start here" three-up). */
export interface FeaturedEntriesSection {
  settings: {
    blog?: string;
    eyebrow?: string;
    heading?: string;
    text?: string;
    media_style?: "book" | "square";
    card_align?: "left" | "center";
    meta_above?: boolean;
    card_border?: boolean;
    cue_label?: string;
    cta_label?: string;
    cta_url?: string;
  };
  blocks?: Record<string, { type: string; settings: { handle?: string; eyebrow?: string; blurb?: string } }>;
  block_order?: string[];
}

export default function FeaturedEntries({ id, section, articles }: { id: string; section: FeaturedEntriesSection; articles: Article[] }) {
  const s = section.settings;
  const sid = `FeaturedEntries-${id}`;
  const mediaStyle = s.media_style || "book";
  const blocks = (section.block_order ?? []).map((k) => section.blocks?.[k]).filter(Boolean) as NonNullable<FeaturedEntriesSection["blocks"]>[string][];

  const style = `
  .ra-fe__header {
    margin-left: auto;
    margin-right: auto;
    margin-bottom: var(--ra-space-2xl);
    max-width: 640px;
  }

  .ra-fe__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--ra-space-2xl);
  }

  .ra-fe__card {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ra-fe__image {
    display: block;
    margin-bottom: var(--ra-space-md);
  }

  .ra-fe__image--book img {
    display: block;
    height: 84px;
    width: auto;
    border-radius: 2px;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.22);
  }

  .ra-fe__image--square {
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 4px;
    background: var(--ra-color-soft);
  }

  .ra-fe__image--square img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ra-fe__eyebrow {
    margin: 0;
    font-size: var(--ra-text-xs);
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ra-color-subtle);
  }

  .ra-fe__title {
    margin: 0;
    font-size: 26px;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }

  .ra-fe__title a {
    color: var(--ra-color-ink);
    text-decoration: none;
  }

  .ra-fe__title a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .ra-fe__blurb {
    margin: 4px 0 10px;
    font-size: var(--ra-text-md, 17px);
    line-height: 1.5;
    color: var(--ra-color-muted);
  }

  .ra-fe__cue {
    align-self: flex-start;
    margin-top: auto;
  }

  .ra-fe__actions {
    margin-top: var(--ra-space-2xl);
    text-align: center;
  }
${
  s.card_align === "center"
    ? `
  #${sid} .ra-fe__card {
    align-items: center;
    text-align: center;
  }

  #${sid} .ra-fe__cue {
    align-self: center;
  }
`
    : ""
}${
  s.meta_above
    ? `
  #${sid} .ra-fe__eyebrow {
    order: -1;
    margin-bottom: var(--ra-space-sm, 10px);
  }
`
    : ""
}${
  s.card_border
    ? `
  #${sid} .ra-fe__card {
    padding: var(--ra-space-xl);
    border: 1px solid var(--ra-color-border);
    border-radius: var(--ra-radius-lg);
    background: var(--ra-color-surface);
  }

  #${sid} .ra-fe__grid {
    gap: var(--ra-space-lg);
  }
`
    : ""
}
  @media screen and (max-width: 989px) {
    .ra-fe__grid {
      grid-template-columns: 1fr;
      gap: var(--ra-space-xl);
    }

    .ra-fe__image--square {
      aspect-ratio: 16 / 9;
    }
  }

  @media screen and (max-width: 749px) {
    #${sid}.ra-section {
      padding-top: 40px;
      padding-bottom: 56px;
    }

    #${sid} .ra-fe__header {
      margin-bottom: var(--ra-space-xl);
    }
  }
`;

  return (
    <section className="ra-section ra-fe" id={sid}>
      <div className="ra-container">
        <div className="ra-section-header ra-text-center ra-fe__header">
          {s.eyebrow && <p className="ra-section-header__eyebrow">{s.eyebrow}</p>}
          {s.heading && <h2 className="ra-section-header__title">{s.heading}</h2>}
          {s.text && <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: s.text }} />}
        </div>

        <div className="ra-fe__grid">
          {blocks.map((block, i) => {
            const entry = articles.find((a) => a.handle === block.settings.handle);
            if (!entry || !entry.title) return null;
            const author = metaStr(entry, "author");
            const written = metaStr(entry, "written_display");
            const category = metaStr(entry, "essentials_category");
            const url = articleUrl(entry);
            return (
              <article key={i} className="ra-fe__card">
                {entry.image_url && (
                  <a className={`ra-fe__image ra-fe__image--${mediaStyle}`} href={url} tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={entry.image_url} alt="" loading="lazy" />
                  </a>
                )}

                <p className="ra-fe__eyebrow">
                  {block.settings.eyebrow ? (
                    block.settings.eyebrow
                  ) : author ? (
                    <>
                      {author}
                      {written && (
                        <>
                          {" "}
                          <span aria-hidden="true">·</span> {written}
                        </>
                      )}
                    </>
                  ) : category ? (
                    category
                  ) : null}
                </p>

                <h3 className="ra-fe__title">
                  <a href={url}>{entry.title}</a>
                </h3>

                {block.settings.blurb && <p className="ra-fe__blurb">{block.settings.blurb}</p>}

                <a className="ra-text-link ra-fe__cue" href={url}>
                  {s.cue_label ?? ""}
                </a>
              </article>
            );
          })}
        </div>

        {s.cta_label && s.cta_url && (
          <div className="ra-fe__actions">
            <a className="ra-button ra-button--secondary" href={s.cta_url}>
              {s.cta_label}
            </a>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: style }} />
    </section>
  );
}
