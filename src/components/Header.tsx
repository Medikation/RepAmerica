/* Port of sections/announcement-bar.liquid + sections/header.liquid (+ snippets header-drawer,
 * header-dropdown-menu, header-search, social-icons). Markup mirrors ../reference/home.html.
 * Dropped Shopify-only features: customer account link, localization selectors, predictive search,
 * cart notification / count bubble. Behaviour (drawer, search modal, sticky header) lives in HeaderClient. */
import { getMenu, getSetting, type MenuItem } from "@/lib/data";
import { SHOP_NAME } from "@/lib/seo";
import HeaderClient from "./HeaderClient";
import {
  IconArrow, IconCaret, IconCartEmpty, IconClose, IconHamburger, IconReset, IconSearch, SocialIcons, SOCIAL_NETWORKS, hasSocialLinks,
  type SocialSettings,
} from "./icons";

declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "sticky-header": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { "data-sticky-type"?: string };
        "header-drawer": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { "data-breakpoint"?: string };
        "header-menu": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        "details-modal": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        "search-form": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
        "main-search": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
}

interface AnnouncementBlock { type: string; settings: { text?: string; link?: string } }
interface HeaderGroup {
  order: string[];
  sections: {
    "announcement-bar"?: {
      blocks?: Record<string, AnnouncementBlock>; block_order?: string[];
      settings: { color_scheme?: string; show_line_separator?: boolean; show_social?: boolean; enable_country_selector?: boolean; enable_language_selector?: boolean };
    };
    header?: {
      settings: {
        menu?: string; logo_position?: string; mobile_logo_position?: string; menu_type_desktop?: string; sticky_header_type?: string;
        show_line_separator?: boolean; color_scheme?: string; menu_color_scheme?: string; enable_country_selector?: boolean;
        enable_language_selector?: boolean; margin_bottom?: number; padding_top?: number; padding_bottom?: number;
      };
    };
  };
}
interface ThemeSettings extends SocialSettings {
  logo?: string; logo_alt?: string; logo_width?: number; logo_aspect_ratio?: number; inputs_shadow_vertical_offset?: number;
}

/** Shopify link handle: `link.handle` is the handleized title. */
const handleize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default async function Header() {
  const [group, theme] = await Promise.all([getSetting<HeaderGroup>("group:header-group"), getSetting<ThemeSettings>("theme")]);
  const bar = group.sections["announcement-bar"];
  const header = group.sections.header?.settings ?? {};
  const menu = header.menu ? await getMenu(header.menu) : [];
  const socialLinks = hasSocialLinks(theme);

  const logoWidth = theme.logo_width ?? 240;
  const logoAlt = theme.logo_alt || `${SHOP_NAME} logo, horizontal lockup`; // the file alt on Shopify
  const logoAspect = theme.logo_aspect_ratio ?? 6; // rep-america-logo-horizontal.png is 600x100

  /* ---------- announcement bar ---------- */
  const barSettings = bar?.settings ?? {};
  const blocks = (bar?.block_order ?? []).map((id) => bar!.blocks![id]).filter(Boolean);
  const showSocial = !!barSettings.show_social && socialLinks;
  const localizationSelector = !!(barSettings.enable_country_selector || barSettings.enable_language_selector);
  const utilityBarClass = [
    "utility-bar", `color-${barSettings.color_scheme ?? "scheme-1"}`, "gradient",
    barSettings.show_line_separator && blocks.length > 0 ? "utility-bar--bottom-border"
      : barSettings.show_line_separator && showSocial ? "utility-bar--bottom-border-social-only" : "",
    localizationSelector ? "header-localization" : "",
  ].filter(Boolean).join(" ");
  const gridClass = [
    "page-width utility-bar__grid",
    (blocks.length > 0 && localizationSelector) || showSocial ? "utility-bar__grid--3-col"
      : localizationSelector || showSocial ? "utility-bar__grid--2-col" : "",
  ].filter(Boolean).join(" ");

  /* ---------- header ---------- */
  const menuType = header.menu_type_desktop ?? "dropdown";
  const stickyType = header.sticky_header_type ?? "none";
  const paddingTop = header.padding_top ?? 20;
  const paddingBottom = header.padding_bottom ?? 20;
  const marginBottom = header.margin_bottom ?? 0;
  const localizationEnabled = !!(header.enable_country_selector || header.enable_language_selector);
  const headerClass = [
    "header", `header--${header.logo_position ?? "middle-left"}`, `header--mobile-${header.mobile_logo_position ?? "center"}`, "page-width",
    menuType === "drawer" ? "drawer-menu" : "", menu.length ? "header--has-menu" : "", socialLinks ? "header--has-social" : "",
  ].filter(Boolean).join(" ");

  const sectionStyle = `
  header-drawer {
    justify-self: start;
    margin-left: -1.2rem;
  }
  ${stickyType === "reduce-logo-size" ? `.scrolled-past-header .header__heading-logo-wrapper { width: 75%; }` : ""}
  ${menuType !== "drawer" ? `@media screen and (min-width: 990px) { header-drawer { display: none; } }` : ""}
  .menu-drawer-container { display: flex; }
  .list-menu { list-style: none; padding: 0; margin: 0; }
  .list-menu--inline { display: inline-flex; flex-wrap: wrap; }
  summary.list-menu__item { padding-right: 2.7rem; }
  .list-menu__item { display: flex; align-items: center; line-height: calc(1 + 0.3 / var(--font-body-scale)); }
  .list-menu__item--link { text-decoration: none; padding-bottom: 1rem; padding-top: 1rem; line-height: calc(1 + 0.8 / var(--font-body-scale)); }
  @media screen and (min-width: 750px) { .list-menu__item--link { padding-bottom: 0.5rem; padding-top: 0.5rem; } }
  .header { padding: ${Math.round(paddingTop * 0.5)}px 3rem ${Math.round(paddingBottom * 0.5)}px 3rem; }
  .section-header { position: sticky; margin-bottom: ${Math.round(marginBottom * 0.75)}px; }
  @media screen and (min-width: 750px) { .section-header { margin-bottom: ${marginBottom}px; } }
  @media screen and (min-width: 990px) { .header { padding-top: ${paddingTop}px; padding-bottom: ${paddingBottom}px; } }
  `;

  const logo = (
    <a href="/" className="header__heading-link link link--text focus-inset">
      {theme.logo ? (
        <div className="header__heading-logo-wrapper">
          <img
            src={theme.logo}
            alt={logoAlt}
            width={logoWidth}
            height={Math.round(logoWidth / logoAspect)}
            loading="eager"
            className="header__heading-logo motion-reduce"
            sizes={`(max-width: ${logoWidth * 2}px) 50vw, ${logoWidth}px`}
          />
        </div>
      ) : (
        <span className="h2">{SHOP_NAME}</span>
      )}
    </a>
  );

  const search = (inputId: string) => (
    <details-modal className="header__search">
      <details>
        <summary className="header__icon header__icon--search header__icon--summary link focus-inset modal__toggle" aria-haspopup="dialog" aria-label="Search">
          <span>
            <span className="svg-wrapper"><IconSearch /></span>
            <span className="svg-wrapper header__icon-close"><IconClose /></span>
          </span>
        </summary>
        <div className="search-modal modal__content gradient" role="dialog" aria-modal="true" aria-label="Search">
          <div className="modal-overlay"></div>
          <div className={`search-modal__content${(theme.inputs_shadow_vertical_offset ?? 0) < 0 ? " search-modal__content-top" : " search-modal__content-bottom"}`} tabIndex={-1}>
            <search-form className="search-modal__form">
              <form action="/search" method="get" role="search" className="search search-modal__form">
                <div className="field">
                  <input className="search__input field__input" id={inputId} type="search" name="q" defaultValue="" placeholder="Search" />
                  <label className="field__label" htmlFor={inputId}>Search</label>
                  <button type="reset" className="reset__button field__button hidden" aria-label="Clear search term">
                    <span className="svg-wrapper"><IconReset /></span>
                  </button>
                  <button className="search__button field__button" aria-label="Search">
                    <span className="svg-wrapper"><IconSearch /></span>
                  </button>
                </div>
              </form>
            </search-form>
            <button type="button" className="search-modal__close-button modal__close-button link link--text focus-inset" aria-label="Close">
              <span className="svg-wrapper"><IconClose /></span>
            </button>
          </div>
        </div>
      </details>
    </details-modal>
  );

  const HeaderTag = stickyType !== "none" ? "sticky-header" : "div";

  return (
    <>
      {bar && (
        <div id="shopify-section-announcement-bar" className="shopify-section shopify-section-group-header-group announcement-bar-section">
          <div className={utilityBarClass}>
            <div className={gridClass}>
              {showSocial && <SocialIcons theme={theme} />}
              {blocks.length === 1 && (
                <div className={`announcement-bar${barSettings.show_social ? " announcement-bar--one-announcement" : ""}`} role="region" aria-label="Announcement">
                  {blocks[0].settings.text && (blocks[0].settings.link ? (
                    <a href={blocks[0].settings.link} className="announcement-bar__link link link--text focus-inset animate-arrow">
                      <p className="announcement-bar__message h5"><span>{blocks[0].settings.text}</span><IconArrow /></p>
                    </a>
                  ) : (
                    <p className="announcement-bar__message h5"><span>{blocks[0].settings.text}</span></p>
                  ))}
                </div>
              )}
              {blocks.length > 1 && (
                /* The theme's <slideshow-component> carousel; rendered statically (no auto-rotate) as a stacked list. */
                <div className="announcement-bar" role="region" aria-roledescription="Carousel" aria-label="Announcement bar">
                  <div className="announcement-bar-slider slider-buttons">
                    <div className="grid grid--1-col slider slider--everywhere" id="Slider-announcement-bar" aria-live="polite" aria-atomic="true">
                      {blocks.map((block, i) => (
                        <div key={i} className="slideshow__slide slider__slide grid__item grid--1-col" id={`Slide-announcement-bar-${i + 1}`} role="group" aria-roledescription="Announcement" aria-label={`${i + 1} of ${blocks.length}`} tabIndex={-1}>
                          <div className="announcement-bar__announcement" role="region" aria-label="Announcement">
                            {block.settings.text && (block.settings.link ? (
                              <a href={block.settings.link} className="announcement-bar__link link link--text focus-inset animate-arrow">
                                <p className="announcement-bar__message h5"><span>{block.settings.text}</span><IconArrow /></p>
                              </a>
                            ) : (
                              <p className="announcement-bar__message h5"><span>{block.settings.text}</span></p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="localization-wrapper"></div>
            </div>
          </div>
        </div>
      )}

      <div id="shopify-section-header" className="shopify-section shopify-section-group-header-group section-header">
        <style dangerouslySetInnerHTML={{ __html: sectionStyle }} />
        <HeaderTag data-sticky-type={stickyType !== "none" ? stickyType : undefined} className={`header-wrapper color-${header.color_scheme ?? "scheme-1"} gradient${header.show_line_separator ? " header-wrapper--border-bottom" : ""}`}>
          <header className={headerClass}>
            {menu.length > 0 && (
              <header-drawer data-breakpoint={menuType === "drawer" ? "desktop" : "tablet"}>
                <details id="Details-menu-drawer-container" className="menu-drawer-container">
                  <summary className="header__icon header__icon--menu header__icon--summary link focus-inset" aria-label="Menu">
                    <span><IconHamburger /><IconClose /></span>
                  </summary>
                  <div id="menu-drawer" className={`gradient menu-drawer motion-reduce color-${header.menu_color_scheme ?? "scheme-1"}`}>
                    <div className="menu-drawer__inner-container">
                      <div className="menu-drawer__navigation-container">
                        <nav className="menu-drawer__navigation">
                          <ul className="menu-drawer__menu has-submenu list-menu" role="list">
                            {menu.map((link, i) => <DrawerItem key={i} link={link} index={i + 1} />)}
                          </ul>
                        </nav>
                        <div className="menu-drawer__utility-links">
                          {socialLinks && <DrawerSocial theme={theme} />}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              </header-drawer>
            )}

            {(header.logo_position === "top-center" || menu.length === 0) && search("Search-In-Modal-1")}

            {header.logo_position !== "middle-center" && logo}

            {menu.length > 0 && menuType !== "drawer" && (
              <nav className="header__inline-menu">
                <ul className="list-menu list-menu--inline" role="list">
                  {menu.map((link, i) => <InlineItem key={i} link={link} index={i + 1} menuColorScheme={header.menu_color_scheme ?? "scheme-1"} />)}
                </ul>
              </nav>
            )}

            {header.logo_position === "middle-center" && logo}

            <div className={`header__icons${localizationEnabled ? " header__icons--localization header-localization" : ""}`}>
              <div className="desktop-localization-wrapper"></div>
              {search("Search-In-Modal")}
              <a href="/pages/shop" className="header__icon header__icon--cart link focus-inset" id="cart-icon-bubble">
                <span className="svg-wrapper"><IconCartEmpty /></span>
                <span className="visually-hidden">Cart</span>
              </a>
            </div>
          </header>
        </HeaderTag>
        <HeaderClient stickyType={stickyType} />
      </div>
    </>
  );
}

/* ---------- snippets/header-drawer.liquid items ---------- */
function DrawerItem({ link, index, parent }: { link: MenuItem; index: number; parent?: string }) {
  const handle = handleize(link.title);
  const idBase = parent ? `${parent}-${handle}` : handle;
  if (!link.items?.length) {
    return (
      <li>
        <a id={`HeaderDrawer-${idBase}`} href={link.url} className="menu-drawer__menu-item list-menu__item link link--text focus-inset">
          {link.title}
        </a>
      </li>
    );
  }
  return (
    <li>
      <details id={parent ? `Details-menu-drawer-${idBase}` : `Details-menu-drawer-menu-item-${index}`}>
        <summary id={`HeaderDrawer-${idBase}`} className="menu-drawer__menu-item list-menu__item link link--text focus-inset">
          {link.title}
          <span className="svg-wrapper"><IconArrow /></span>
          <span className="svg-wrapper"><IconCaret /></span>
        </summary>
        <div id={`${parent ? "childlink" : "link"}-${handle}`} className="menu-drawer__submenu has-submenu gradient motion-reduce" tabIndex={-1}>
          <div className="menu-drawer__inner-submenu">
            <button className="menu-drawer__close-button link link--text focus-inset" aria-expanded="true">
              <span className="svg-wrapper"><IconArrow /></span>
              {link.title}
            </button>
            <ul className="menu-drawer__menu list-menu" role="list" tabIndex={-1}>
              {link.items.map((child, i) => <DrawerItem key={i} link={child} index={i + 1} parent={idBase} />)}
            </ul>
          </div>
        </div>
      </details>
    </li>
  );
}

/** The drawer's own social list (different order + class order than snippets/social-icons.liquid). */
function DrawerSocial({ theme }: { theme: SocialSettings }) {
  const order: (keyof SocialSettings)[] = [
    "social_twitter_link", "social_facebook_link", "social_pinterest_link", "social_instagram_link", "social_tiktok_link",
    "social_tumblr_link", "social_snapchat_link", "social_youtube_link", "social_vimeo_link",
  ];
  return (
    <ul className="list list-social list-unstyled" role="list">
      {order.filter((k) => !!theme[k]).map((k) => {
        const net = SOCIAL_LOOKUP[k];
        return (
          <li key={k} className="list-social__item">
            <a href={theme[k]} className="list-social__link link">
              <span className="svg-wrapper"><net.Icon /></span>
              <span className="visually-hidden">{net.label}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
const SOCIAL_LOOKUP = Object.fromEntries(SOCIAL_NETWORKS.map((n) => [n.key, n])) as Record<keyof SocialSettings, (typeof SOCIAL_NETWORKS)[number]>;

/* ---------- snippets/header-dropdown-menu.liquid items ---------- */
function InlineItem({ link, index, menuColorScheme }: { link: MenuItem; index: number; menuColorScheme: string }) {
  const handle = handleize(link.title);
  if (!link.items?.length) {
    return (
      <li>
        <a id={`HeaderMenu-${handle}`} href={link.url} className="header__menu-item list-menu__item link link--text focus-inset">
          <span>{link.title}</span>
        </a>
      </li>
    );
  }
  return (
    <li>
      <header-menu>
        <details id={`Details-HeaderMenu-${index}`}>
          <summary id={`HeaderMenu-${handle}`} className="header__menu-item list-menu__item link focus-inset">
            <span>{link.title}</span>
            <IconCaret />
          </summary>
          <ul id={`HeaderMenu-MenuList-${index}`} className={`header__submenu list-menu list-menu--disclosure color-${menuColorScheme} gradient caption-large motion-reduce global-settings-popup`} role="list" tabIndex={-1}>
            {link.items.map((child, i) => {
              const childHandle = handleize(child.title);
              return (
                <li key={i}>
                  {!child.items?.length ? (
                    <a id={`HeaderMenu-${handle}-${childHandle}`} href={child.url} className="header__menu-item list-menu__item link link--text focus-inset caption-large">
                      {child.title}
                    </a>
                  ) : (
                    <details id={`Details-HeaderSubMenu-${handle}-${childHandle}`}>
                      <summary id={`HeaderMenu-${handle}-${childHandle}`} className="header__menu-item link link--text list-menu__item focus-inset caption-large">
                        <span>{child.title}</span>
                        <IconCaret />
                      </summary>
                      <ul id={`HeaderMenu-SubMenuList-${handle}-${childHandle}`} className="header__submenu list-menu motion-reduce">
                        {child.items.map((g, j) => (
                          <li key={j}>
                            <a id={`HeaderMenu-${handle}-${childHandle}-${handleize(g.title)}`} href={g.url} className="header__menu-item list-menu__item link link--text focus-inset caption-large">
                              {g.title}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      </header-menu>
    </li>
  );
}
