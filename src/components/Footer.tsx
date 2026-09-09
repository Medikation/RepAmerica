/* Port of sections/footer.liquid (group:footer-group). Markup mirrors ../reference/home.html.
 * Dropped: payment-icon list (Shopify `shop.enabled_payment_types`), "Powered by Shopify", localization selectors,
 * follow-on-shop, brand_information/image blocks (none configured). `shop.policies` → the data-sharing-opt-out page. */
import { getMenu, getPage, getSetting } from "@/lib/data";
import { SHOP_NAME } from "@/lib/seo";
import NewsletterForm from "./NewsletterForm";
import { SocialIcons, hasSocialLinks, type SocialSettings } from "./icons";

interface FooterBlock { type: string; settings: { heading?: string; subtext?: string; menu?: string; show_social?: boolean } }
interface FooterGroup {
  sections: {
    footer?: {
      blocks?: Record<string, FooterBlock>; block_order?: string[];
      settings: {
        color_scheme?: string; newsletter_enable?: boolean; newsletter_heading?: string; show_social?: boolean; payment_enable?: boolean;
        show_policy?: boolean; margin_top?: number; padding_top?: number; padding_bottom?: number; statement_line_1?: string; statement_line_2?: string;
        enable_country_selector?: boolean; enable_language_selector?: boolean;
      };
    };
  };
}

const SECTION_ID = "footer";

const FOOTER_STYLE = (s: { margin_top: number; padding_top: number; padding_bottom: number }) => `
  .footer { margin-top: ${Math.round(s.margin_top * 0.75)}px; }
  .section-${SECTION_ID}-padding { padding-top: ${Math.round(s.padding_top * 0.75)}px; padding-bottom: ${Math.round(s.padding_bottom * 0.75)}px; }
  @media screen and (min-width: 750px) {
    .footer { margin-top: ${s.margin_top}px; }
    .section-${SECTION_ID}-padding { padding-top: ${s.padding_top}px; padding-bottom: ${s.padding_bottom}px; }
  }

  /* --- Brand statement --- */
  .ra-footer-statement { padding: 0; text-align: center; }
  .ra-footer-statement__line {
    margin: 0; font-family: var(--font-heading-family, Georgia, serif); font-size: clamp(30px, 3.4vw, 52px);
    font-weight: var(--font-heading-weight, 700); line-height: 1.08; letter-spacing: -0.02em; color: var(--ra-color-ink, #111);
  }
  .ra-footer-statement__signature {
    margin: 14px 0 0; font-family: var(--font-heading-family, Georgia, serif); font-size: clamp(19px, 1.9vw, 27px);
    font-weight: var(--font-heading-weight, 700); line-height: 1.2; letter-spacing: -0.01em; color: var(--ra-color-muted, #5f6368);
  }
  .ra-footer-statement__rule { display: block; width: 84px; height: 2px; margin: 20px auto 0; background: #c62436; }

  /* --- Everything below the statement: one centred column --- */
  .footer__content-top { display: flex; flex-direction: column; align-items: center; gap: 52px; padding-top: 24px; padding-bottom: 8px; text-align: center; }
  .footer__content-top .footer__blocks-wrapper { display: block; width: 100%; margin: 0; }
  .footer__content-top .footer-block { width: 100%; text-align: center; }
  .footer-block--newsletter { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 460px; margin: 0 auto; }
  .footer-block__newsletter { width: 100%; }
  .footer .footer-block--newsletter .footer__newsletter,
  .footer .footer-block__newsletter .footer__newsletter { justify-content: center; margin-left: auto; margin-right: auto; }
  .footer-block__details-content a { white-space: nowrap; }
  .footer__list-social { flex-wrap: wrap; }
  .footer .footer-block--newsletter,
  .footer .footer-block__newsletter,
  .footer .footer-block__newsletter .footer-block__heading { text-align: center; }
  .footer-block__newsletter .footer-block__heading { margin-bottom: 18px; font-family: var(--font-heading-family, Georgia, serif); font-size: 22px; letter-spacing: -0.01em; }
  .footer__list-social { justify-content: center; gap: 14px; margin-top: 44px; }
  .footer__content-bottom { padding-top: 20px; }
  .footer__content-bottom-wrapper { flex-direction: column; align-items: center; gap: 24px; text-align: center; }
  .footer__column { justify-content: center; text-align: center; }
  .footer__payment { margin-top: 0; }
  .footer__copyright { margin-top: 0; }
  @media screen and (max-width: 749px) {
    .ra-footer-statement__rule { margin-top: 16px; }
    .footer__content-top { gap: 40px; padding-top: 18px; padding-bottom: 0; }
    .footer__list-social { margin-top: 20px; }
    .footer__content-bottom { padding-top: 14px; }
  }
`;

export default async function Footer() {
  const [group, theme] = await Promise.all([getSetting<FooterGroup>("group:footer-group"), getSetting<SocialSettings>("theme")]);
  const footer = group.sections.footer;
  const s = footer?.settings ?? {};
  const blocks = (footer?.block_order ?? []).map((id) => ({ id, ...footer!.blocks![id] })).filter((b) => b.type);
  const hasSocial = hasSocialLinks(theme);
  const showSocial = !!s.show_social && hasSocial;

  // Shopify `shop.policies` had no Next.js equivalent; the only policy page we keep is the CCPA opt-out page.
  const policyPage = s.show_policy ? await getPage("data-sharing-opt-out") : null;

  // link_list blocks reference a menu handle (none configured today, but supported like the Liquid).
  const menus = await Promise.all(blocks.map((b) => (b.type === "link_list" && b.settings.menu ? getMenu(b.settings.menu) : Promise.resolve([]))));

  const gridClass = blocks.length === 9 ? "grid--3-col-tablet" : blocks.length > 6 ? "grid--4-col-desktop" : blocks.length > 4 ? "grid--3-col-tablet" : "";
  const year = new Date().getFullYear();
  const showContentTop = blocks.length > 0 || s.newsletter_enable || showSocial;

  return (
    <div id="shopify-section-footer" className="shopify-section shopify-section-group-footer-group">
      <style dangerouslySetInnerHTML={{ __html: FOOTER_STYLE({ margin_top: s.margin_top ?? 0, padding_top: s.padding_top ?? 40, padding_bottom: s.padding_bottom ?? 56 }) }} />
      <footer className={`footer color-${s.color_scheme ?? "scheme-1"} gradient section-${SECTION_ID}-padding`}>
        {(s.statement_line_1 || s.statement_line_2) && (
          <div className="ra-footer-statement page-width">
            {s.statement_line_1 && <p className="ra-footer-statement__line">{s.statement_line_1}</p>}
            {s.statement_line_2 && <p className="ra-footer-statement__signature">{s.statement_line_2}</p>}
            <span className="ra-footer-statement__rule" aria-hidden="true"></span>
          </div>
        )}

        {showContentTop && (
          <div className="footer__content-top page-width">
            {blocks.length > 0 && (
              <div className={`footer__blocks-wrapper grid grid--1-col grid--2-col grid--4-col-tablet ${gridClass}`}>
                {blocks.map((block, i) => (
                  <div key={block.id} className={`footer-block grid__item${block.type === "link_list" ? " footer-block--menu" : ""}`}>
                    {block.settings.heading && <h2 className="footer-block__heading inline-richtext" dangerouslySetInnerHTML={{ __html: block.settings.heading }} />}
                    {block.type === "text" && (
                      <div className="footer-block__details-content rte" dangerouslySetInnerHTML={{ __html: block.settings.subtext ?? "" }} />
                    )}
                    {block.type === "link_list" && menus[i].length > 0 && (
                      <ul className="footer-block__details-content list-unstyled">
                        {menus[i].map((link) => (
                          <li key={link.url}>
                            <a href={link.url} className="link link--text list-menu__item list-menu__item--link">{link.title}</a>
                          </li>
                        ))}
                      </ul>
                    )}
                    {block.type === "brand_information" && block.settings.show_social && hasSocial && (
                      <div className="footer-block__brand-info"><SocialIcons theme={theme} className="footer__list-social" /></div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="footer-block--newsletter">
              {s.newsletter_enable && (
                <div className="footer-block__newsletter">
                  {s.newsletter_heading && <h2 className="footer-block__heading inline-richtext" dangerouslySetInnerHTML={{ __html: s.newsletter_heading }} />}
                  <NewsletterForm sectionId={SECTION_ID} />
                </div>
              )}
              {showSocial && <SocialIcons theme={theme} className="footer__list-social" />}
            </div>
          </div>
        )}

        <div className="footer__content-bottom">
          <div className="footer__content-bottom-wrapper page-width">
            <div className="footer__column footer__localization isolate"></div>
            <div className="footer__column footer__column--info"></div>
          </div>
          <div className={`footer__content-bottom-wrapper page-width${!s.enable_country_selector && !s.enable_language_selector ? " footer__content-bottom-wrapper--center" : ""}`}>
            <div className="footer__copyright caption">
              <small className="copyright__content">&copy; {year}, <a href="/" title="">{SHOP_NAME}</a></small>
              {policyPage && (
                <ul className="policies list-unstyled">
                  <li>
                    <small className="copyright__content"><a href={`/pages/${policyPage.handle}`}>{policyPage.title}</a></small>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
