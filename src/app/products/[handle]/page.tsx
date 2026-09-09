// templates/product.json → sections/main-product.liquid + sections/related-products.liquid
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import MediaGallery from "@/components/product/MediaGallery";
import BuyForm from "@/components/product/BuyForm";
import ProductCard from "@/components/ProductCard";

export const revalidate = 300;

type ProductTemplate = {
  sections: Record<string, { type: string; settings: Record<string, unknown>; blocks?: Record<string, { type: string; settings: Record<string, unknown> }>; block_order?: string[] }>;
  order: string[];
};

const stripHtml = (html: string | null | undefined) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return {};
  const description = stripHtml(product.body_html).slice(0, 320) || null;
  return buildMetadata({
    title: product.title,
    description,
    path: `/products/${handle}`,
    type: "product",
    image: product.images?.[0]?.src ?? null,
  });
}

/** {% style %} block of main-product / related-products: section padding (mobile = 0.75×). */
const paddingStyle = (id: string, top: number, bottom: number) => `.section-${id}-padding {
      padding-top: ${Math.round(top * 0.75)}px;
      padding-bottom: ${Math.round(bottom * 0.75)}px;
    }
    @media screen and (min-width: 750px) {
      .section-${id}-padding {
        padding-top: ${top}px;
        padding-bottom: ${bottom}px;
      }
    }`;

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [product, template] = await Promise.all([getProduct(handle), getSetting<ProductTemplate>("template:product")]);
  if (!product) notFound();

  const sections = orderedSections(template);
  const main = sections.find((s) => s.section.type === "main-product");
  const related = sections.find((s) => s.section.type === "related-products");
  const mainId = `template--product__${main?.id ?? "main"}`;
  const relatedId = `template--product__${related?.id ?? "related-products"}`;
  const ms = main?.section.settings ?? {};
  const rs = related?.section.settings ?? {};
  const blocks = main?.section.blocks ?? {};
  const blockOrder = main?.section.block_order ?? Object.keys(blocks);

  const images = [...(product.images ?? [])].sort((a, b) => a.position - b.position);
  const mediaSize = (ms.media_size as string) ?? "large";
  const mediaPosition = (ms.media_position as string) ?? "left";
  const galleryLayout = (ms.gallery_layout as string) ?? "stacked";
  const mobileThumbnails = (ms.mobile_thumbnails as string) ?? "hide";
  const colorScheme = (ms.color_scheme as string) ?? "scheme-1";
  const relatedScheme = (rs.color_scheme as string) ?? "scheme-1";

  // related-products: Shopify's recommendation API is gone; "other products" from the catalogue, same vendor first.
  const all = await getProducts();
  const others = all.filter((p) => p.handle !== product.handle);
  const recommendations = [
    ...others.filter((p) => p.vendor === product.vendor),
    ...others.filter((p) => p.vendor !== product.vendor),
  ].slice(0, Number(rs.products_to_show ?? 4));

  // Blocks rendered by the server; the interactive run (inventory → buy_buttons) is one client component.
  const interactive = new Set(["inventory", "price", "variant_picker", "quantity_selector", "buy_buttons"]);
  let interactiveRendered = false;

  return (
    <>
      <section id={`shopify-section-${mainId}`} className="shopify-section section">
        <product-info
          id={`MainProduct-${mainId}`}
          className={`section-${mainId}-padding gradient color-${colorScheme}`}
          data-section={mainId}
          data-product-id={product.id}
          data-url={`/products/${product.handle}`}
        >
          <style>{paddingStyle(mainId, Number(ms.padding_top ?? 36), Number(ms.padding_bottom ?? 12))}</style>
          <div className="page-width">
            <div
              className={`product product--${mediaSize} product--${mediaPosition} product--${galleryLayout} product--mobile-${mobileThumbnails}${images.length === 0 ? " product--no-media" : ""} grid grid--1-col grid--2-col-tablet`}
            >
              <div className="grid__item product__media-wrapper">
                <MediaGallery sectionId={mainId} images={images} title={product.title} />
              </div>
              <div className="product__info-wrapper grid__item">
                <section id={`ProductInfo-${mainId}`} className="product__info-container product__column-sticky">
                  {blockOrder.map((key) => {
                    const block = blocks[key];
                    if (!block) return null;
                    if (interactive.has(block.type)) {
                      if (interactiveRendered) return null;
                      interactiveRendered = true;
                      return <BuyForm key={key} product={product} sectionId={mainId} />;
                    }
                    switch (block.type) {
                      case "text": {
                        const style = block.settings.text_style as string | undefined;
                        const text = String(block.settings.text ?? "").replace("{{ product.vendor }}", product.vendor ?? "");
                        return (
                          <p key={key} className={`product__text inline-richtext${style === "uppercase" ? " caption-with-letter-spacing" : style === "subtitle" ? " subtitle" : ""}`}>
                            {text}
                          </p>
                        );
                      }
                      case "title":
                        return (
                          <div key={key} className="product__title">
                            <h1>{product.title}</h1>
                          </div>
                        );
                      case "description":
                        return product.body_html ? (
                          <div key={key} className="product__description rte quick-add-hidden" dangerouslySetInnerHTML={{ __html: product.body_html }} />
                        ) : null;
                      case "collapsible_tab": {
                        const content = String(block.settings.content ?? "");
                        const heading = String(block.settings.heading ?? "");
                        if (!content && !heading) return null;
                        return (
                          <div key={key} className="product__accordion accordion quick-add-hidden">
                            <details id={`Details-${key}-${mainId}`}>
                              <summary>
                                <div className="summary__title">
                                  <h2 className="h4 accordion__title inline-richtext">{heading}</h2>
                                </div>
                              </summary>
                              <div className="accordion__content rte" dangerouslySetInnerHTML={{ __html: content }} />
                            </details>
                          </div>
                        );
                      }
                      // share, sku, custom_liquid, popup, rating, complementary: share dropped (Shopify share widget), others unused.
                      default:
                        return null;
                    }
                  })}
                  {!interactiveRendered && <BuyForm product={product} sectionId={mainId} />}
                </section>
              </div>
            </div>
          </div>
        </product-info>
      </section>

      {related && recommendations.length > 0 && (
        <section id={`shopify-section-${relatedId}`} className="shopify-section section">
          <style>{paddingStyle(relatedId, Number(rs.padding_top ?? 36), Number(rs.padding_bottom ?? 28))}</style>
          <div className={`color-${relatedScheme} gradient`}>
            <product-recommendations className={`related-products page-width section-${relatedId}-padding isolate`} data-section-id={relatedId} data-product-id={product.id}>
              <h2 className={`related-products__heading inline-richtext ${(rs.heading_size as string) ?? "h2"}`}>{String(rs.heading ?? "You may also like")}</h2>
              <ul className={`grid product-grid grid--${rs.columns_desktop ?? 4}-col-desktop grid--${rs.columns_mobile ?? 2}-col-tablet-down`} role="list">
                {recommendations.map((p) => (
                  <li key={p.id} className="grid__item">
                    <ProductCard product={p} sectionId={relatedId} />
                  </li>
                ))}
              </ul>
            </product-recommendations>
          </div>
        </section>
      )}
    </>
  );
}
