import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticle, getArticles, getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import GreatBooksArticle, { type GreatBooksArticleSettings } from "@/components/great-books/GreatBooksArticle";

export const revalidate = 300;

interface Params {
  handle: string;
}

interface ArticleTemplate {
  sections: Record<string, { type: string; settings: GreatBooksArticleSettings }>;
  order: string[];
}

export async function generateStaticParams(): Promise<Params[]> {
  const articles = await getArticles("great-books");
  return articles.map((a) => ({ handle: a.handle }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { handle } = await params;
  const article = await getArticle("great-books", handle);
  if (!article) return {};
  // Every guide carries its own seo_title (already ending in "| Rep America"), so no " – Rep America" suffix is added.
  return buildMetadata({
    title: article.seo_title || article.title,
    noSuffix: Boolean(article.seo_title),
    description: article.seo_description ?? article.summary?.replace(/<[^>]+>/g, "") ?? null,
    path: `/blogs/great-books/${article.handle}`,
    type: "article",
    image: article.image_url,
  });
}

/** Port of templates/article.great-books.json → sections/great-books-article.liquid. */
export default async function GreatBooksArticlePage({ params }: { params: Promise<Params> }) {
  const { handle } = await params;
  const [article, all, template] = await Promise.all([
    getArticle("great-books", handle),
    getArticles("great-books"),
    getSetting<ArticleTemplate>("template:article.great-books"),
  ]);
  if (!article) notFound();

  const main = template.order.map((id) => template.sections[id]).find((s) => s?.type === "great-books-article");
  const sectionId = "template--article-great-books__main";

  return (
    <section id={`shopify-section-${sectionId}`} className="shopify-section">
      <GreatBooksArticle article={article} all={all} settings={main?.settings ?? {}} />
    </section>
  );
}
