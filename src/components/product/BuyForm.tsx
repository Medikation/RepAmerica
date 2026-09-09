"use client";
// The interactive half of sections/main-product.liquid: blocks inventory, price, variant_picker (picker_type = button),
// quantity_selector and buy_buttons, in the block_order of templates/product.json. Shop Pay / dynamic checkout,
// installments and pickup availability are dropped; submit POSTs {variantId, quantity} to /api/checkout and follows
// the Stripe Checkout redirect.
import { Fragment, useMemo, useState, type FormEvent } from "react";
import type { Product, Variant } from "@/lib/data";
import Price from "./Price";
import { IconError, IconInventoryStatus, IconMinus, IconPlus, LoadingSpinner } from "./commerce-icons";

const VARIANT_PICKER_CSS = `variant-selects{display:block}
:is(.product-form__input--pill,.product-form__input--swatch) .form__label{margin-bottom:.2rem}
.product-form__input input[type='radio']{clip:rect(0,0,0,0);overflow:hidden;position:absolute;height:1px;width:1px}
.product-form__input input[type='radio']:not(.disabled):not(.visually-disabled)+label>.label-unavailable{display:none}
.product-form__input--pill input[type='radio']+label{border:var(--variant-pills-border-width) solid rgba(var(--color-foreground),var(--variant-pills-border-opacity));background-color:rgb(var(--color-background));border-radius:var(--variant-pills-radius);color:rgb(var(--color-foreground));display:inline-block;margin:.7rem .5rem .2rem 0;padding:1rem 2rem;font-size:1.4rem;letter-spacing:.1rem;line-height:1;text-align:center;transition:border var(--duration-short) ease;cursor:pointer;position:relative}
.product-form__input--pill input[type='radio']+label:before{content:'';position:absolute;top:calc(var(--variant-pills-border-width) * -1);right:calc(var(--variant-pills-border-width) * -1);bottom:calc(var(--variant-pills-border-width) * -1);left:calc(var(--variant-pills-border-width) * -1);z-index:-1;border-radius:var(--variant-pills-radius);box-shadow:var(--variant-pills-shadow-horizontal-offset) var(--variant-pills-shadow-vertical-offset) var(--variant-pills-shadow-blur-radius) rgba(var(--color-shadow),var(--variant-pills-shadow-opacity))}
.product-form__input--pill input[type='radio']+label:hover{border-color:rgb(var(--color-foreground))}
.product-form__input--pill input[type='radio']:checked+label{background-color:rgb(var(--color-foreground));color:rgb(var(--color-background))}
@media screen and (forced-colors:active){.product-form__input--pill input[type='radio']:checked+label{text-decoration:underline}.product-form__input--pill input[type='radio']:focus-visible+label{outline:transparent solid 1px;outline-offset:2px}}
.product-form__input--pill input[type='radio']:checked+label::selection{background-color:rgba(var(--color-background),.3)}
.product-form__input--pill input[type='radio']:disabled+label,.product-form__input--pill input[type='radio'].disabled+label{border-color:rgba(var(--color-foreground),.1);color:rgba(var(--color-foreground),.6);text-decoration:line-through}
.product-form__input--pill input[type='radio'].disabled:checked+label,.product-form__input--pill input[type='radio']:disabled:checked+label{color:rgba(var(--color-background),.6)}
.product-form__input--pill input[type='radio']:focus-visible+label{box-shadow:0 0 0 .3rem rgb(var(--color-background)),0 0 0 .5rem rgba(var(--color-foreground),.55)}`;

const optionValue = (v: Variant, i: number) => [v.option1, v.option2, v.option3][i];

export default function BuyForm({ product, sectionId }: { product: Product; sectionId: string }) {
  const variants = product.variants ?? [];
  const options = [...(product.options ?? [])].sort((a, b) => a.position - b.position);
  const hasOnlyDefaultVariant = variants.length <= 1 && (options.length === 0 || (options[0].name === "Title" && options[0].values?.[0] === "Default Title"));
  const firstAvailable = variants.find((v) => v.available) ?? variants[0];

  const [selected, setSelected] = useState<(string | null)[]>(() => options.map((_, i) => (firstAvailable ? optionValue(firstAvailable, i) : null)));
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const variant = useMemo<Variant | undefined>(
    () => (hasOnlyDefaultVariant ? variants[0] : variants.find((v) => options.every((_, i) => optionValue(v, i) === selected[i]))),
    [variants, options, selected, hasOnlyDefaultVariant],
  );
  const formId = `product-form-${sectionId}`;
  const available = !!variant && variant.available;

  const pick = (optionIndex: number, value: string) => {
    const next = [...selected];
    next[optionIndex] = value;
    setSelected(next);
    const v = variants.find((x) => options.every((_, i) => optionValue(x, i) === next[i]));
    if (v?.image_src) window.dispatchEvent(new CustomEvent("ra:variant-media", { detail: v.image_src }));
  };

  const isValueAvailable = (optionIndex: number, value: string) =>
    variants.some((v) => v.available && optionValue(v, optionIndex) === value && options.every((_, i) => i === optionIndex || optionValue(v, i) === selected[i]));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!variant || !available || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId: variant.id, quantity }),
      });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <style>{VARIANT_PICKER_CSS}</style>

      {/* block: inventory (inventory_quantity is not exported — approximated with the variant's availability) */}
      <p className="product__inventory" id={`Inventory-${sectionId}`} role="status">
        {available ? (
          <>
            <span className="svg-wrapper" style={{ color: "rgb(62, 214, 96)" }}><IconInventoryStatus /></span>In stock
          </>
        ) : (
          <>
            <span className="svg-wrapper" style={{ color: "rgb(200, 200, 200)" }}><IconInventoryStatus /></span>Out of stock
          </>
        )}
      </p>

      {/* block: price */}
      <div id={`price-${sectionId}`} role="status">
        <Price priceCents={variant?.price_cents ?? 0} compareAtCents={variant?.compare_at_cents} available={available} priceClass="price--large" showBadges />
      </div>
      <div className="product__tax caption rte">Shipping calculated at checkout.</div>

      {/* block: variant_picker (picker_type = button) */}
      {!hasOnlyDefaultVariant && (
        <variant-selects id={`variant-selects-${sectionId}`} data-section={sectionId}>
          {options.map((option, oi) => (
            <fieldset key={option.name} className="js product-form__input product-form__input--pill">
              <legend className="form__label">{option.name}</legend>
              {option.values.map((value, vi) => {
                const id = `${sectionId}-${option.position}-${vi}`;
                const disabled = !isValueAvailable(oi, value);
                return (
                  <Fragment key={value}>
                    <input
                      type="radio"
                      id={id}
                      name={`${option.name}-${option.position}`}
                      value={value}
                      form={formId}
                      checked={selected[oi] === value}
                      onChange={() => pick(oi, value)}
                      className={disabled ? "disabled" : undefined}
                    />
                    <label htmlFor={id}>
                      {value}
                      <span className="visually-hidden label-unavailable">Variant sold out or unavailable</span>
                    </label>
                  </Fragment>
                );
              })}
            </fieldset>
          ))}
        </variant-selects>
      )}

      {/* block: quantity_selector */}
      <div id={`Quantity-Form-${sectionId}`} className="product-form__input product-form__quantity">
        <label className="quantity__label form__label" htmlFor={`Quantity-${sectionId}`}>
          Quantity
        </label>
        <div className="price-per-item__container">
          <quantity-input className="quantity" data-url={`/products/${product.handle}`} data-section={sectionId}>
            <button className="quantity__button" name="minus" type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
              <span className="visually-hidden">Decrease quantity for {product.title}</span>
              <span className="svg-wrapper"><IconMinus /></span>
            </button>
            <input
              className="quantity__input"
              type="number"
              name="quantity"
              id={`Quantity-${sectionId}`}
              data-min="1"
              min="1"
              step="1"
              value={quantity}
              form={formId}
              onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
            />
            <button className="quantity__button" name="plus" type="button" onClick={() => setQuantity((q) => q + 1)}>
              <span className="visually-hidden">Increase quantity for {product.title}</span>
              <span className="svg-wrapper"><IconPlus /></span>
            </button>
          </quantity-input>
        </div>
        <div className="quantity__rules caption" id={`Quantity-Rules-${sectionId}`}></div>
      </div>

      {/* block: buy_buttons (snippets/buy-buttons.liquid, dynamic checkout dropped → button--primary) */}
      <div>
        <product-form className="product-form" data-hide-errors="false" data-section-id={sectionId}>
          <div className="product-form__error-message-wrapper" role="alert" hidden={!error}>
            <span className="svg-wrapper"><IconError /></span>
            <span className="product-form__error-message">{error}</span>
          </div>
          <form method="post" action="/api/checkout" id={formId} acceptCharset="UTF-8" className="form" noValidate data-type="add-to-cart-form" onSubmit={submit}>
            <input type="hidden" name="id" value={variant?.id ?? ""} disabled={!available} className="product-variant-id" />
            <div className="product-form__buttons">
              <button
                id={`ProductSubmitButton-${sectionId}`}
                type="submit"
                name="add"
                className="product-form__submit button button--full-width button--primary"
                disabled={!available || submitting}
                aria-disabled={!available || submitting}
              >
                <span>{!variant ? "Unavailable" : !available ? "Sold out" : "Add to cart"}</span>
                <LoadingSpinner hidden={!submitting} />
              </button>
            </div>
            <input type="hidden" name="product-id" value={product.id} />
            <input type="hidden" name="section-id" value={sectionId} />
          </form>
        </product-form>
      </div>
    </>
  );
}
