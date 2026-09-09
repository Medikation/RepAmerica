import type { Product } from "@/lib/data";
import { money } from "@/lib/data";

/**
 * Port of snippets/card-product.liquid with the theme's settings baked in
 * (card_style "standard", card_color_scheme "scheme-2", badge_position "bottom left",
 * currency_code_enabled → "$49.99 USD", image_ratio "adapt", no vendor/rating/quick-add).
 * `sectionId` only feeds the element ids the Liquid generated.
 */
export default function ProductCard({ product, sectionId = "card", lazy = true }: { product: Product; sectionId?: string; lazy?: boolean }) {
  const media = [...(product.images ?? [])].sort((a, b) => a.position - b.position)[0];
  const ratio = media && media.width && media.height ? media.width / media.height : 1;
  const ratioPercent = `${(1 / ratio) * 100}%`;
  const variants = product.variants ?? [];
  const available = variants.some((v) => v.available);
  const prices = variants.map((v) => v.price_cents);
  const price = prices.length ? Math.min(...prices) : 0;
  const priceVaries = prices.length > 1 && Math.min(...prices) !== Math.max(...prices);
  const compareAt = variants.map((v) => v.compare_at_cents ?? 0).reduce((m, c) => Math.max(m, c), 0);
  const onSale = compareAt > price;
  const fmt = (cents: number) => `${money(cents)} USD`;
  const moneyPrice = priceVaries ? `From ${fmt(price)}` : fmt(price);
  const url = `/products/${product.handle}`;
  const pid = product.shopify_id ?? product.id;

  const badge = !available ? (
    <span id={`Badge-${sectionId}-${pid}`} className="badge badge--bottom-left color-scheme-3">Sold out</span>
  ) : onSale ? (
    <span id={`Badge-${sectionId}-${pid}`} className="badge badge--bottom-left color-scheme-4">Sale</span>
  ) : null;

  const priceBlock = (
    <div className={`price${!available ? " price--sold-out" : ""}${onSale ? " price--on-sale" : ""}`}>
      <div className="price__container">
        <div className="price__regular">
          <span className="visually-hidden visually-hidden--inline">Regular price</span>
          <span className="price-item price-item--regular">{moneyPrice}</span>
        </div>
        <div className="price__sale">
          <span className="visually-hidden visually-hidden--inline">Regular price</span>
          <span><s className="price-item price-item--regular">{onSale ? fmt(compareAt) : ""}</s></span>
          <span className="visually-hidden visually-hidden--inline">Sale price</span>
          <span className="price-item price-item--sale price-item--last">{moneyPrice}</span>
        </div>
        <small className="unit-price caption hidden">
          <span className="visually-hidden">Unit price</span>
          <span className="price-item price-item--last">
            <span></span>
            <span aria-hidden="true">/</span>
            <span className="visually-hidden">&nbsp;per&nbsp;</span>
            <span></span>
          </span>
        </small>
      </div>
    </div>
  );

  return (
    <div className="card-wrapper product-card-wrapper underline-links-hover">
      <div className={`card card--standard${media ? " card--media" : " card--text"}`} style={{ "--ratio-percent": ratioPercent } as React.CSSProperties}>
        <div className="card__inner color-scheme-2 gradient ratio" style={{ "--ratio-percent": ratioPercent } as React.CSSProperties}>
          {media ? (
            <div className="card__media">
              <div className="media media--transparent media--hover-effect">
                <img
                  src={media.src}
                  sizes="(min-width: 1200px) 267px, (min-width: 990px) calc((100vw - 130px) / 4), (min-width: 750px) calc((100vw - 120px) / 3), calc((100vw - 35px) / 2)"
                  alt={media.alt ?? product.title}
                  className="motion-reduce"
                  loading={lazy ? "lazy" : "eager"}
                  width={media.width}
                  height={media.height}
                />
              </div>
            </div>
          ) : null}
          <div className="card__content">
            {!media ? (
              <div className="card__information">
                <h3 className="card__heading" id={`title-${sectionId}-${pid}`}>
                  <a href={url} className="full-unstyled-link">{product.title}</a>
                </h3>
              </div>
            ) : null}
            <div className="card__badge bottom left">{badge}</div>
          </div>
        </div>
        <div className="card__content">
          <div className="card__information">
            <h3 className="card__heading h5" id={`title-${sectionId}-${pid}`}>
              <a href={url} id={`CardLink-${sectionId}-${pid}`} className="full-unstyled-link" aria-labelledby={`CardLink-${sectionId}-${pid} Badge-${sectionId}-${pid}`}>
                {product.title}
              </a>
            </h3>
            <div className="card-information">
              <span className="caption-large light"></span>
              {priceBlock}
            </div>
          </div>
          <div className="card__badge bottom left">{badge}</div>
        </div>
      </div>
    </div>
  );
}
