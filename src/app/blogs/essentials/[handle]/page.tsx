import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticles, getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { metaString, stripHtml } from "@/components/watch/utils";

export const revalidate = 300;

interface EssentialsTemplate {
  sections: { main: { type: string; settings: { parent_label?: string; parent_url?: string; disclosure?: string } } };
  order: string[];
}

export async function generateStaticParams() {
  const articles = await getArticles("essentials");
  return articles.map((a) => ({ handle: a.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const article = await getArticle("essentials", handle);
  if (!article) return {};
  const description = article.seo_description ?? (stripHtml(article.summary) || stripHtml(article.body_html).slice(0, 320));
  return buildMetadata({
    title: article.seo_title ?? article.title,
    noSuffix: Boolean(article.seo_title),
    description: description || null,
    path: `/blogs/essentials/${handle}`,
    type: "article",
    image: article.image_url,
  });
}

/* Port of the section's inline {% style %} block (unscoped in the Liquid, so unscoped here). */
const CSS = `
  .ra-ea__eyebrow {
    margin: 0 0 var(--ra-space-sm);
    font-size: var(--ra-text-xs);
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ra-color-subtle);
  }

  .ra-ea__eyebrow a {
    color: inherit;
    text-decoration: none;
  }

  .ra-ea__eyebrow a:hover {
    color: var(--ra-color-ink);
  }

  .ra-ea__title {
    margin: 0 0 var(--ra-space-md);
    font-size: clamp(32px, 5vw, 48px);
    line-height: 1.08;
    letter-spacing: -0.02em;
    color: var(--ra-color-ink);
  }

  .ra-ea__lede {
    margin-bottom: var(--ra-space-lg);
    font-size: 20px;
    line-height: 1.5;
    color: var(--ra-color-muted);
  }

  .ra-ea__image {
    margin: 0 auto var(--ra-space-xl);
    max-width: 480px;
    background: var(--ra-color-surface);
    border-radius: 4px;
    overflow: hidden;
  }

  .ra-ea__image img {
    display: block;
    width: 100%;
    height: auto;
  }

  .ra-ea__actions {
    margin-bottom: var(--ra-space-xl);
  }

  .ra-ea__actions--bottom {
    margin-top: var(--ra-space-xl);
  }

  .ra-ea__body {
    color: var(--ra-color-ink);
  }

  .ra-ea__body h2 {
    margin: var(--ra-space-xl) 0 var(--ra-space-sm);
    font-size: 26px;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .ra-ea__body p,
  .ra-ea__body li {
    font-size: 18px;
    line-height: 1.6;
    color: var(--ra-color-muted);
  }

  .ra-ea__disclosure {
    margin-top: var(--ra-space-xl);
    padding-top: var(--ra-space-md);
    border-top: 1px solid var(--ra-color-border, rgba(0, 0, 0, 0.1));
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
  }

  .ra-ea__related {
    margin-top: var(--ra-space-4xl);
  }

  .ra-ea__card-link {
    color: inherit;
    text-decoration: none;
  }

  .ra-ea__card-link:hover {
    text-decoration: underline;
  }

  .ra-ea__back {
    margin-top: var(--ra-space-xl);
    text-align: center;
  }
`;

/** Port of sections/essentials-article.liquid (templates/article.essentials.json). */
export default async function EssentialsArticlePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [article, template, all] = await Promise.all([
    getArticle("essentials", handle),
    getSetting<EssentialsTemplate>("template:article.essentials"),
    // `blog.articles` without `| reverse` = Shopify's default, newest first.
    getArticles("essentials", { desc: true }),
  ]);
  if (!article) notFound();

  const s = template.sections.main.settings;
  const parentUrl = s.parent_url ?? "/pages/shop";
  const parentLabel = s.parent_label ?? "The Essentials";
  const category = metaString(article, "essentials_category");
  const label = metaString(article, "link_label");
  const linkUrl = metaString(article, "link_url");
  const lede = article.summary && stripHtml(article.summary) ? article.summary : "";
  const cta = `View${label ? ` on ${label}` : ""}`;

  const related = all.filter((o) => o.handle !== article.handle && metaString(o, "essentials_category") === category).slice(0, 3);

  return (
    <section id="shopify-section-template--article.essentials__main" className="shopify-section">
      <article className="ra-section ra-ea">
        <div className="ra-container-md">
          <p className="ra-ea__eyebrow">
            <a href={parentUrl}>{parentLabel}</a>
            {category ? <> <span aria-hidden="true">·</span> {category}</> : null}
          </p>

          <h1 className="ra-ea__title">{article.title}</h1>

          {lede ? <div className="ra-ea__lede" dangerouslySetInnerHTML={{ __html: lede }} /> : null}

          {article.image_url ? (
            <div className="ra-ea__image">
              <img src={article.image_url} alt={article.image_alt || article.title} width={900} height={900} loading="eager" />
            </div>
          ) : null}

          {linkUrl ? (
            <div className="ra-ea__actions">
              <a className="ra-button ra-button--primary" href={linkUrl} target="_blank" rel="nofollow sponsored noopener">{cta}</a>
            </div>
          ) : null}

          <div className="ra-ea__body rte" dangerouslySetInnerHTML={{ __html: article.body_html ?? "" }} />

          {linkUrl ? (
            <div className="ra-ea__actions ra-ea__actions--bottom">
              <a className="ra-button ra-button--primary" href={linkUrl} target="_blank" rel="nofollow sponsored noopener">{cta}</a>
            </div>
          ) : null}

          {s.disclosure ? <p className="ra-ea__disclosure">{s.disclosure}</p> : null}
        </div>

        {related.length > 0 ? (
          <div className="ra-container ra-ea__related">
            <div className="ra-section-header ra-text-center">
              <h2 className="ra-section-header__title">More from {category}</h2>
            </div>
            <div className="ra-grid-3">
              {related.map((o) => (
                <article key={o.handle} className="ra-product-card">
                  <a href={`/blogs/essentials/${o.handle}`} className="ra-product-card__link">
                    <div className="ra-product-card__image">
                      {o.image_url ? <img src={o.image_url} alt={o.title} loading="lazy" /> : null}
                    </div>
                  </a>
                  <div className="ra-product-card__body">
                    <h3 className="ra-product-card__title">
                      <a className="ra-ea__card-link" href={`/blogs/essentials/${o.handle}`}>{o.title}</a>
                    </h3>
                  </div>
                </article>
              ))}
            </div>
            <p className="ra-ea__back">
              <a className="ra-text-link" href={parentUrl}>Back to {parentLabel}</a>
            </p>
          </div>
        ) : null}
      </article>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </section>
  );
}
