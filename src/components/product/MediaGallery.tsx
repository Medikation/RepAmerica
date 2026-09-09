"use client";
// Port of snippets/product-media-gallery.liquid + product-thumbnail.liquid for the settings in templates/product.json:
// gallery_layout = stacked, media_size = large, media_fit = contain, constrain_to_viewport = true, mobile_thumbnails = hide,
// image_zoom = lightbox (zoom modal / modal-opener dropped). The mobile slider buttons + counter are re-implemented
// with a few lines of React instead of Dawn's slider-component.
import { useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/lib/data";
import { IconCaret } from "./commerce-icons";

const SIZES = "(min-width: 1200px) 715px, (min-width: 990px) calc(65.0vw - 10rem), (min-width: 750px) calc((100vw - 11.5rem) / 2), calc(100vw / 1 - 4rem)";

export default function MediaGallery({ sectionId, images, title }: { sectionId: string; images: ProductImage[]; title: string }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(1);
  const total = images.length;

  // Track which slide is in view on mobile (mirrors slider-component's counter).
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const onScroll = () => {
      const first = list.querySelector<HTMLElement>(".slider__slide");
      if (!first) return;
      const w = first.clientWidth || 1;
      setCurrent(Math.min(total, Math.max(1, Math.round(list.scrollLeft / w) + 1)));
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    return () => list.removeEventListener("scroll", onScroll);
  }, [total]);

  // BuyForm dispatches this when a variant with its own image is chosen (Dawn's setActiveMedia scroll behaviour).
  useEffect(() => {
    const handler = (e: Event) => {
      const src = (e as CustomEvent<string>).detail;
      const li = listRef.current?.querySelector<HTMLElement>(`[data-media-src="${CSS.escape(src)}"]`);
      if (!li) return;
      listRef.current?.querySelectorAll(".product__media-item").forEach((el) => el.classList.remove("is-active"));
      li.classList.add("is-active");
      li.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
    };
    window.addEventListener("ra:variant-media", handler);
    return () => window.removeEventListener("ra:variant-media", handler);
  }, []);

  const slide = (dir: -1 | 1) => {
    const list = listRef.current;
    const first = list?.querySelector<HTMLElement>(".slider__slide");
    if (!list || !first) return;
    list.scrollBy({ left: dir * first.clientWidth, behavior: "smooth" });
  };

  return (
    <media-gallery id={`MediaGallery-${sectionId}`} role="region" className="product__column-sticky" aria-label="Gallery Viewer" data-desktop-layout="stacked">
      <div id={`GalleryStatus-${sectionId}`} className="visually-hidden" role="status"></div>
      <slider-component id={`GalleryViewer-${sectionId}`} className="slider-mobile-gutter">
        <a className="skip-to-content-link button visually-hidden quick-add-hidden" href={`#ProductInfo-${sectionId}`}>
          Skip to product information
        </a>
        <ul id={`Slider-Gallery-${sectionId}`} ref={listRef} className="product__media-list contains-media grid grid--peek list-unstyled slider slider--mobile" role="list">
          {images.map((img, i) => {
            const ratio = img.width && img.height ? (img.width / img.height).toFixed(4) : "1.0";
            return (
              <li
                key={img.id}
                id={`Slide-${sectionId}-${img.id}`}
                className={`product__media-item grid__item slider__slide${i === 0 ? " is-active" : ""}`}
                data-media-id={`${sectionId}-${img.id}`}
                data-media-src={img.src}
              >
                <div
                  className="product-media-container media-type-image media-fit-contain global-media-settings gradient constrain-height"
                  style={{ "--ratio": ratio, "--preview-ratio": ratio } as React.CSSProperties}
                >
                  <div className="product__media media media--transparent">
                    <img
                      src={img.src}
                      alt={img.alt ?? title}
                      width={img.width}
                      height={img.height}
                      loading={i === 0 ? undefined : "lazy"}
                      fetchPriority={i === 0 ? "high" : undefined}
                      sizes={SIZES}
                    />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        {total > 1 && (
          <div className="slider-buttons quick-add-hidden">
            <button type="button" className="slider-button slider-button--prev" name="previous" aria-label="Slide left" onClick={() => slide(-1)}>
              <span className="svg-wrapper"><IconCaret /></span>
            </button>
            <div className="slider-counter caption">
              <span className="slider-counter--current">{current}</span>
              <span aria-hidden="true"> / </span>
              <span className="visually-hidden">of</span>
              <span className="slider-counter--total">{total}</span>
            </div>
            <button type="button" className="slider-button slider-button--next" name="next" aria-label="Slide right" onClick={() => slide(1)}>
              <span className="svg-wrapper"><IconCaret /></span>
            </button>
          </div>
        )}
      </slider-component>
    </media-gallery>
  );
}
