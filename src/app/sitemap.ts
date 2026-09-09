import type { MetadataRoute } from "next";
import { getArticles, getCollections, getProducts, type Blog } from "@/lib/data";
import { supabase } from "@/lib/supabase";

export const revalidate = 300;

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
const BLOGS: Blog[] = ["watch", "great-books", "essentials"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [pages, products, collections, ...blogs] = await Promise.all([
    supabase.from("pages").select("handle").eq("is_published", true).then((r) => (r.data ?? []) as { handle: string }[]),
    getProducts(),
    getCollections(),
    ...BLOGS.map((b) => getArticles(b)),
  ]);

  const url = (path: string, extra: Partial<MetadataRoute.Sitemap[number]> = {}): MetadataRoute.Sitemap[number] => ({ url: `${SITE}${path}`, ...extra });

  return [
    url("/", { changeFrequency: "daily", priority: 1 }),
    url("/search", { changeFrequency: "monthly", priority: 0.3 }),
    ...pages.map((p) => url(`/pages/${p.handle}`, { changeFrequency: "monthly", priority: 0.7 })),
    ...BLOGS.map((b) => url(`/blogs/${b}`, { changeFrequency: "daily", priority: 0.8 })),
    ...blogs.flatMap((articles, i) =>
      articles.map((a) => url(`/blogs/${BLOGS[i]}/${a.handle}`, { lastModified: a.updated_at ?? a.published_at, changeFrequency: "weekly", priority: 0.6 })),
    ),
    ...collections.filter((c) => c.handle !== "frontpage").map((c) => url(`/collections/${c.handle}`, { changeFrequency: "weekly", priority: 0.5 })),
    ...products.map((p) => url(`/products/${p.handle}`, { changeFrequency: "weekly", priority: 0.6 })),
  ];
}
