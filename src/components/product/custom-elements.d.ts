// Dawn's custom-element tag names used by the commerce pages. They are plain elements here (no JS upgrade);
// the theme CSS targets some of them by tag name (product-info, slider-component, variant-selects).
import type { DetailedHTMLProps, HTMLAttributes } from "react";

type El = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<`data-${string}`, string | number | undefined>;

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "product-info": El;
        "media-gallery": El;
        "slider-component": El;
        "variant-selects": El;
        "quantity-input": El;
        "product-form": El;
        "product-recommendations": El;
      }
    }
  }
}

export {};
