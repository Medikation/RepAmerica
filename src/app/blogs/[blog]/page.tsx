/* Blog index: sections/main-blog.liquid + templates/blog.json (getSetting("template:blog")).
 * All published articles, newest first, no pagination (the theme's paginate-by-6 is intentionally dropped). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArticleCard from "@/components/ArticleCard";
import { getArticles, getSetting, type Blog } from "@/lib/data";
import WatchPagination from "@/components/watch/WatchPagination";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

const BLOGS: Record<Blog, string> = { watch: "Watch", "great-books": "Great Books", essentials: "Essentials" };
const isBlog = (b: string): b is Blog => b in BLOGS;

interface BlogTemplate {
  sections: { main: { settings: { layout?: string; show_image?: boolean; image_height?: string; show_date?: boolean; show_author?: boolean; padding_top?: number; padding_bottom?: number } } };
}

export function generateStaticParams() {
  return (Object.keys(BLOGS) as Blog[]).map((blog) => ({ blog }));
}

export async function generateMetadata({ params }: { params: Promise<{ blog: string }> }): Promise<Metadata> {
  const { blog } = await params;
  if (!isBlog(blog)) return {};
  const BLOG_SEO: Record<string, { title: string; description: string }> = { watch: { title: "Watch | Rep America", description: "Watch the latest political commentary, livestreams, interviews, and breaking news analysis from Rep America." } };
  const seo = BLOG_SEO[blog];
  return buildMetadata({ title: seo?.title ?? BLOGS[blog], description: seo?.description, path: `/blogs/${blog}`, shareKey: blog === "great-books" ? "great_books" : blog === "watch" ? "watch" : undefined });
}

export default async function BlogIndex({ params, searchParams }: { params: Promise<{ blog: string }>; searchParams: Promise<{ page?: string }> }) {
  const { blog } = await params;
  const { page: pageParam } = await searchParams;
  if (!isBlog(blog)) notFound();
  // templates/blog.watch.json exists alongside the default blog.json; fall back to the default template.
  const [allArticles, template] = await Promise.all([
    getArticles(blog, { desc: true }),
    getSetting<BlogTemplate>(`template:blog.${blog}`).catch(() => getSetting<BlogTemplate>("template:blog")),
  ]);
  // Shopify paginated the blog index 6 per page ({% paginate blog.articles by 6 %}).
  const PER_PAGE = 6;
  const pages = Math.max(1, Math.ceil(allArticles.length / PER_PAGE));
  const current = Math.min(pages, Math.max(1, parseInt(pageParam ?? "1", 10) || 1));
  const articles = allArticles.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const s = template.sections.main?.settings ?? {};
  const pt = s.padding_top ?? 36;
  const pb = s.padding_bottom ?? 36;
  const sectionId = "main-blog";
  const style = `
    .section-${sectionId}-padding { padding-top: ${Math.round(pt * 0.75)}px; padding-bottom: ${Math.round(pb * 0.75)}px; }
    @media screen and (min-width: 750px) { .section-${sectionId}-padding { padding-top: ${pt}px; padding-bottom: ${pb}px; } }
  `;
  return (
    <div id="shopify-section-main-blog" className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div className={`main-blog page-width section-${sectionId}-padding`}>
        <h1 className="title--primary">{BLOGS[blog]}</h1>
        <div className={`blog-articles${s.layout === "collage" ? " blog-articles--collage" : ""}`}>
          {articles.map((article) => (
            <div key={article.id} className="blog-articles__article article">
              <ArticleCard
                article={article}
                blog={blog}
                mediaHeight={s.image_height}
                mediaAspectRatio={article.image_width && article.image_height ? article.image_width / article.image_height : null}
                showImage={s.show_image ?? true}
                showDate={s.show_date ?? true}
                showAuthor={s.show_author ?? false}
                showExcerpt
              />
            </div>
          ))}
        </div>
        {pages > 1 && <WatchPagination basePath={`/blogs/${blog}`} current={current} pages={pages} />}
      </div>
    </div>
  );
}
