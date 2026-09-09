import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticles, getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import ShareButton from "@/components/watch/ShareButton";
import { excerptOf, longDate, metaString, stripHtml, videoId } from "@/components/watch/utils";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
const SECTION_ID = "template--article__main";

interface ArticleTemplate {
  sections: {
    main: {
      type: string;
      blocks: Record<string, { type: string; settings: Record<string, string | boolean> }>;
      block_order: string[];
      settings: Record<string, unknown>;
    };
  };
  order: string[];
}

export async function generateStaticParams() {
  const articles = await getArticles("watch");
  return articles.map((a) => ({ handle: a.handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle: rawHandle } = await params; const handle = decodeURIComponent(rawHandle);
  const article = await getArticle("watch", handle);
  if (!article) return {};
  const vid = videoId(article);
  const description = article.seo_description ?? (article.summary && stripHtml(article.summary) ? stripHtml(article.summary) : stripHtml(article.body_html)).slice(0, 320);
  return buildMetadata({
    title: article.seo_title ?? article.title,
    noSuffix: Boolean(article.seo_title),
    description: description || null,
    path: `/blogs/watch/${handle}`,
    type: "article",
    image: vid ? `https://img.youtube.com/vi/${vid}/maxresdefault.jpg` : article.image_url,
  });
}

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-arrow" viewBox="0 0 14 10"><path fill="currentColor" fillRule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clipRule="evenodd"/></svg>
);

/** Liquid duration "MM:SS" / "H:MM:SS" → ISO 8601 for the VideoObject schema. */
function isoDuration(d: string): string | null {
  const parts = d.split(":");
  if (parts.length === 2) return `PT${parts[0]}M${parts[1]}S`;
  if (parts.length === 3) return `PT${parts[0]}H${parts[1]}M${parts[2]}S`;
  return null;
}

/** Port of sections/main-article.liquid as configured by templates/article.json (Watch videos). */
export default async function WatchArticlePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params; const handle = decodeURIComponent(rawHandle);
  const [article, template] = await Promise.all([getArticle("watch", handle), getSetting<ArticleTemplate>("template:article")]);
  if (!article) notFound();

  const main = template.sections.main;
  const vid = videoId(article);
  const duration = metaString(article, "duration");
  const url = `/blogs/watch/${article.handle}`;
  const shareUrl = `${SITE}${url}`;

  const articleLd = {
    "@context": "http://schema.org",
    "@type": "Article",
    articleBody: stripHtml(article.body_html),
    mainEntityOfPage: { "@type": "WebPage", "@id": shareUrl },
    headline: article.title,
    description: stripHtml(article.summary) || undefined,
    image: vid ? [`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`] : article.image_url ? [article.image_url] : undefined,
    datePublished: article.published_at,
    dateCreated: article.created_at,
    author: { "@type": "Person", name: article.author ?? "Rep America" },
    publisher: { "@type": "Organization", name: "Rep America" },
  };
  const videoLd = vid
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: article.title,
        description: excerptOf(article, 60),
        thumbnailUrl: [`https://img.youtube.com/vi/${vid}/maxresdefault.jpg`],
        uploadDate: article.published_at,
        embedUrl: `https://www.youtube.com/embed/${vid}`,
        ...(duration && isoDuration(duration) ? { duration: isoDuration(duration) } : {}),
      }
    : null;

  return (
    <section id={`shopify-section-${SECTION_ID}`} className="shopify-section section">
      <article className="article-template">
        {main.block_order.map((bid) => {
          const block = main.blocks[bid];
          if (!block) return null;
          switch (block.type) {
            case "featured_image": {
              if (!article.image_url) return null;
              const ratio = article.image_width && article.image_height ? article.image_width / article.image_height : 1;
              const height = String(block.settings.image_height ?? "adapt");
              return (
                <div key={bid} className="article-template__hero-container">
                  <div className={`article-template__hero-${height} media`} style={height === "adapt" ? { paddingBottom: `${(1 / ratio) * 100}%` } : undefined}>
                    <img
                      src={article.image_url}
                      loading="eager"
                      fetchPriority="high"
                      width={article.image_width ?? undefined}
                      height={article.image_height ?? undefined}
                      alt={article.image_alt ?? ""}
                    />
                  </div>
                </div>
              );
            }
            case "title":
              return (
                <header key={bid} className="page-width page-width--narrow">
                  <h1 className="article-template__title">{article.title}</h1>
                  {vid ? (
                    <div className="rep-video-embed">
                      <iframe
                        src={`https://www.youtube.com/embed/${vid}`}
                        title={article.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  ) : null}
                  {block.settings.blog_show_date ? (
                    <span className="circle-divider caption-with-letter-spacing">
                      <time dateTime={article.published_at}>{longDate(article.published_at)}</time>
                    </span>
                  ) : null}
                  {block.settings.blog_show_author ? (
                    <span className="caption-with-letter-spacing"><span>{article.author}</span></span>
                  ) : null}
                </header>
              );
            case "share":
              return (
                <div key={bid} className="article-template__social-sharing page-width page-width--narrow">
                  <ShareButton id={SECTION_ID} label={String(block.settings.share_label ?? "Share")} shareUrl={shareUrl} />
                </div>
              );
            case "content":
              return (
                <div key={bid} className="article-template__content page-width page-width--narrow rte" dangerouslySetInnerHTML={{ __html: article.body_html ?? "" }} />
              );
            default:
              return null;
          }
        })}

        <div className="article-template__back element-margin-top center">
          <a href="/blogs/watch" className="article-template__link link animate-arrow">
            <span className="icon-wrap">
              <span className="svg-wrapper"><ArrowIcon /></span>
            </span>
            Back to blog
          </a>
        </div>
      </article>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      {videoLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoLd) }} /> : null}
    </section>
  );
}
