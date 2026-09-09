import { cache } from "react";
import { supabase } from "./supabase";

export type Blog = "watch" | "great-books" | "essentials";

export interface Article {
  id: number;
  shopify_id: number;
  blog: Blog;
  handle: string;
  title: string;
  author: string | null;
  summary: string | null;
  body_html: string | null;
  image_url: string | null;
  image_alt: string | null;
  image_width: number | null;
  image_height: number | null;
  tags: string[];
  is_published: boolean;
  published_at: string;
  seo_title: string | null;
  seo_description: string | null;
  /** All custom.* Shopify metafields. Watch: youtube_url, category, duration, youtube_video_id.
   *  Great Books: author, translation, written_display, year_sort, affiliate_url, list_category, reading_time, difficulty,
   *  influences, original_language, genre, historical_period, best_for, influenced_by, influenced.
   *  Essentials: essentials_category, link_label, link_url, feature_on_home. */
  meta: Record<string, string | number | boolean | undefined>;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: number; handle: string; title: string; body_html: string | null; template: string | null;
  is_published: boolean; seo_title: string | null; seo_description: string | null; meta: Record<string, unknown>;
}

export interface ProductImage { id: number; src: string; alt: string | null; width: number; height: number; position: number }
export interface Product {
  id: number; shopify_id: number; handle: string; title: string; body_html: string | null; vendor: string | null;
  product_type: string | null; tags: string[]; options: { name: string; position: number; values: string[] }[];
  images: ProductImage[]; is_published: boolean; variants?: Variant[];
}
export interface Variant {
  id: number; shopify_id: number; product_id: number; title: string | null; sku: string | null; price_cents: number;
  compare_at_cents: number | null; option1: string | null; option2: string | null; option3: string | null;
  available: boolean; image_src: string | null; stripe_price_id: string | null; position: number;
}
export interface Collection { id: number; handle: string; title: string; body_html: string | null; image_url: string | null; product_handles: string[] }

const ARTICLE_LIST_COLS = "id,shopify_id,blog,handle,title,author,summary,image_url,image_alt,image_width,image_height,tags,is_published,published_at,seo_title,seo_description,meta,created_at,updated_at";

/** All published articles of a blog in READING ORDER (ascending published_at) — the order the Shopify theme used via `| reverse`. */
export const getArticles = cache(async (blog: Blog, opts: { withBody?: boolean; desc?: boolean } = {}): Promise<Article[]> => {
  const { data, error } = await supabase
    .from("articles")
    .select(opts.withBody ? "*" : ARTICLE_LIST_COLS)
    .eq("blog", blog)
    .eq("is_published", true)
    .order("published_at", { ascending: !opts.desc })
    .range(0, 2000);
  if (error) throw error;
  return (data ?? []) as unknown as Article[];
});

export const getArticle = cache(async (blog: Blog, handle: string): Promise<Article | null> => {
  const { data } = await supabase.from("articles").select("*").eq("blog", blog).eq("handle", handle).eq("is_published", true).maybeSingle();
  return (data as Article | null) ?? null;
});

export const getPage = cache(async (handle: string): Promise<Page | null> => {
  const { data } = await supabase.from("pages").select("*").eq("handle", handle).eq("is_published", true).maybeSingle();
  return (data as Page | null) ?? null;
});

export const getProducts = cache(async (): Promise<Product[]> => {
  const { data, error } = await supabase.from("products").select("*, variants:product_variants(*)").eq("is_published", true).order("id");
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, variants: [...(p.variants ?? [])].sort((a: Variant, b: Variant) => a.position - b.position) })) as Product[];
});

export const getProduct = cache(async (handle: string): Promise<Product | null> => {
  const { data } = await supabase.from("products").select("*, variants:product_variants(*)").eq("handle", handle).eq("is_published", true).maybeSingle();
  if (!data) return null;
  return { ...data, variants: [...(data.variants ?? [])].sort((a: Variant, b: Variant) => a.position - b.position) } as Product;
});

export const getCollections = cache(async (): Promise<Collection[]> => {
  const { data } = await supabase.from("collections").select("*").order("id");
  return (data ?? []) as Collection[];
});
export const getCollection = cache(async (handle: string): Promise<(Collection & { products: Product[] }) | null> => {
  const { data } = await supabase.from("collections").select("*").eq("handle", handle).maybeSingle();
  if (!data) return null;
  const all = await getProducts();
  const handles: string[] = handle === "all" ? all.map((p) => p.handle) : data.product_handles;
  const products = handles.map((h) => all.find((p) => p.handle === h)).filter(Boolean) as Product[];
  return { ...(data as Collection), products };
});

/** Theme settings and template/section settings exactly as exported from Shopify (image refs already rewritten to storage URLs).
 *  keys: "theme", "template:index", "template:page.about", "group:header-group", "group:footer-group", "menus", "shop", ... */
export const getSetting = cache(async <T = Record<string, unknown>>(key: string): Promise<T> => {
  const { data, error } = await supabase.from("settings").select("value").eq("key", key).single();
  if (error) throw new Error(`setting ${key}: ${error.message}`);
  return data.value as T;
});

export interface MenuItem { title: string; url: string; type?: string; items: MenuItem[] }
export const getMenu = cache(async (handle: string): Promise<MenuItem[]> => {
  const menus = await getSetting<{ handle: string; items: MenuItem[] }[]>("menus");
  return menus.find((m) => m.handle === handle)?.items ?? [];
});

export const getRedirects = cache(async (): Promise<{ path: string; target: string }[]> => {
  const { data } = await supabase.from("redirects").select("*");
  return data ?? [];
});

/** Helper: the sections of a template in their declared order. */
export function orderedSections<T = Record<string, unknown>>(template: { sections: Record<string, T>; order: string[] }): { id: string; section: T }[] {
  return template.order.map((id) => ({ id, section: template.sections[id] }));
}

export const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
