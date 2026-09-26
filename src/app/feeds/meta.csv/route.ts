// Meta Commerce Manager data feed (CSV, scheduled fetch). Columns follow Meta's required/recommended catalog fields.
import { getFeedItems, SHIPPING_USD } from "@/lib/feeds";

export const revalidate = 900;

const COLS = ["id", "title", "description", "availability", "condition", "price", "sale_price", "link", "image_link", "additional_image_link", "brand", "item_group_id", "product_type", "google_product_category", "shipping"] as const;
const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;

export async function GET() {
  const items = await getFeedItems();
  const rows = items.map((i) => [
    i.id, i.title, i.description, i.availability, i.condition, i.price, i.sale_price ?? "", i.link, i.image_link,
    i.additional_image_links.join(","), i.brand, i.item_group_id, i.product_type, "Apparel & Accessories > Clothing Accessories > Hats",
    `US::Standard:${SHIPPING_USD.toFixed(2)} USD`,
  ].map(cell).join(","));
  const csv = [COLS.join(","), ...rows].join("\r\n") + "\r\n";
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "cache-control": "public, max-age=900, s-maxage=900" } });
}
