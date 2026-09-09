// templates/list-collections.json → sections/main-list-collections.liquid + snippets/card-collection.liquid
// (settings: collection_card_style = standard, collection_card_color_scheme = scheme-2; sort = alphabetical).
import type { Metadata } from "next";
import { getCollections, getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { IconArrow } from "@/components/product/commerce-icons";

export const revalidate = 300;

type ListTemplate = { sections: Record<string, { type: string; settings: Record<string, unknown> }>; order: string[] };

// assets/section-collection-list.css is not in src/styles; the rules the list page uses, verbatim.
const COLLECTION_LIST_CSS = `.collection-list{margin-top:0;margin-bottom:0}
.collection-list-title{margin:0}
@media screen and (max-width:749px){.collection-list:not(.slider){padding-left:0;padding-right:0}}
.collection-list__item:only-child{max-width:100%;width:100%}
@media screen and (min-width:750px){.collection-list__item a:hover{box-shadow:none}}`;

const stripHtml = (html: string | null | undefined) => (html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const truncateWords = (s: string, n: number) => {
  const w = s.split(" ");
  return w.length > n ? w.slice(0, n).join(" ") + "..." : s;
};

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ title: "Collections", path: "/collections" });
}

export default async function ListCollectionsPage() {
  let settings: Record<string, unknown> = {};
  try {
    const template = await getSetting<ListTemplate>("template:list-collections");
    settings = template.order.map((id) => template.sections[id]).find((s) => s?.type === "main-list-collections")?.settings ?? {};
  } catch {
    // template:list-collections was not exported — fall back to the defaults in templates/list-collections.json
  }
  const title = String(settings.title ?? "Collections");
  const sort = String(settings.sort ?? "alphabetical");
  const ratioSetting = String(settings.image_ratio ?? "square");
  const columnsDesktop = Number(settings.columns_desktop ?? 3);
  const columnsMobile = Number(settings.columns_mobile ?? 2);

  // Shopify's `collections` drop excludes the hidden "frontpage" collection from list pages.
  let collections = (await getCollections()).filter((c) => c.handle !== "frontpage");
  collections = [...collections].sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "alphabetical_reversed") collections.reverse();

  return (
    <div id="shopify-section-template--list-collections__main" className="shopify-section section">
      <style>{COLLECTION_LIST_CSS}</style>
      <div className="page-width">
        <h1 className="title title--primary inline-richtext">{title}</h1>
        <ul className={`collection-list grid grid--${columnsDesktop}-col-desktop grid--${columnsMobile}-col-tablet-down`} role="list">
          {collections.map((c) => {
            const ratio = c.image_url && ratioSetting === "portrait" ? 0.8 : 1;
            const ratioStyle = { "--ratio-percent": `${(1 / ratio) * 100}%` } as React.CSSProperties;
            const description = stripHtml(c.body_html);
            return (
              <li key={c.id} className="collection-list__item grid__item">
                <div className="card-wrapper animate-arrow collection-card-wrapper">
                  <div className={`card card--standard${c.image_url ? " card--media" : " card--text"}`} style={ratioStyle}>
                    <div className="card__inner color-scheme-2 gradient ratio" style={ratioStyle}>
                      {c.image_url && (
                        <div className="card__media">
                          <div className="media media--transparent media--hover-effect">
                            <img
                              src={c.image_url}
                              sizes={`(min-width: 1200px) ${Math.floor(1100 / 3)}px, (min-width: 750px) calc((100vw - 10rem) / 2), calc(100vw - 3rem)`}
                              alt={c.title}
                              loading="lazy"
                              className="motion-reduce"
                            />
                          </div>
                        </div>
                      )}
                      <div className="card__content">
                        <div className="card__information">
                          <h3 className="card__heading">
                            <a href={`/collections/${c.handle}`} className="full-unstyled-link">
                              {c.title}
                              {!description && (
                                <span className="icon-wrap"><IconArrow /></span>
                              )}
                            </a>
                          </h3>
                          {description && (
                            <p className="card__caption">
                              {truncateWords(description, 12)}
                              <span className="icon-wrap"><IconArrow /></span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    {c.image_url && (
                      <div className="card__content">
                        <div className="card__information">
                          <h3 className="card__heading">
                            <a href={`/collections/${c.handle}`} className="full-unstyled-link">
                              {c.title}
                              <span className="icon-wrap"><IconArrow /></span>
                            </a>
                          </h3>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
