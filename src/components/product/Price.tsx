// Port of snippets/price.liquid (settings.currency_code_enabled = true → "$49.99 USD").
// Pure markup, safe in server and client components.

export const moneyWithCurrency = (cents: number) => `$${(cents / 100).toFixed(2)} USD`;

export interface PriceProps {
  priceCents: number;
  compareAtCents?: number | null;
  available: boolean;
  /** price.liquid `price_class` (product page passes "price--large"). */
  priceClass?: string;
  /** price.liquid `show_badges` (product page only). */
  showBadges?: boolean;
}

export default function Price({ priceCents, compareAtCents, available, priceClass, showBadges }: PriceProps) {
  const onSale = !!compareAtCents && compareAtCents > priceCents;
  const cls = ["price", priceClass, !available && "price--sold-out", onSale && "price--on-sale", showBadges && "price--show-badge"]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls}>
      <div className="price__container">
        <div className="price__regular">
          <span className="visually-hidden visually-hidden--inline">Regular price</span>
          <span className="price-item price-item--regular">{moneyWithCurrency(priceCents)}</span>
        </div>
        <div className="price__sale">
          <span className="visually-hidden visually-hidden--inline">Regular price</span>
          <span>
            <s className="price-item price-item--regular">{onSale ? moneyWithCurrency(compareAtCents!) : null}</s>
          </span>
          <span className="visually-hidden visually-hidden--inline">Sale price</span>
          <span className="price-item price-item--sale price-item--last">{moneyWithCurrency(priceCents)}</span>
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
      {showBadges && (
        <>
          <span className="badge price__badge-sale color-scheme-4">Sale</span>
          <span className="badge price__badge-sold-out color-scheme-3">Sold out</span>
        </>
      )}
    </div>
  );
}
