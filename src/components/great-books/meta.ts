import type { Article } from "@/lib/data";

/** `article.metafields.custom.X.value | default: article.metafields.custom.X` → `article.meta.X`, as a trimmed string ("" when blank). */
export function metaStr(article: Article, key: string): string {
  const v = article.meta?.[key];
  if (v === undefined || v === null || v === false) return "";
  return String(v).trim();
}

/** Works written in English carry "Original" in the translation metafield — the Liquid blanks it out. */
export function editionOf(article: Article): string {
  const t = metaStr(article, "translation");
  return t === "Original" ? "" : t;
}

export const articleUrl = (article: Article) => `/blogs/${article.blog}/${article.handle}`;

/** Articles of one list_category, in reading order (the input must already be ascending published_at). */
export function inCategory(articles: Article[], category: string): Article[] {
  return articles.filter((a) => metaStr(a, "list_category") === category);
}
