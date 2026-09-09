import type { Article } from "@/lib/data";
import { metaString } from "@/components/watch/utils";

export interface WorkshopEssentialsListSettings {
  anchor?: string; blog?: string; category?: string; heading?: string; eyebrow?: string;
  background?: "white" | "red" | "navy" | string;
}

/** Port of sections/workshop-essentials-list.liquid. `articles` = all essentials articles in reading order (ascending). */
export default function WorkshopEssentialsList({ id, settings: s, articles }: { id: string; settings: WorkshopEssentialsListSettings; articles: Article[] }) {
  const listId = s.anchor || `WorkshopList-${id}`;
  const bandBg = s.background === "red" ? "#b01f2e" : s.background === "navy" ? "#0f1e3d" : "";
  const items = articles.filter((a) => metaString(a, "essentials_category") === (s.category ?? ""));

  const css = `${bandBg ? `
    #${listId}.ra-section {
      background: ${bandBg};
    }

    #${listId} .ra-section-header__title {
      color: #fff;
    }

    #${listId} .ra-section-header__eyebrow {
      color: rgba(255, 255, 255, 0.72);
    }` : ""}

  #${listId} .ra-workshop-list__grid {
    column-gap: 32px;
    row-gap: 44px;
  }

  @media screen and (max-width: 749px) {
    #${listId} .ra-container {
      padding-left: 22px;
      padding-right: 22px;
    }

    #${listId} .ra-workshop-list__grid {
      row-gap: 26px;
    }
  }

  #${listId} .ra-product-card {
    display: flex;
    flex-direction: column;
    padding: 16px;
    border: 1px solid var(--ra-color-border);
    border-radius: var(--ra-radius-lg);
    background: var(--ra-color-surface);
    text-align: center;
  }

  #${listId} .ra-product-card__body {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
  }

  #${listId} .ra-product-card__actions {
    justify-content: center;
    margin-top: auto;
    padding-top: var(--ra-space-sm);
    gap: 14px;
  }

  #${listId} .ra-product-card__why {
    color: var(--ra-color-ink);
    font-size: var(--ra-text-sm);
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    text-decoration: none;
  }

  #${listId} .ra-product-card__why:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  #${listId} .ra-product-card__buy {
    padding: 5px 12px;
    border: 1px solid var(--ra-color-border);
    border-radius: 999px;
    font-size: 10px;
    white-space: nowrap;
    transition: color 0.15s ease, border-color 0.15s ease, background-color 0.15s ease;
  }

  #${listId} .ra-product-card__buy:hover {
    background: var(--ra-color-ink);
    border-color: var(--ra-color-ink);
    color: #fff;
  }

  .ra-workshop-list__header {
    margin-left: auto;
    margin-right: auto;
    margin-bottom: var(--ra-space-xl);
  }`;

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <section className="ra-section ra-workshop-list" id={listId}>
        <div className="ra-container">
          {s.heading ? (
            <div className="ra-section-header ra-text-center ra-workshop-list__header">
              {s.eyebrow ? <p className="ra-section-header__eyebrow">{s.eyebrow}</p> : null}
              <h3 className="ra-section-header__title">{s.heading}</h3>
            </div>
          ) : null}

          {s.blog ? (
            <div className="ra-grid-3 ra-workshop-list__grid">
              {items.map((a) => {
                const url = `/blogs/essentials/${a.handle}`;
                const label = metaString(a, "link_label");
                const linkUrl = metaString(a, "link_url");
                return (
                  <article key={a.handle} className="ra-product-card">
                    <a href={url} className="ra-product-card__link" aria-label={`Read about ${a.title}`}>
                      <div className="ra-product-card__image">
                        {a.image_url ? <img src={a.image_url} alt={a.title} loading="lazy" /> : null}
                      </div>
                    </a>
                    <div className="ra-product-card__body">
                      <h4 className="ra-product-card__title">
                        <a className="ra-product-card__title-link" href={url}>{a.title}</a>
                      </h4>
                      <div className="ra-product-card__actions">
                        {linkUrl ? (
                          <a
                            className="ra-product-card__buy"
                            href={linkUrl}
                            target="_blank"
                            rel="nofollow sponsored noopener"
                            aria-label={`Buy ${a.title}${label ? ` on ${label}` : ""}`}
                          >Buy{label ? ` on ${label}` : ""}</a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
