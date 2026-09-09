/* Port of sections/main-404.liquid (templates/404.json). Strings: templates.404.* and general.continue_shopping. */
import type { Metadata } from "next";
import { SHOP_NAME } from "@/lib/seo";

export const metadata: Metadata = { title: `404 Not Found – ${SHOP_NAME}` };

const STYLE = `
  .template-404 .title + * { margin-top: 1rem; }
  @media screen and (min-width: 750px) { .template-404 .title + * { margin-top: 2rem; } }
`;

export default function NotFound() {
  return (
    <div id="shopify-section-main-404" className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div className="template-404 page-width page-margin center">
        <p>404</p>
        <h1 className="title">Page not found</h1>
        <a href="/collections/all" className="button">Continue shopping</a>
      </div>
    </div>
  );
}
