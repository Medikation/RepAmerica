import { getArticles, getCollection } from "@/lib/data";
import { isBlank, str } from "./util";

export interface WorkshopCardSettings {
  heading?: string; link?: string; button_label?: string; image?: string; collection?: string; blog?: string; category?: string;
}
export interface HomeWorkshopIntroSettings {
  eyebrow?: string; heading?: string; button_label?: string; button_link?: string; banner_height?: number;
}
export interface HomeWorkshopIntroSection {
  settings: HomeWorkshopIntroSettings;
  blocks?: Record<string, { type: string; settings: WorkshopCardSettings }>;
  block_order?: string[];
}

/** Card image resolution, as in the Liquid: explicit image > collection's first product > featured essentials article > newest in category. */
async function resolveCardImage(b: WorkshopCardSettings): Promise<string> {
  if (!isBlank(b.image)) return str(b.image);
  if (!isBlank(b.collection)) {
    const col = await getCollection(str(b.collection));
    const first = col?.products[0];
    const img = first?.images?.[0]?.src;
    if (img) return img;
  }
  if (!isBlank(b.blog) && !isBlank(b.category)) {
    const blog = str(b.blog);
    if (blog === "watch" || blog === "great-books" || blog === "essentials") {
      const articles = await getArticles(blog, { desc: true });
      const inCat = articles.filter((a) => str(a.meta?.essentials_category) === b.category && a.image_url);
      const featured = inCat.find((a) => a.meta?.feature_on_home === true || a.meta?.feature_on_home === "true");
      const pick = featured ?? inCat[0];
      if (pick?.image_url) return pick.image_url;
    }
  }
  return "";
}

/** Port of sections/home-workshop-intro.liquid. */
export default async function HomeWorkshopIntro({ id, section }: { id: string; section: HomeWorkshopIntroSection }) {
  const s = section.settings;
  const order = section.block_order ?? Object.keys(section.blocks ?? {});
  const cards = await Promise.all(
    order.map(async (bid) => {
      const b = section.blocks?.[bid]?.settings ?? {};
      return { bid, b, image: await resolveCardImage(b) };
    }),
  );
  const hasButton = !isBlank(s.button_label) && !isBlank(s.button_link);

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section className="ra-section ra-workshop-intro" id={`WorkshopIntro-${id}`}>
        <div className="ra-workshop-intro__cards">
          {cards.map(({ bid, b, image }) => (
            <article className="ra-workshop-intro__card" key={bid}>
              <a className="ra-workshop-intro__card-media" href={b.link} tabIndex={-1} aria-hidden="true">
                {image && (
                  <img src={image} alt="" loading="lazy" className="ra-workshop-intro__card-image" sizes="(max-width: 749px) 30vw, 22vw" width={800} height={800} />
                )}
              </a>
              {!isBlank(b.heading) && (
                <h3 className="ra-workshop-intro__card-title">
                  <a className="ra-workshop-intro__card-button" href={b.link}>{b.heading}</a>
                </h3>
              )}
            </article>
          ))}
        </div>

        <div className="ra-workshop-intro__panel">
          <div className="ra-workshop-intro__panel-inner">
            {!isBlank(s.eyebrow) && <p className="ra-workshop-intro__eyebrow">{s.eyebrow}</p>}
            {!isBlank(s.heading) && <h2 className="ra-workshop-intro__heading" dangerouslySetInnerHTML={{ __html: str(s.heading) }} />}
            <span className="ra-workshop-intro__rule" aria-hidden="true"></span>
            {hasButton && (
              <a className="ra-workshop-intro__button" href={s.button_link}>
                <span>{s.button_label}</span>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path d="M4 12h15m-5.5-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: workshopStyle(id, s) }} />
    </section>
  );
}

function workshopStyle(id: string, s: HomeWorkshopIntroSettings): string {
  const root = `#WorkshopIntro-${id}.ra-workshop-intro`;
  return `
  ${root} {
    display: grid;
    grid-template-columns: 70% 30%;
    align-items: stretch;
    width: 100%;
    max-width: none;
    min-height: ${Number(s.banner_height ?? 490)}px;
    padding: 0;
    margin-top: var(--ra-space-lg);
    overflow: hidden;
    background: #fff;
  }
  .ra-workshop-intro__cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
    align-items: stretch;
    align-content: center;
    padding: 56px
      max(24px, min(calc((100% / 0.7 - 1280px) / 2), calc((100% - 800px) / 2)));
    background: #fff;
  }
  .ra-workshop-intro__card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .ra-workshop-intro__card-media {
    display: block;
    width: 100%;
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }
  .ra-workshop-intro__card-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .ra-workshop-intro__card-title {
    margin: 26px 0 0;
    font-size: 0;
    line-height: 0;
  }
  .ra-workshop-intro__card-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 14px 22px;
    border: 1px solid rgba(0, 0, 0, 0.25);
    color: #0e0e0f;
    font-family: var(--font-body-family, inherit);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    line-height: 1.2;
    text-transform: uppercase;
    text-decoration: none;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .ra-workshop-intro__card-button:hover,
  .ra-workshop-intro__card-button:focus-visible {
    background: #c62436;
    border-color: #c62436;
    color: #fff;
  }
  .ra-workshop-intro__panel {
    display: flex;
    align-items: center;
    color: #0e0e0f;
  }
  .ra-workshop-intro__panel-inner {
    width: 100%;
    padding: 56px
      max(24px, min(calc((100% / 0.3 - 1280px) / 2), calc(100% - 340px)))
      56px 0;
  }
  .ra-workshop-intro__eyebrow {
    margin: 0 0 36px;
    color: #c62436;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2em;
    line-height: 1;
    text-transform: uppercase;
  }
  .ra-workshop-intro__heading {
    margin: 0;
    color: #0e0e0f;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(44px, 3.9vw, 64px);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1.08;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }
  .ra-workshop-intro__rule {
    display: block;
    width: 72px;
    height: 2px;
    margin: 34px 0;
    background: #c62436;
  }
  .ra-workshop-intro__button {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 17px 30px;
    border: 1px solid rgba(0, 0, 0, 0.28);
    color: #0e0e0f;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  }
  .ra-workshop-intro__button:hover,
  .ra-workshop-intro__button:focus-visible {
    background: #c62436;
    border-color: #c62436;
    color: #fff;
  }
  @media screen and (max-width: 989px) {
    ${root} {
      grid-template-columns: 66% 34%;
    }
    .ra-workshop-intro__cards {
      gap: 18px;
      padding: 44px 0 44px 24px;
    }
    .ra-workshop-intro__panel-inner {
      max-width: none;
      padding: 44px 24px 44px 28px;
    }
    .ra-workshop-intro__card-title {
      margin-top: 20px;
    }
    .ra-workshop-intro__card-button {
      padding: 12px 14px;
      font-size: 10px;
    }
  }
  @media screen and (max-width: 749px) {
    ${root} {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto;
      min-height: 0;
      padding: 30px 0 34px;
      margin-top: var(--ra-space-xl);
      text-align: center;
    }
    .ra-workshop-intro__panel,
    .ra-workshop-intro__panel-inner {
      display: contents;
    }
    .ra-workshop-intro__eyebrow {
      grid-row: 1;
      margin: 0 20px 34px;
      font-size: 11px;
      letter-spacing: 0.18em;
    }
    .ra-workshop-intro__heading {
      grid-row: 2;
      margin: 0 12px 4px;
      font-size: clamp(21px, 7.4vw, 33px);
      line-height: 1.2;
      white-space: nowrap;
    }
    .ra-workshop-intro__rule {
      display: none;
    }
    .ra-workshop-intro__cards {
      grid-row: 3;
      gap: 10px;
      padding: 16px 14px 32px;
    }
    .ra-workshop-intro__card-title {
      margin: 14px 0 0;
      width: 100%;
    }
    .ra-workshop-intro__card-button {
      padding: 10px 6px;
      width: 100%;
      justify-content: center;
      font-size: 9px;
      letter-spacing: 0.05em;
    }
    .ra-workshop-intro__button {
      grid-row: 4;
      justify-self: center;
      margin-top: 30px;
      gap: 12px;
      padding: 16px 26px;
      font-size: 11px;
      letter-spacing: 0.12em;
    }
  }
`;
}
