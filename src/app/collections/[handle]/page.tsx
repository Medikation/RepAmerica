// templates/collection.json → sections/main-collection-banner.liquid + sections/main-collection-product-grid.liquid
// (facets / filtering / sorting / pagination dropped — 8 products, products_per_page = 16).
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCollection, getCollections, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import ProductCard from "@/components/ProductCard";

export const revalidate = 300;

type CollectionTemplate = { sections: Record<string, { type: string; settings: Record<string, unknown> }>; order: string[] };

const stripHtml = (html: string | null | undefined) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateStaticParams() {
  const collections = await getCollections();
  const handles = new Set(["all", "rep-america", "medikation", "recommended", "frontpage", ...collections.map((c) => c.handle)]);
  return [...handles].map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const collection = await getCollection(handle);
  if (!collection) return {};
  return buildMetadata({
    title: collection.title,
    description: stripHtml(collection.body_html) || null,
    path: `/collections/${handle}`,
    image: collection.image_url ?? collection.products[0]?.images?.[0]?.src ?? null,
  });
}

export default async function CollectionPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [collection, template] = await Promise.all([getCollection(handle), getSetting<CollectionTemplate>("template:collection")]);
  if (!collection) notFound();

  const sections = orderedSections(template);
  const banner = sections.find((s) => s.section.type === "main-collection-banner");
  const grid = sections.find((s) => s.section.type === "main-collection-product-grid");
  const bannerId = `template--collection__${banner?.id ?? "banner"}`;
  const gridId = `template--collection__${grid?.id ?? "product-grid"}`;
  const bs = banner?.section.settings ?? {};
  const gs = grid?.section.settings ?? {};
  const showImage = !!bs.show_collection_image && !!collection.image_url;
  const products = collection.products.slice(0, Number(gs.products_per_page ?? 16));
  const padTop = Number(gs.padding_top ?? 36);
  const padBottom = Number(gs.padding_bottom ?? 36);

  return (
    <>
      <div id={`shopify-section-${bannerId}`} className="shopify-section section">
        <style>{`@media screen and (max-width: 749px) {
    .collection-hero--with-image .collection-hero__inner {
      padding-bottom: calc(4px + 2rem);
    }
  }`}</style>
        <div className={`collection-hero${showImage ? " collection-hero--with-image" : ""} color-${(bs.color_scheme as string) ?? "scheme-1"} gradient`}>
          <div className="collection-hero__inner page-width ">
            <div className="collection-hero__text-wrapper">
              <h1 className="collection-hero__title">{collection.title}</h1>
              {bs.show_collection_description !== false && collection.body_html && (
                <div className="collection-hero__description rte" dangerouslySetInnerHTML={{ __html: collection.body_html }} />
              )}
            </div>
            {showImage && (
              <div className="collection-hero__image-container media gradient">
                <img src={collection.image_url!} alt={collection.title} sizes="(min-width: 750px) 50vw, 100vw" loading="eager" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div id={`shopify-section-${gridId}`} className="shopify-section section">
        <style>{`.section-${gridId}-padding {
    padding-top: ${Math.round(padTop * 0.75)}px;
    padding-bottom: ${Math.round(padBottom * 0.75)}px;
  }
  @media screen and (min-width: 750px) {
    .section-${gridId}-padding {
      padding-top: ${padTop}px;
      padding-bottom: ${padBottom}px;
    }
  }`}</style>
        <div className={`section-${gridId}-padding gradient color-${(gs.color_scheme as string) ?? "scheme-1"}`}>
          <div className="">
            {products.length === 0 ? (
              <div className="collection collection--empty page-width" id="product-grid" data-id={gridId}>
                <div className="loading-overlay gradient"></div>
                <div className="title-wrapper center">
                  <h2 className="title title--primary">
                    No products found
                    <br />
                    Use fewer filters or <a className="underlined-link link" href={`/collections/${handle}`}>remove all</a>
                  </h2>
                </div>
              </div>
            ) : (
              <div className="product-grid-container" id="ProductGridContainer">
                <div className="collection page-width">
                  <div className="loading-overlay gradient"></div>
                  <ul id="product-grid" data-id={gridId} className={`grid product-grid grid--${gs.columns_mobile ?? 2}-col-tablet-down grid--${gs.columns_desktop ?? 4}-col-desktop`}>
                    {products.map((p, i) => (
                      <li key={p.id} className="grid__item">
                        <ProductCard product={p} sectionId={gridId} lazy={i > 1} />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
