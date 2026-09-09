import type { Product } from "@/lib/data";

/** Port of sections/home-collection.liquid — image + title cards, no prices, one link under the row. */
export interface HomeCollectionSettings {
  tuck_under_heading?: boolean;
  collection?: string;
  products_to_show?: number;
  item_label?: string;
  cta_label?: string;
  cta_url?: string;
}

export default function HomeCollection({ id, settings, products }: { id: string; settings: HomeCollectionSettings; products: Product[] }) {
  const sid = `HomeCollection-${id}`;
  const showCount = settings.products_to_show || 3;
  // Schema default is true; the template JSON leaves it unset.
  const tuck = settings.tuck_under_heading ?? true;
  const ctaUrl = settings.cta_url || `/collections/${settings.collection ?? ""}`;

  const style = `${
    tuck
      ? `
  #${sid}.ra-home-collection {
    padding-top: 0;
    margin-top: calc(-1 * var(--ra-space-3xl));
  }
`
      : ""
  }
  .ra-home-collection__grid {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: var(--ra-space-2xl);
    margin: 0 auto;
    max-width: 980px;
  }

  .ra-home-collection__card {
    flex: 0 1 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .ra-home-collection__media {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    border-radius: 4px;
    background: var(--ra-color-soft);
  }

  .ra-home-collection__media img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ra-home-collection__title {
    margin: var(--ra-space-sm) 0 0;
    font-size: 17px;
    font-weight: 400;
    line-height: 1.25;
    letter-spacing: -0.01em;
    color: var(--ra-color-muted);
  }

  .ra-home-collection__title a {
    color: inherit;
    text-decoration: none;
  }

  .ra-home-collection__title a:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .ra-home-collection__actions {
    margin-top: var(--ra-space-lg);
    text-align: center;
  }

  @media screen and (max-width: 749px) {
    .ra-home-collection__grid {
      gap: var(--ra-space-xl);
    }

    .ra-home-collection__card {
      flex: 0 0 auto;
      width: min(68%, 280px);
    }
  }
`;

  return (
    <section className="ra-section ra-home-collection" id={sid}>
      <div className="ra-container">
        <div className="ra-home-collection__grid">
          {products.slice(0, showCount).map((product) => {
            const url = `/products/${product.handle}`;
            const media = [...(product.images ?? [])].sort((a, b) => a.position - b.position)[0];
            return (
              <article key={product.handle} className="ra-home-collection__card">
                <a className="ra-home-collection__media" href={url} tabIndex={-1} aria-hidden="true">
                  {media && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={media.src} alt={media.alt || product.title} loading="lazy" width={media.width} height={media.height} sizes="(max-width: 749px) 42vw, 280px" />
                  )}
                </a>

                <h3 className="ra-home-collection__title">
                  <a href={url}>{product.title}</a>
                </h3>

                {settings.item_label && (
                  <a className="ra-text-link ra-home-collection__cue" href={url}>
                    {settings.item_label}
                  </a>
                )}
              </article>
            );
          })}
        </div>

        {settings.cta_label && (
          <div className="ra-home-collection__actions">
            <a className="ra-text-link" href={ctaUrl}>
              {settings.cta_label}
            </a>
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html: style }} />
    </section>
  );
}
