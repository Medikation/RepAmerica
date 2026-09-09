import type { Metadata } from "next";
import { getSetting } from "./data";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
export const SHOP_NAME = "Rep America";
export const SHOP_DESCRIPTION = "Political commentary, Medi's Great Books Project, and premium American-made products from Rep America with Medi.";

/** Mirrors snippets/meta-tags.liquid: title " – Rep America" suffix, og tags, per-page share image from theme settings. */
export async function buildMetadata(opts: {
  title?: string; description?: string | null; path: string; type?: "website" | "article" | "product";
  image?: string | null; shareKey?: "home" | "about" | "great_books" | "workshop" | "watch"; noSuffix?: boolean;
}): Promise<Metadata> {
  const theme = await getSetting<Record<string, string>>("theme");
  let image = opts.image ?? null;
  if (opts.shareKey === "watch") image = theme.share_image_watch_url;
  else if (opts.shareKey) image = theme[`share_image_${opts.shareKey}`] ?? image;
  image = image ?? theme.share_image_fallback;
  const title = opts.title ? (opts.noSuffix || /rep america/i.test(opts.title) ? opts.title : `${opts.title} – ${SHOP_NAME}`) : SHOP_NAME;
  const description = opts.description ?? SHOP_DESCRIPTION;
  const url = `${SITE}${opts.path}`;
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { siteName: SHOP_NAME, url, title: opts.title ?? SHOP_NAME, description, type: opts.type === "product" ? "website" : (opts.type ?? "website"), images: image ? [{ url: image }] : [] },
    twitter: { card: "summary_large_image", title: opts.title ?? SHOP_NAME, description, images: image ? [image] : [] },
  };
}
