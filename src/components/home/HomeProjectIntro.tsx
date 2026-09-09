import { isBlank, str } from "./util";

export interface HomeProjectIntroSettings {
  eyebrow?: string; heading?: string; text?: string; button_label?: string; button_link?: string;
  image?: string; mobile_image?: string; overlay_opacity?: number; focus_x?: number; focus_y?: number; banner_height?: number;
}

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
    <path d="M4 12h15m-5.5-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Port of sections/home-project-intro.liquid (the Great Books split panel). */
export default function HomeProjectIntro({ id, settings }: { id: string; settings: HomeProjectIntroSettings }) {
  const bg = str(settings.image);
  const hasBg = !isBlank(bg);
  const mobile = str(settings.mobile_image);
  const hasButton = !isBlank(settings.button_label) && !isBlank(settings.button_link);

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section className={`ra-section ra-project-intro${hasBg ? " ra-project-intro--split" : ""}`} id={`ProjectIntro-${id}`}>
        {hasBg ? (
          <>
            <div className="ra-project-intro__panel">
              <div className="ra-project-intro__panel-inner">
                {!isBlank(settings.eyebrow) && <p className="ra-project-intro__eyebrow">{settings.eyebrow}</p>}
                {!isBlank(settings.heading) && (
                  <h2 className="ra-project-intro__heading" dangerouslySetInnerHTML={{ __html: str(settings.heading) }} />
                )}
                {!isBlank(settings.text) && <div className="ra-project-intro__text" dangerouslySetInnerHTML={{ __html: str(settings.text) }} />}
                <span className="ra-project-intro__rule" aria-hidden="true"></span>
                {hasButton && (
                  <a className="ra-project-intro__button" href={settings.button_link}>
                    <span>{settings.button_label}</span>
                    <Arrow />
                  </a>
                )}
              </div>
            </div>
            <div className="ra-project-intro__media">
              <picture>
                {!isBlank(mobile) && <source media="(max-width: 749px)" srcSet={mobile} sizes="100vw" />}
                <img src={bg} className="ra-project-intro__image" sizes="(max-width: 749px) 64vw, 70vw" loading="eager" alt="" width={2000} height={1111} />
              </picture>
            </div>
          </>
        ) : (
          <div className="ra-container-sm ra-text-center ra-project-intro__inner">
            {!isBlank(settings.eyebrow) && <p className="ra-section-header__eyebrow">{settings.eyebrow}</p>}
            {!isBlank(settings.heading) && <h2 className="ra-section-header__title" dangerouslySetInnerHTML={{ __html: str(settings.heading) }} />}
            {!isBlank(settings.text) && <div className="ra-project-intro__text" dangerouslySetInnerHTML={{ __html: str(settings.text) }} />}
            {hasButton && (
              <div className="ra-project-intro__actions">
                <a className="ra-text-link" href={settings.button_link}>{settings.button_label}</a>
              </div>
            )}
          </div>
        )}
      </section>
      <style dangerouslySetInnerHTML={{ __html: projectIntroStyle(settings) }} />
    </section>
  );
}

function projectIntroStyle(s: HomeProjectIntroSettings): string {
  const h = Number(s.banner_height ?? 560);
  return `
  .ra-project-intro--split {
    display: grid;
    grid-template-columns: 30% 70%;
    align-items: stretch;
    width: 100%;
    max-width: none;
    min-height: ${h}px;
    padding: 0;
    margin-top: calc(var(--ra-space-2xl) + 52px);
    margin-bottom: calc(-1 * var(--ra-space-lg));
    overflow: hidden;
    background: #0e0e0f;
  }
  .ra-project-intro__panel {
    display: flex;
    align-items: center;
    background: #0e0e0f;
    color: #fff;
  }
  .ra-project-intro__panel-inner {
    width: 100%;
    margin-left: auto;
    padding: 56px 40px 56px
      max(24px, min(calc((100% / 0.3 - 1280px) / 2), calc(100% - 340px)));
  }
  .ra-project-intro__eyebrow {
    margin: 0 0 36px;
    color: #c62436;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.2em;
    line-height: 1;
    text-transform: uppercase;
  }
  .ra-project-intro__heading {
    margin: 0;
    color: #fff;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(44px, 3.9vw, 64px);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1.08;
    text-wrap: balance;
    letter-spacing: -0.02em;
  }
  .ra-project-intro--split .ra-project-intro__text {
    margin-top: 22px;
    color: rgba(255, 255, 255, 0.72);
  }
  .ra-project-intro--split .ra-project-intro__text p {
    margin: 0;
    color: inherit;
    font-size: 17px;
    line-height: 1.6;
  }
  .ra-project-intro__rule {
    display: block;
    width: 72px;
    height: 2px;
    margin: 34px 0;
    background: #c62436;
  }
  .ra-project-intro__button {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 17px 30px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    text-decoration: none;
    transition: background 0.2s ease, color 0.2s ease, border-color 0.2s ease;
  }
  .ra-project-intro__button:hover,
  .ra-project-intro__button:focus-visible {
    background: #c62436;
    border-color: #c62436;
    color: #fff;
  }
  .ra-project-intro__media {
    position: relative;
    overflow: hidden;
  }
  .ra-project-intro__media picture {
    display: block;
    width: 100%;
    height: 100%;
  }
  .ra-project-intro__image {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: ${Number(s.focus_x ?? 50)}% ${Number(s.focus_y ?? 50)}%;
  }
  .ra-project-intro__text {
    margin-top: var(--ra-space-md);
    font-size: 19px;
    line-height: 1.5;
    color: var(--ra-color-muted);
  }
  .ra-project-intro__actions {
    margin-top: var(--ra-space-xl);
  }
  @media screen and (max-width: 989px) {
    .ra-project-intro--split {
      grid-template-columns: 34% 66%;
      min-height: ${Math.round(h * 0.8)}px;
    }
    .ra-project-intro__panel-inner {
      max-width: none;
      padding: 44px 28px 44px 24px;
    }
  }
  @media screen and (max-width: 749px) {
    .ra-project-intro--split {
      grid-template-columns: 1fr;
      grid-template-rows: auto auto auto auto;
      min-height: 0;
      padding: 30px 0 34px;
      margin-top: var(--ra-space-xl);
      text-align: center;
    }
    .ra-project-intro__panel,
    .ra-project-intro__panel-inner {
      display: contents;
    }
    .ra-project-intro__eyebrow {
      grid-row: 1;
      margin: 0 20px 34px;
      font-size: 11px;
      letter-spacing: 0.18em;
    }
    .ra-project-intro__heading {
      grid-row: 2;
      margin: 0 12px 26px;
      font-size: clamp(21px, 7.4vw, 33px);
      line-height: 1.2;
      white-space: nowrap;
    }
    .ra-project-intro--split .ra-project-intro__text {
      display: none;
    }
    .ra-project-intro--split .ra-project-intro__rule {
      display: none;
    }
    .ra-project-intro__media {
      grid-row: 3;
      width: 100%;
    }
    .ra-project-intro__image {
      position: static;
      height: auto;
    }
    .ra-project-intro__button {
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
