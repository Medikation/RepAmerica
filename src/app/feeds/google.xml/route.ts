// Google Merchant Center feed (RSS 2.0 + g: namespace, scheduled fetch). Merchant Center is what YouTube Shopping reads.
import { getFeedItems, GOOGLE_CATEGORY, SHIPPING_USD, SITE } from "@/lib/feeds";

export const revalidate = 900;

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const items = await getFeedItems();
  const entries = items.map((i) => `  <item>
    <g:id>${x(i.id)}</g:id>
    <g:item_group_id>${x(i.item_group_id)}</g:item_group_id>
    <g:title>${x(i.title)}</g:title>
    <g:description>${x(i.description)}</g:description>
    <g:link>${x(i.link)}</g:link>
    <g:image_link>${x(i.image_link)}</g:image_link>
${i.additional_image_links.map((s) => `    <g:additional_image_link>${x(s)}</g:additional_image_link>`).join("\n")}
    <g:availability>${i.availability}</g:availability>
    <g:price>${i.price}</g:price>
${i.sale_price ? `    <g:sale_price>${i.sale_price}</g:sale_price>\n` : ""}    <g:brand>${x(i.brand)}</g:brand>
    <g:condition>${i.condition}</g:condition>
    <g:identifier_exists>no</g:identifier_exists>
    <g:google_product_category>${GOOGLE_CATEGORY}</g:google_product_category>
    <g:product_type>${x(i.product_type)}</g:product_type>
    <g:age_group>adult</g:age_group>
    <g:gender>unisex</g:gender>
    <g:shipping>
      <g:country>US</g:country>
      <g:service>Standard</g:service>
      <g:price>${SHIPPING_USD.toFixed(2)} USD</g:price>
    </g:shipping>
  </item>`).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Rep America</title>
  <link>${SITE}</link>
  <description>Made-in-USA hats from Rep America.</description>
${entries}
</channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=900, s-maxage=900" } });
}
