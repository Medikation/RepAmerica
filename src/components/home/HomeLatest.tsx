import type { Article } from "@/lib/data";
import HomeLatestTabs, { type LatestTab } from "./HomeLatestTabs";
import { isBlank, str } from "./util";

export interface HomeLatestSettings {
  eyebrow?: string; heading?: string; text?: string; blog?: string; limit?: number; offset?: number;
  button_label?: string; button_link?: string;
  /** Round 82: category tabs, e.g. [{label:"All",category:null},{label:"Books",category:"Books"}]. Omit for the plain grid. */
  tabs?: LatestTab[];
}

/** Port of sections/home-latest.liquid. `articles` = the blog's articles newest-first; offset/limit applied here.
 *  `exclude` (Round 82) = article ids already shown in the hero, so the grid never doubles up. */
export default function HomeLatest({ id, settings, articles, exclude = [] }: { id: string; settings: HomeLatestSettings; articles: Article[]; exclude?: number[] }) {
  const offset = Number(settings.offset ?? 0);
  const limit = Number(settings.limit ?? 3);
  const pool = articles.filter((a) => !exclude.includes(a.id)).slice(offset);
  const tabs = settings.tabs ?? [];
  const hasButton = !isBlank(settings.button_label) && !isBlank(settings.button_link);

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: latestStyle(id) }} />
      <section className="ra-section ra-home-latest" id={`HomeLatest-${id}`}>
        <div className="ra-container">
          <div className="ra-section-header ra-section-header--row">
            <div>
              {!isBlank(settings.eyebrow) && <p className="ra-section-header__eyebrow">{settings.eyebrow}</p>}
              <h2 className="ra-section-header__title">{settings.heading}</h2>
              {!isBlank(settings.text) && <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: str(settings.text) }} />}
            </div>
            {hasButton && (
              <div className="ra-section-header__actions">
                <a href={settings.button_link} className="ra-text-link">{settings.button_label}</a>
              </div>
            )}
          </div>

          <HomeLatestTabs articles={pool.slice(0, Math.max(limit, 36))} tabs={tabs} limit={limit} />
        </div>
      </section>
    </section>
  );
}

function latestStyle(id: string): string {
  const S = `#HomeLatest-${id}`;
  return `
  ${S}.ra-section {
    padding-top: 56px;
    padding-bottom: 84px;
    background: #b01f2e;
  }
  ${S} .ra-section-header__eyebrow,
  ${S} .ra-video-card__category {
    color: #111;
  }
  ${S} .ra-section-header__title,
  ${S} .ra-video-card__title {
    color: #fff;
  }
  ${S} .ra-section-header__text,
  ${S} .ra-video-card__meta,
  ${S} .ra-empty {
    color: rgba(255, 255, 255, 0.78);
  }
  ${S} .ra-text-link {
    color: #fff;
  }
  ${S} .ra-video-card__body {
    padding-top: 8px;
  }
  ${S} .ra-video-card__category {
    margin-bottom: 3px;
  }
  ${S} .ra-video-card__title {
    margin-bottom: 3px;
  }
  ${S} .ra-section-header {
    margin-bottom: 52px;
  }
  ${S} .ra-section-header__title {
    font-size: clamp(44px, 5.9vw, 84px);
  }
  ${S} .ra-grid-3 {
    column-gap: 30px;
  }
  ${S} .ra-latest-tabs {
    display: flex; flex-wrap: wrap; gap: 8px;
    margin: -28px 0 28px;
  }
  ${S} .ra-latest-tabs__tab {
    padding: 8px 16px; border-radius: 999px; cursor: pointer;
    border: 1px solid rgba(255,255,255,.35); background: transparent; color: #fff;
    font-size: 12px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase;
    transition: background .15s ease, color .15s ease, border-color .15s ease;
  }
  ${S} .ra-latest-tabs__tab:hover { border-color: #fff; }
  ${S} .ra-latest-tabs__tab.is-active { background: #fff; color: #b01f2e; border-color: #fff; }
  @media screen and (max-width: 749px) {
    ${S}.ra-section {
      padding-top: 40px;
      padding-bottom: 56px;
    }
    ${S} .ra-section-header {
      margin-bottom: 32px;
    }
    ${S} .ra-latest-tabs { margin: -12px 0 22px; }
    ${S} .ra-section-header__title {
      font-size: clamp(38px, 10vw, 48px);
    }
  }
`;
}
