import type { Collection, Product } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export interface FeaturedCollectionSettings {
  collection?: string; products_to_show?: number; title?: string; heading_size?: string;
  description?: string; show_description?: boolean; description_style?: string;
  columns_desktop?: number; columns_mobile?: string; full_width?: boolean;
  show_view_all?: boolean; view_all_style?: string; color_scheme?: string;
  padding_top?: number; padding_bottom?: number;
}

/**
 * Port of Dawn's sections/featured-collection.liquid as configured on page.shop
 * (no slider, no quick-add, no title/description) with the section's own centring {% style %}.
 */
export default function FeaturedCollection({ id, settings: s, collection }: {
  id: string; settings: FeaturedCollectionSettings; collection: (Collection & { products: Product[] }) | null;
}) {
  const sectionDom = `shopify-section-${id}`;
  const padTop = s.padding_top ?? 36;
  const padBottom = s.padding_bottom ?? 36;
  const toShow = s.products_to_show ?? 4;
  const products = (collection?.products ?? []).slice(0, toShow);
  const moreInCollection = (collection?.products.length ?? 0) > toShow;
  const scheme = s.color_scheme ? `color-${s.color_scheme}` : "color-scheme-1";
  const headingSize = s.heading_size ?? "h1";

  const css = `#${sectionDom} .product-grid {
    justify-content: center;
  }

  #${sectionDom} .card__content,
  #${sectionDom} .card-information,
  #${sectionDom} .card__heading,
  #${sectionDom} .price {
    text-align: center;
  }

  #${sectionDom} .card-information > * {
    justify-content: center;
  }

  .section-${id}-padding {
    padding-top: ${Math.round(padTop * 0.75)}px;
    padding-bottom: ${Math.round(padBottom * 0.75)}px;
  }

  @media screen and (min-width: 750px) {
    .section-${id}-padding {
      padding-top: ${padTop}px;
      padding-bottom: ${padBottom}px;
    }
  }`;

  const viewAllClass = s.view_all_style === "link" ? "link underlined-link" : s.view_all_style === "solid" ? "button" : "button button--secondary";

  return (
    <section id={sectionDom} className="shopify-section section">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`${scheme} isolate gradient`}>
        <div className={`collection section-${id}-padding${s.full_width ? " collection--full-width" : ""}`} id={`collection-${id}`} data-id={id}>
          <div className={`collection__title title-wrapper title-wrapper--no-top-margin page-width${s.show_description && s.description ? " title-wrapper--self-padded-tablet-down" : ""}`}>
            {s.title ? <h2 className={`title inline-richtext ${headingSize}`} dangerouslySetInnerHTML={{ __html: s.title }} /> : null}
            {s.show_description && s.description ? (
              <div className={`collection__description ${s.description_style === "body" ? "rte" : s.description_style === "subtitle" ? "subtitle" : "uppercase"}`} dangerouslySetInnerHTML={{ __html: s.description }} />
            ) : null}
          </div>

          <slider-component className={`slider-mobile-gutter${s.full_width ? " slider-component-full-width" : ""} page-width${s.full_width ? "" : " page-width-desktop"}`}>
            <ul
              id={`Slider-${id}`}
              data-id={id}
              className={`grid product-grid contains-card contains-card--product contains-card--standard grid--${s.columns_desktop ?? 4}-col-desktop grid--${collection ? (s.columns_mobile ?? "2") : "2"}-col-tablet-down`}
              role="list"
              aria-label="Slider"
            >
              {products.map((p, i) => (
                <li key={p.handle} id={`Slide-${id}-${i + 1}`} className="grid__item">
                  <ProductCard product={p} sectionId={id} />
                </li>
              ))}
            </ul>
          </slider-component>

          {s.show_view_all && moreInCollection && collection ? (
            <div className="center collection__view-all">
              <a href={`/collections/${collection.handle}`} className={viewAllClass} aria-label={`View all products in the ${collection.title} collection`}>
                View all
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
