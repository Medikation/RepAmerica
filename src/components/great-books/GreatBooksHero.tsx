/** Port of sections/great-books-hero.liquid */
export interface GreatBooksHeroSettings {
  eyebrow?: string;
  heading?: string;
  text?: string;
  image?: string;
  mobile_image?: string;
  overlay_opacity?: number;
  desktop_height?: number;
  desktop_focus_x?: number;
  desktop_focus_y?: number;
  mobile_focus_x?: number;
  mobile_focus_y?: number;
}

export default function GreatBooksHero({ id, settings }: { id: string; settings: GreatBooksHeroSettings }) {
  const eyebrow = (settings.eyebrow ?? "").trim();
  const heading = (settings.heading ?? "").trim();
  const text = settings.text ?? "";
  const image = settings.image;
  const mobileImage = settings.mobile_image;
  const sid = `GreatBooksHero-${id}`;

  const style = `
  #${sid} {
    --ra-overlay-strength: ${(settings.overlay_opacity ?? 70) / 100};
    --ra-desktop-height: ${settings.desktop_height ?? 480}px;
    --ra-desktop-focus-x: ${settings.desktop_focus_x ?? 50}%;
    --ra-desktop-focus-y: ${settings.desktop_focus_y ?? 50}%;
    --ra-mobile-focus-x: ${settings.mobile_focus_x ?? 50}%;
    --ra-mobile-focus-y: ${settings.mobile_focus_y ?? 40}%;
  }

  #${sid}.ra-gb-hero-cinematic {
    position: relative;
    width: 100%;
    overflow: hidden;
    background: #111111;
    color: #ffffff;
  }

  #${sid} .ra-gb-hero-cinematic__media {
    position: relative;
    min-height: var(--ra-desktop-height);
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }

  #${sid} .ra-gb-hero-cinematic__image,
  #${sid} .ra-gb-hero-cinematic__placeholder {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    object-position: var(--ra-desktop-focus-x) var(--ra-desktop-focus-y);
  }

  #${sid} .ra-gb-hero-cinematic__overlay {
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

  #${sid} .ra-gb-hero-cinematic__shell {
    position: relative;
    z-index: 2;
    width: min(calc(100% - 48px), 1280px);
    margin: 0 auto;
  }

  #${sid} .ra-gb-hero-cinematic__content {
    width: min(100%, 860px);
    margin: 0 auto;
    padding: 0 0 26px;
    text-align: center;
  }

  #${sid} .ra-gb-hero-cinematic__kicker {
    margin: 0 0 18px;
    color: rgba(255, 255, 255, 0.72);
    font-size: 11px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  #${sid} .ra-gb-hero-cinematic__heading {
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

  #${sid} .ra-gb-hero-cinematic__lede {
    max-width: 560px;
    margin: 20px auto 0;
    color: rgba(255, 255, 255, 0.9);
  }

  #${sid} .ra-gb-hero-cinematic__lede p {
    margin: 0;
    color: inherit;
    font-size: clamp(18px, 1.45vw, 21px);
    line-height: 1.52;
  }

  @media screen and (max-width: 989px) {
    #${sid} .ra-gb-hero-cinematic__media {
      display: block;
      position: static;
      min-height: 0;
    }

    #${sid} .ra-gb-hero-cinematic__image,
    #${sid} .ra-gb-hero-cinematic__placeholder {
      position: relative;
      inset: auto;
      width: 100%;
      height: auto;
      aspect-ratio: 4 / 5;
      object-position: var(--ra-mobile-focus-x) var(--ra-mobile-focus-y);
    }

    #${sid} .ra-gb-hero-cinematic__overlay {
      display: none;
    }

    #${sid} .ra-gb-hero-cinematic__shell {
      position: static;
      z-index: auto;
      width: 100%;
      margin: 0;
    }

    #${sid} .ra-gb-hero-cinematic__content {
      width: 100%;
      max-width: none;
      padding: 32px 16px 40px;
    }

    #${sid} .ra-gb-hero-cinematic__heading {
      max-width: none;
      font-size: clamp(22px, 8.6vw, 52px);
      line-height: 1.1;
      white-space: nowrap;
    }

    #${sid} .ra-gb-hero-cinematic__lede {
      max-width: none;
      margin-top: 18px;
    }

    #${sid} .ra-gb-hero-cinematic__lede p {
      font-size: 16px;
      line-height: 1.48;
    }
  }

  @media screen and (max-width: 540px) {
    #${sid} .ra-gb-hero-cinematic__content {
      padding-bottom: 24px;
    }

    #${sid} .ra-gb-hero-cinematic__heading {
      font-size: clamp(22px, 8.6vw, 52px);
    }

    #${sid} .ra-gb-hero-cinematic__kicker {
      font-size: 10px;
      letter-spacing: 0.17em;
    }
  }
`;

  return (
    <section id={sid} className="ra-gb-hero-cinematic" aria-labelledby={`GreatBooksHeroHeading-${id}`}>
      <div className="ra-gb-hero-cinematic__media">
        {image ? (
          <picture>
            {mobileImage && <source media="(max-width: 989px)" srcSet={mobileImage} sizes="100vw" />}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="ra-gb-hero-cinematic__image" src={image} alt="" loading="eager" fetchPriority="high" sizes="100vw" />
          </picture>
        ) : (
          <svg className="ra-gb-hero-cinematic__placeholder" viewBox="0 0 525 525" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <rect width="525" height="525" fill="#111" />
          </svg>
        )}

        <div className="ra-gb-hero-cinematic__overlay" aria-hidden="true"></div>

        <div className="ra-gb-hero-cinematic__shell">
          <div className="ra-gb-hero-cinematic__content">
            {eyebrow && <p className="ra-gb-hero-cinematic__kicker">{eyebrow}</p>}
            {heading && (
              <h1 id={`GreatBooksHeroHeading-${id}`} className="ra-gb-hero-cinematic__heading">
                {heading}
              </h1>
            )}
            {text && <div className="ra-gb-hero-cinematic__lede" dangerouslySetInnerHTML={{ __html: text }} />}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: style }} />
    </section>
  );
}
