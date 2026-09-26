// Product feed rows shared by /feeds/meta.csv (Meta Commerce Manager → Instagram + Facebook Shops) and
// /feeds/google.xml (Google Merchant Center → YouTube Shopping). Replaces the product sync Shopify's channel apps did.
// Checkout stays on repamerica.com (Stripe); both platforms link out to the product page.
import { getProducts, type Product, type Variant } from "./data";

export const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://repamerica.com";
// Google taxonomy 173 = Apparel & Accessories > Clothing Accessories > Hats. Override per store with FEED_GOOGLE_CATEGORY.
export const GOOGLE_CATEGORY = process.env.FEED_GOOGLE_CATEGORY ?? "173";
// Same flat rate /api/checkout charges.
export const SHIPPING_USD = (Number.isFinite(Number(process.env.SHIPPING_FLAT_CENTS)) ? Math.max(0, Math.floor(Number(process.env.SHIPPING_FLAT_CENTS))) : 500) / 100;

export interface FeedItem {
  id: string;
  item_group_id: string;
  title: string;
  description: string;
  link: string;
  image_link: string;
  additional_image_links: string[];
  availability: "in stock" | "out of stock";
  price: string; // "49.99 USD"
  sale_price?: string;
  brand: string;
  product_type: string;
  condition: "new";
}

export function stripHtml(html: string | null): string {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

const usd = (cents: number) => `${(cents / 100).toFixed(2)} USD`;

function itemFor(p: Product, v: Variant): FeedItem {
  const images = [...(p.images ?? [])].sort((a, b) => a.position - b.position).map((i) => i.src);
  const main = v.image_src ?? images[0] ?? "";
  const isDefault = !v.title || v.title === "Default Title";
  const desc = stripHtml(p.body_html).slice(0, 5000) || p.title;
  const onSale = v.compare_at_cents != null && v.compare_at_cents > v.price_cents;
  return {
    id: `ra-${v.id}`,
    item_group_id: p.handle,
    title: isDefault ? p.title : `${p.title} - ${v.title}`,
    description: desc,
    link: `${SITE}/products/${p.handle}${isDefault ? "" : `?variant=${v.id}`}`,
    image_link: main,
    additional_image_links: images.filter((s) => s !== main).slice(0, 10),
    availability: v.available ? "in stock" : "out of stock",
    price: onSale ? usd(v.compare_at_cents!) : usd(v.price_cents),
    ...(onSale ? { sale_price: usd(v.price_cents) } : {}),
    brand: p.vendor || "Rep America",
    product_type: p.product_type || "Hats",
    condition: "new",
  };
}

export async function getFeedItems(): Promise<FeedItem[]> {
  const products = await getProducts();
  return products.flatMap((p) => (p.variants ?? []).filter((v) => v.price_cents > 0).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map((v) => itemFor(p, v)));
}
