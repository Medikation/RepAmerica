/* Search: sections/main-search.liquid + templates/search.json (getSetting("template:search")), server-rendered.
 * Dropped: predictive search, facets/sorting (Shopify search API). `?q=` is matched with ilike against article
 * title/summary (all three blogs) and product titles; results are rendered with the article-card markup. */
import type { Metadata } from "next";
import ArticleCard from "@/components/ArticleCard";
import { IconReset, IconSearch } from "@/components/icons";
import { getSetting, type Article, type Product } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

interface SearchTemplate {
  sections: { main: { settings: { columns_desktop?: number; columns_mobile?: string; article_show_date?: boolean; article_show_author?: boolean; padding_top?: number; padding_bottom?: number } } };
}

type SearchParams = Promise<{ q?: string | string[] }>;

const STYLE = `
  .template-search__header { margin-bottom: 3rem; }
  .template-search__search { margin: 0 auto 3.5rem; max-width: 74.1rem; }
  .template-search__search .search { margin-top: 3rem; }
  .template-search--empty { padding-bottom: 18rem; }
  @media screen and (min-width: 750px) { .template-search__header { margin-bottom: 5rem; } }
  .search__button .icon { height: 1.8rem; }
`;

/** Escape the PostgREST `ilike` pattern characters in user input. */
const likeTerm = (q: string) => `%${q.replace(/[%_\\]/g, (c) => `\\${c}`).replace(/[,()]/g, " ")}%`;

async function runSearch(q: string): Promise<{ articles: Article[]; products: Product[] }> {
  const term = likeTerm(q);
  const [a, p] = await Promise.all([
    supabase
      .from("articles")
      .select("id,shopify_id,blog,handle,title,author,summary,image_url,image_alt,image_width,image_height,tags,is_published,published_at,seo_title,seo_description,meta,created_at,updated_at")
      .eq("is_published", true)
      .or(`title.ilike.${term},summary.ilike.${term}`)
      .order("published_at", { ascending: false })
      .limit(200),
    supabase.from("products").select("*").eq("is_published", true).ilike("title", term).order("id").limit(100),
  ]);
  return { articles: (a.data ?? []) as unknown as Article[], products: (p.data ?? []) as Product[] };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const q = firstParam((await searchParams).q);
  return buildMetadata({ title: q ? "Search results" : "Search", path: q ? `/search?q=${encodeURIComponent(q)}` : "/search" });
}

const firstParam = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const q = firstParam((await searchParams).q);
  const performed = q.length > 0;
  const [template, results] = await Promise.all([getSetting<SearchTemplate>("template:search"), performed ? runSearch(q) : Promise.resolve({ articles: [], products: [] })]);
  const s = template.sections.main?.settings ?? {};
  const pt = s.padding_top ?? 36;
  const pb = s.padding_bottom ?? 36;
  const sectionId = "main-search";
  const count = results.articles.length + results.products.length;
  const sectionStyle = `
    .section-${sectionId}-padding { padding-top: ${Math.round(pt * 0.75)}px; padding-bottom: ${Math.round(pb * 0.75)}px; }
    @media screen and (min-width: 750px) { .section-${sectionId}-padding { padding-top: ${pt}px; padding-bottom: ${pb}px; } }
  `;

  return (
    <div id="shopify-section-main-search" className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: STYLE + sectionStyle }} />
      <div className={`template-search${!(performed && count > 0) ? " template-search--empty" : ""} section-${sectionId}-padding`}>
        <div className="template-search__header page-width">
          <h1 className="h2 center">{performed ? "Search results" : "Search"}</h1>
          <div className="template-search__search">
            <main-search>
              <form action="/search" method="get" role="search" className="search">
                <div className="field">
                  <input className="search__input field__input" id="Search-In-Template" type="search" name="q" defaultValue={q} placeholder="Search" />
                  <label className="field__label" htmlFor="Search-In-Template">Search</label>
                  <button type="reset" className={`reset__button field__button${q ? "" : " hidden"}`} aria-label="Clear search term">
                    <span className="svg-wrapper"><IconReset /></span>
                  </button>
                  <button type="submit" className="search__button field__button" aria-label="Search">
                    <span className="svg-wrapper"><IconSearch /></span>
                  </button>
                </div>
              </form>
            </main-search>
          </div>
          {performed && count > 0 && (
            <p role="status">{count === 1 ? `1 result found for “${q}”` : `${count} results found for “${q}”`}</p>
          )}
          {performed && count === 0 && (
            <p role="status">No results found for “{q}”. Check the spelling or use a different word or phrase.</p>
          )}
        </div>
        {performed && (
          <div>
            <div className="product-grid-container" id="ProductGridContainer">
              <div className="template-search__results collection page-width" id="product-grid" data-id={sectionId}>
                <div className="loading-overlay gradient"></div>
                <ul className={`grid product-grid  grid--${s.columns_mobile ?? "2"}-col-tablet-down grid--${s.columns_desktop ?? 4}-col-desktop`} role="list">
                  {results.products.map((product, i) => (
                    <li key={`p-${product.id}`} className="grid__item">
                      <ProductCard product={product} lazyLoad={i >= 2} />
                    </li>
                  ))}
                  {results.articles.map((article, i) => (
                    <li key={`a-${article.id}`} className="grid__item">
                      <ArticleCard
                        article={article}
                        showImage
                        showDate={s.article_show_date ?? true}
                        showAuthor={s.article_show_author ?? false}
                        showBadge
                        mediaAspectRatio={1}
                        lazyLoad={results.products.length + i >= 2}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Product hit rendered with the article-card markup (snippets/card-product.liquid is owned by the product routes). */
function ProductCard({ product, lazyLoad }: { product: Product; lazyLoad: boolean }) {
  const image = product.images?.[0];
  const title = product.title.length > 50 ? product.title.slice(0, 47).trimEnd() + "..." : product.title;
  const heading = (
    <h3 className="card__heading">
      <a href={`/products/${product.handle}`} className="full-unstyled-link">{title}</a>
    </h3>
  );
  return (
    <div className="article-card-wrapper card-wrapper underline-links-hover">
      <div className={`card article-card card--standard ${image ? "card--media" : "card--text"}`} style={{ "--ratio-percent": "100%" } as React.CSSProperties}>
        <div className="card__inner color-scheme-2 gradient ratio" style={{ "--ratio-percent": "100%" } as React.CSSProperties}>
          {image && (
            <div className="article-card__image-wrapper card__media">
              <div className="article-card__image media media--hover-effect">
                <img src={image.src} alt={image.alt ?? product.title} className="motion-reduce" loading={lazyLoad ? "lazy" : undefined} width={image.width} height={image.height} />
              </div>
            </div>
          )}
          <div className="card__content"><div className="card__information">{heading}</div></div>
        </div>
        <div className="card__content">
          <div className="card__information">{heading}</div>
          <div className="card__badge bottom left"><span className="badge color-scheme-1">Products</span></div>
        </div>
      </div>
    </div>
  );
}
