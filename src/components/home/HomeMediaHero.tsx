import type { Article, Product } from "@/lib/data";
import { money } from "@/lib/data";
import HeroPlayer from "./HeroPlayer";
import YoutubeThumb from "./YoutubeThumb";
import HatBuyButton from "./HatBuyButton";
import { youtubeBlurDataUrl } from "@/lib/thumb";
import { articleUrl, articleVideoId, isBlank, shortDate, str } from "./util";

export interface HomeMediaHeroSettings {
  heading?: string; heading_2?: string; video_label?: string;
  hats_eyebrow?: string; hats_heading?: string; hats_link?: string; hats_link_label?: string;
}

/** Homepage hero, Round 82: headline + a 1-big/2-small block of the latest cuts, with a merch rail of the Rep America hats
 *  directly beneath it so a visitor from YouTube sees "watch" and "wear" in the first screen. Replaces home-hero
 *  (headline + portrait + one video); the portrait moved down to the closing CTA. */
export default async function HomeMediaHero({ id, settings, videos, hats }: { id: string; settings: HomeMediaHeroSettings; videos: Article[]; hats: Product[] }) {
  const [lead, ...rest] = videos;
  const leadId = lead ? articleVideoId(lead) : "";
  const leadBlur = leadId ? await youtubeBlurDataUrl(leadId) : undefined;
  const heading = str(settings.heading).trim();
  const hatsLink = str(settings.hats_link) || "/collections/rep-america";

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section id={`MediaHero-${id}`} className="ra-media-hero" aria-labelledby={`MediaHeroHeading-${id}`}>
        <div className="ra-media-hero__inner">
          <header className="ra-media-hero__head">
            {heading && <h1 id={`MediaHeroHeading-${id}`} className="ra-media-hero__heading">{heading}</h1>}
            {!isBlank(settings.heading_2) && <p className="ra-media-hero__tagline">{settings.heading_2}</p>}
          </header>

          {lead && leadId && (
            <div className="ra-media-hero__grid">
              <div className="ra-media-hero__lead">
                {!isBlank(settings.video_label) && (
                  <p className="ra-media-hero__label"><span className="ra-media-hero__dot" aria-hidden="true"></span>{settings.video_label}</p>
                )}
                <HeroPlayer videoId={leadId} title={lead.title} duration={str(lead.meta?.duration)} blurDataURL={leadBlur} />
                <a className="ra-media-hero__lead-title" href={articleUrl(lead)}>{lead.title}</a>
                <p className="ra-media-hero__meta">{str(lead.meta?.category) || "Commentary"} · {shortDate(lead.published_at)}</p>
              </div>
              <div className="ra-media-hero__side">
                {rest.map((a) => {
                  const vid = articleVideoId(a);
                  const duration = str(a.meta?.duration);
                  return (
                    <article className="ra-media-hero__card" key={a.id}>
                      <a href={articleUrl(a)} className="ra-media-hero__card-link" aria-label={`Watch ${a.title}`}>
                        <div className="ra-media-hero__card-thumb">
                          {vid && <YoutubeThumb videoId={vid} alt={a.title} loading="eager" />}
                          {duration && <span className="ra-media-hero__duration">{duration}</span>}
                        </div>
                        <div className="ra-media-hero__card-body">
                          <p className="ra-media-hero__meta">{str(a.meta?.category) || "Commentary"} · {shortDate(a.published_at)}</p>
                          <h2 className="ra-media-hero__card-title">{a.title}</h2>
                        </div>
                      </a>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {hats.length > 0 && (
            <aside className="ra-hat-rail" aria-label="Rep America hats">
              <div className="ra-hat-rail__intro">
                {!isBlank(settings.hats_eyebrow) && <p className="ra-hat-rail__eyebrow">{settings.hats_eyebrow}</p>}
                <h2 className="ra-hat-rail__heading">{str(settings.hats_heading) || "You Represent America."}</h2>
                {!isBlank(settings.hats_link_label) && <a className="ra-hat-rail__all" href={hatsLink}>{settings.hats_link_label} →</a>}
              </div>
              <ul className="ra-hat-rail__list">
                {hats.map((p) => {
                  const img = [...(p.images ?? [])].sort((a, b) => a.position - b.position)[0];
                  const v = (p.variants ?? []).find((x) => x.available) ?? p.variants?.[0];
                  const price = v ? money(v.price_cents) : "";
                  return (
                    <li className="ra-hat-rail__item" key={p.id}>
                      <a className="ra-hat-rail__media" href={`/products/${p.handle}`} tabIndex={-1} aria-hidden="true">
                        {img && <img src={img.src} alt="" width={img.width} height={img.height} loading="lazy" sizes="(max-width: 749px) 30vw, 150px" />}
                      </a>
                      <div className="ra-hat-rail__body">
                        <a className="ra-hat-rail__title" href={`/products/${p.handle}`}>{p.title.replace(/^Rep America\s+/i, "")}</a>
                        <p className="ra-hat-rail__price">{price}</p>
                        {v && v.available ? (
                          <HatBuyButton variantId={v.id} label="Buy" className="ra-hat-rail__buy" />
                        ) : (
                          <span className="ra-hat-rail__soldout">Sold out</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </aside>
          )}
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: heroStyle(id) }} />
    </section>
  );
}

function heroStyle(id: string): string {
  const S = `#MediaHero-${id}`;
  return `
  ${S} {
    position: relative;
    background: linear-gradient(180deg, #ffffff 0%, #faf8f4 40%, #faf8f4 100%);
    color: #14140f;
  }
  #shopify-section-${id} + * { margin-top: 0; }
  ${S} .ra-media-hero__inner {
    width: min(calc(100% - 48px), 1280px);
    margin: 0 auto;
    padding: 34px 0 44px;
  }
  ${S} .ra-media-hero__head {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 10px 28px;
    margin-bottom: 26px;
  }
  ${S} .ra-media-hero__heading {
    margin: 0;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(36px, 3.8vw, 54px);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1.02;
    letter-spacing: -0.03em;
  }
  ${S} .ra-media-hero__tagline {
    margin: 0;
    padding-left: 28px;
    border-left: 2px solid #c62436;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(20px, 1.9vw, 27px);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: rgba(20, 20, 15, 0.78);
  }
  ${S} .ra-media-hero__grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
    gap: 28px;
    align-items: start;
  }
  ${S} .ra-media-hero__label {
    display: flex; align-items: center; gap: 8px;
    margin: 0 0 10px;
    color: rgba(20, 20, 15, 0.62);
    font-size: 11px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
  }
  ${S} .ra-media-hero__dot { width: 7px; height: 7px; border-radius: 50%; background: #c62436; }
  ${S} .ra-media-hero__meta {
    margin: 6px 0 0;
    color: rgba(20, 20, 15, 0.55);
    font-size: 12px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
  }
  ${S} .ra-media-hero__lead-title {
    display: block;
    margin-top: 14px;
    color: #14140f;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(22px, 2.1vw, 30px);
    line-height: 1.2;
    letter-spacing: -0.01em;
    text-decoration: none;
  }
  ${S} .ra-media-hero__lead-title:hover,
  ${S} .ra-media-hero__card-link:hover .ra-media-hero__card-title { text-decoration: underline; text-underline-offset: 3px; }

  /* the lead player (shared HeroPlayer markup) */
  ${S} .ra-home-hero__player { position: relative; aspect-ratio: 16/9; border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 18px 44px rgba(20, 18, 14, 0.16); }
  ${S} .ra-home-hero__facade { display: block; width: 100%; height: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
  ${S} .ra-home-hero__facade img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .4s ease, opacity .3s ease; }
  ${S} .ra-home-hero__facade:hover img { transform: scale(1.02); opacity: .9; }
  ${S} .ra-home-hero__play { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: grid; place-items: center; width: 74px; height: 74px; border-radius: 50%; background: rgba(17,17,17,.62); border: 1px solid rgba(255,255,255,.75); color: #fff; transition: background .2s ease, transform .2s ease; }
  ${S} .ra-home-hero__facade:hover .ra-home-hero__play { background: #c62436; border-color: #c62436; transform: translate(-50%, -50%) scale(1.06); }
  ${S} .ra-home-hero__duration, ${S} .ra-media-hero__duration { position: absolute; right: 10px; bottom: 10px; padding: 3px 8px; border-radius: 4px; background: rgba(0,0,0,.78); color: #fff; font-size: 12px; font-weight: 600; letter-spacing: .02em; }
  ${S} .ra-home-hero__player iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }

  /* the two side cards */
  ${S} .ra-media-hero__side { display: grid; gap: 22px; }
  ${S} .ra-media-hero__card-link { display: block; color: inherit; text-decoration: none; }
  ${S} .ra-media-hero__card-thumb { position: relative; aspect-ratio: 16/9; border-radius: 10px; overflow: hidden; background: #e9e6df; box-shadow: 0 10px 26px rgba(20, 18, 14, 0.12); }
  ${S} .ra-media-hero__card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
  ${S} .ra-media-hero__card-link:hover .ra-media-hero__card-thumb img { transform: scale(1.03); }
  ${S} .ra-media-hero__card-body { padding-top: 8px; }
  ${S} .ra-media-hero__card-body .ra-media-hero__meta { margin-top: 0; }
  ${S} .ra-media-hero__card-title {
    margin: 4px 0 0;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: 18px; line-height: 1.25; font-weight: var(--font-heading-weight, 700); letter-spacing: -0.01em;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  /* hat rail */
  ${S} .ra-hat-rail {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 32px;
    align-items: center;
    margin-top: 40px;
    padding: 26px 28px;
    border-radius: 14px;
    background: #0f1e3d;
    color: #fff;
  }
  ${S} .ra-hat-rail__eyebrow { margin: 0 0 6px; color: #e8b64a; font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; }
  ${S} .ra-hat-rail__heading { margin: 0; font-family: var(--font-heading-family, Georgia, serif); font-size: clamp(26px, 2.4vw, 34px); line-height: 1.05; letter-spacing: -0.02em; color: #fff; }
  ${S} .ra-hat-rail__all { display: inline-block; margin-top: 10px; color: rgba(255,255,255,.82); font-size: 13px; font-weight: 600; letter-spacing: .04em; text-decoration: none; }
  ${S} .ra-hat-rail__all:hover { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
  ${S} .ra-hat-rail__list { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
  ${S} .ra-hat-rail__item { display: grid; grid-template-columns: minmax(0, 1fr); border-radius: 14px; overflow: hidden; background: rgba(255,255,255,.06); }
  ${S} .ra-hat-rail__media { display: block; aspect-ratio: 1; overflow: hidden; background: #fff; }
  ${S} .ra-hat-rail__media img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform .35s ease; }
  ${S} .ra-hat-rail__item:hover .ra-hat-rail__media img { transform: scale(1.04); }
  ${S} .ra-hat-rail__body { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; padding: 12px 14px 14px; }
  ${S} .ra-hat-rail__title { color: #fff; font-weight: 700; font-size: 16px; line-height: 1.2; text-decoration: none; }
  ${S} .ra-hat-rail__title:hover { text-decoration: underline; text-underline-offset: 3px; }
  ${S} .ra-hat-rail__price { margin: 0; color: rgba(255,255,255,.78); font-size: 15px; }
  ${S} .ra-hat-rail__buy {
    margin-left: auto;
    display: inline-block; padding: 9px 20px; border: 0; border-radius: 999px; cursor: pointer;
    background: #c62436; color: #fff; font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    transition: background .15s ease, transform .15s ease;
  }
  ${S} .ra-hat-rail__buy:hover { background: #a71b2b; transform: translateY(-1px); }
  ${S} .ra-hat-rail__buy:disabled { opacity: .7; cursor: wait; transform: none; }
  ${S} .ra-hat-rail__soldout { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.5); }
  ${S} .ra-hat-rail__error { display: block; margin-top: 6px; color: #ffb4b4; font-size: 12px; }

  @media screen and (max-width: 1100px) {
    ${S} .ra-hat-rail { grid-template-columns: 1fr; gap: 18px; }
  }
  @media screen and (max-width: 989px) {
    ${S} .ra-media-hero__inner { width: calc(100% - 40px); padding: 22px 0 32px; }
    ${S} .ra-media-hero__head { display: block; margin-bottom: 18px; }
    ${S} .ra-media-hero__tagline { margin-top: 10px; padding-left: 0; border-left: 0; padding-top: 10px; border-top: 2px solid #c62436; display: inline-block; }
    ${S} .ra-media-hero__grid { grid-template-columns: 1fr; gap: 22px; }
    ${S} .ra-media-hero__side { grid-template-columns: 1fr 1fr; gap: 16px; }
    ${S} .ra-media-hero__lead-title { font-size: 22px; }
    ${S} .ra-media-hero__card-title { font-size: 15px; }
  }
  @media screen and (max-width: 749px) {
    ${S} .ra-media-hero__heading { font-size: clamp(32px, 9vw, 40px); }
    ${S} .ra-media-hero__side { grid-template-columns: 1fr; }
    ${S} .ra-hat-rail { margin-top: 28px; padding: 18px 16px; }
    ${S} .ra-hat-rail__list { grid-template-columns: 1fr; gap: 12px; }
    ${S} .ra-hat-rail__item { grid-template-columns: 132px minmax(0, 1fr); }
    ${S} .ra-hat-rail__body { flex-direction: column; align-items: flex-start; justify-content: center; gap: 6px; }
    ${S} .ra-hat-rail__buy { margin-left: 0; }
  }
`;
}
