const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

export interface AboutHeroSettings {
  kicker?: string; heading?: string; lede?: string; image?: string; mobile_image?: string;
  overlay_opacity?: number; desktop_height?: number; mobile_height?: number;
  desktop_focus_x?: number; desktop_focus_y?: number; mobile_focus_x?: number; mobile_focus_y?: number;
}

/** Port of sections/about-hero-cinematic-v4.liquid. */
export default function AboutHero({ id, settings: s }: { id: string; settings: AboutHeroSettings }) {
  const kicker = str(s.kicker).trim();
  const heading = str(s.heading).trim();
  const lede = str(s.lede);
  const image = str(s.image);
  const mobile = str(s.mobile_image);

  return (
    <section id={`shopify-section-${id}`} className="shopify-section section-about-hero-cinematic">
      <section id={`AboutHero-${id}`} className="ra-about-hero-cinematic" aria-labelledby={`AboutHeroHeading-${id}`}>
        <div className="ra-about-hero-cinematic__media">
          {image ? (
            <picture>
              {mobile && <source media="(max-width: 989px)" srcSet={mobile} sizes="100vw" />}
              <img
                src={image}
                alt="Glassblowing artisan shaping molten glass at a furnace, American craftsmanship, Rep America About page hero, desktop"
                className="ra-about-hero-cinematic__image"
                loading="eager"
                fetchPriority="high"
                sizes="100vw"
                width={3200}
                height={1000}
              />
            </picture>
          ) : (
            <svg className="ra-about-hero-cinematic__placeholder" viewBox="0 0 525 525" aria-hidden="true"><rect width="525" height="525" fill="#e5e5e5" /></svg>
          )}
          <div className="ra-about-hero-cinematic__overlay" aria-hidden="true"></div>
          <div className="ra-about-hero-cinematic__shell">
            <div className="ra-about-hero-cinematic__content">
              {kicker && <p className="ra-about-hero-cinematic__kicker">{kicker}</p>}
              {heading && (
                <h1 id={`AboutHeroHeading-${id}`} className="ra-about-hero-cinematic__heading">{heading}</h1>
              )}
              {lede.trim() && <div className="ra-about-hero-cinematic__lede" dangerouslySetInnerHTML={{ __html: lede }} />}
            </div>
          </div>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: heroStyle(id, s) }} />
    </section>
  );
}

function heroStyle(id: string, s: AboutHeroSettings): string {
  const S = `#AboutHero-${id}`;
  const n = (v: unknown, d: number) => (v == null || v === "" ? d : Number(v));
  return `
  ${S} {
    --ra-overlay-strength: ${n(s.overlay_opacity, 85) / 100};
    --ra-desktop-height: ${n(s.desktop_height, 640)}px;
    --ra-mobile-height: ${n(s.mobile_height, 820)}px;
    --ra-desktop-focus-x: ${n(s.desktop_focus_x, 50)}%;
    --ra-desktop-focus-y: ${n(s.desktop_focus_y, 50)}%;
    --ra-mobile-focus-x: ${n(s.mobile_focus_x, 50)}%;
    --ra-mobile-focus-y: ${n(s.mobile_focus_y, 50)}%;
  }
  ${S}.ra-about-hero-cinematic {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #111111;
    color: #ffffff;
  }
  ${S} .ra-about-hero-cinematic__media {
    position: relative;
    min-height: var(--ra-desktop-height);
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }
  ${S} .ra-about-hero-cinematic__image,
  ${S} .ra-about-hero-cinematic__placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: var(--ra-desktop-focus-x) var(--ra-desktop-focus-y);
  }
  ${S} .ra-about-hero-cinematic__overlay {
    display: block;
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
      linear-gradient(
        0deg,
        rgba(0, 0, 0, calc(var(--ra-overlay-strength) * 1.1)) 0%,
        rgba(0, 0, 0, calc(var(--ra-overlay-strength) * 0.85)) 30%,
        rgba(0, 0, 0, calc(var(--ra-overlay-strength) * 0.35)) 55%,
        rgba(0, 0, 0, 0.04) 80%,
        rgba(0, 0, 0, 0) 100%
      );
  }
  ${S} .ra-about-hero-cinematic__shell {
    position: relative;
    z-index: 2;
    width: min(calc(100% - 48px), 1280px);
    margin: 0 auto;
  }
  ${S} .ra-about-hero-cinematic__content {
    width: min(58%, 760px);
    padding: 0 0 56px;
  }
  ${S} .ra-about-hero-cinematic__kicker {
    margin: 0 0 18px;
    color: #c62436;
    text-shadow: 0 1px 12px rgba(0, 0, 0, 0.65);
    font-size: 11px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  ${S} .ra-about-hero-cinematic__heading {
    max-width: 100%;
    margin: 0;
    color: #ffffff;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(40px, 4.4vw, 68px);
    font-style: var(--font-heading-style, normal);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1;
    letter-spacing: -0.03em;
    text-wrap: balance;
  }
  ${S} .ra-about-hero-cinematic__lede {
    max-width: 560px;
    margin-top: 20px;
    color: rgba(255, 255, 255, 0.9);
  }
  ${S} .ra-about-hero-cinematic__lede p {
    margin: 0;
    color: inherit;
    font-size: clamp(18px, 1.45vw, 21px);
    line-height: 1.52;
  }
  @media screen and (max-width: 989px) {
    ${S} .ra-about-hero-cinematic__media {
      display: block;
      position: static;
      min-height: 0;
    }
    ${S} .ra-about-hero-cinematic__image,
    ${S} .ra-about-hero-cinematic__placeholder {
      position: relative;
      inset: auto;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 5;
      object-position: var(--ra-mobile-focus-x) var(--ra-mobile-focus-y);
    }
    ${S} .ra-about-hero-cinematic__overlay {
      display: none;
    }
    ${S} .ra-about-hero-cinematic__shell {
      position: static;
      z-index: auto;
      width: 100%;
      margin: 0;
    }
    ${S} .ra-about-hero-cinematic__content {
      width: 100%;
      max-width: none;
      padding: 32px 24px 40px;
    }
    ${S} .ra-about-hero-cinematic__heading {
      max-width: none;
      font-size: clamp(34px, 9vw, 52px);
      line-height: 1.02;
    }
    ${S} .ra-about-hero-cinematic__lede {
      max-width: none;
      margin-top: 18px;
    }
    ${S} .ra-about-hero-cinematic__lede p {
      font-size: 16px;
      line-height: 1.48;
    }
  }
  @media screen and (max-width: 540px) {
    ${S} .ra-about-hero-cinematic__content {
      padding-bottom: 24px;
    }
    ${S} .ra-about-hero-cinematic__heading {
      font-size: clamp(36px, 10vw, 52px);
    }
    ${S} .ra-about-hero-cinematic__kicker {
      font-size: 10px;
      letter-spacing: 0.17em;
    }
  }
`;
}
