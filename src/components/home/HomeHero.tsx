import type { Article } from "@/lib/data";
import HeroPlayer from "./HeroPlayer";
import { youtubeBlurDataUrl } from "@/lib/thumb";
import { articleUrl, articleVideoId, isBlank, str } from "./util";

export interface HomeHeroSettings {
  eyebrow?: string; heading?: string; heading_2?: string; text?: string;
  button_label?: string; button_link?: string; button_label_2?: string; button_link_2?: string;
  video_blog?: string; video_label?: string; image?: string;
}

/** Port of sections/home-hero.liquid. `latest` = newest article of the configured video blog. */
export default async function HomeHero({ id, settings, latest }: { id: string; settings: HomeHeroSettings; latest: Article | null }) {
  const eyebrow = str(settings.eyebrow).trim();
  const heading = str(settings.heading).trim();
  const text = str(settings.text);
  const portrait = str(settings.image);
  const latestId = latest ? articleVideoId(latest) : "";
  const latestDuration = latest ? str(latest.meta?.duration) : "";
  const hasBtn1 = !isBlank(settings.button_label) && !isBlank(settings.button_link);
  const hasBtn2 = !isBlank(settings.button_label_2) && !isBlank(settings.button_link_2);

  const latestBlur = latestId ? await youtubeBlurDataUrl(latestId) : undefined;
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section id={`HomeHero-${id}`} className="ra-home-hero" aria-labelledby={`HomeHeroHeading-${id}`}>
        <div className="ra-home-hero__inner">
          <div className="ra-home-hero__col">
            <div className="ra-home-hero__copy">
              {eyebrow && <p className="ra-home-hero__kicker">{eyebrow}</p>}

              <div className="ra-home-hero__headline-block">
                {heading && (
                  <h1 id={`HomeHeroHeading-${id}`} className="ra-home-hero__heading">
                    <span className="ra-home-hero__heading-a">{heading}</span>
                  </h1>
                )}
                {!isBlank(settings.heading_2) && (
                  <div className="ra-home-hero__tagline">
                    <span className="ra-home-hero__rule"></span>
                    <p className="ra-home-hero__tagline-text">{settings.heading_2}</p>
                  </div>
                )}
              </div>

              {portrait && (
                <div className="ra-home-hero__portrait">
                  <img
                    src={portrait}
                    alt="Medi Hashemi in a Rep America cap, looking to his left"
                    width={1800}
                    height={1450}
                    loading="eager"
                    className="ra-home-hero__portrait-img"
                    sizes="(max-width: 749px) 102vw, (max-width: 989px) 70vw, 64vw"
                    fetchPriority="high"
                  />
                </div>
              )}

              {!isBlank(text) && <div className="ra-home-hero__lede" dangerouslySetInnerHTML={{ __html: text }} />}

              {(hasBtn1 || hasBtn2) && (
                <div className="ra-home-hero__actions">
                  {hasBtn1 && <a href={settings.button_link} className="ra-button ra-button--primary">{settings.button_label}</a>}
                  {hasBtn2 && <a href={settings.button_link_2} className="ra-button ra-button--secondary">{settings.button_label_2}</a>}
                </div>
              )}
            </div>

            {latest && latestId && (
              <div className="ra-home-hero__video">
                {!isBlank(settings.video_label) && (
                  <p className="ra-home-hero__video-label">
                    <span className="ra-home-hero__live-dot" aria-hidden="true"></span>
                    {settings.video_label}
                  </p>
                )}
                <HeroPlayer videoId={latestId} title={latest.title} duration={latestDuration} blurDataURL={latestBlur} />
                <a className="ra-home-hero__video-title" href={articleUrl(latest)}>{latest.title}</a>
              </div>
            )}
          </div>
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: heroStyle(id) }} />
    </section>
  );
}

function heroStyle(id: string): string {
  const S = `#HomeHero-${id}`;
  return `
  ${S} {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background:
      radial-gradient(ellipse 58% 78% at 72% 55%, rgba(255, 246, 232, 0.85) 0%, rgba(255, 246, 232, 0) 70%),
      linear-gradient(
        180deg,
        #ffffff 0%,
        #fbf9f6 9%,
        #faf8f4 22%,
        #faf8f4 58%,
        #fdfcfa 82%,
        #ffffff 100%
      );
    color: #14140f;
  }
  ${S} .ra-home-hero__inner {
    position: relative;
    width: min(calc(100% - 48px), 1280px);
    margin: 0 auto;
    padding-top: 36px;
  }
  ${S} .ra-home-hero__col {
    width: min(58%, 760px);
    padding-bottom: 64px;
  }
  ${S} .ra-home-hero__kicker {
    margin: 0 0 14px;
    color: rgba(20, 20, 15, 0.55);
    font-size: 11px;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  ${S} .ra-home-hero__heading {
    margin: 0;
    color: #14140f;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(44px, 4.9vw, 68px);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1.02;
    letter-spacing: -0.03em;
    white-space: nowrap;
    text-wrap: initial;
  }
  ${S} .ra-home-hero__tagline {
    margin-top: 26px;
  }
  ${S} .ra-home-hero__rule {
    display: block;
    width: 168px;
    height: 2px;
    margin: 0 0 16px;
    background: #c62436;
  }
  ${S} .ra-home-hero__tagline-text {
    margin: 0;
    color: #14140f;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: clamp(31px, 2.76vw, 44px);
    font-weight: var(--font-heading-weight, 700);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  ${S} .ra-home-hero__lede {
    max-width: 46em;
    margin-top: 14px;
    color: rgba(20, 20, 15, 0.74);
  }
  ${S} .ra-home-hero__lede p {
    margin: 0;
    color: inherit;
    font-size: 17px;
    line-height: 1.5;
  }
  ${S} .ra-home-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 22px;
  }
  ${S} .ra-home-hero__actions .ra-button--secondary {
    color: #111;
    border-color: rgba(17, 17, 17, 0.35);
  }
  ${S} .ra-home-hero__actions .ra-button--secondary:hover {
    background: #111;
    color: #fff;
    border-color: #111;
  }
  ${S} .ra-home-hero__video {
    max-width: 560px;
    margin-top: 44px;
  }
  #shopify-section-${id} + * {
    margin-top: 0;
  }
  ${S} .ra-home-hero__video-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px;
    color: rgba(20, 20, 15, 0.62);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }
  ${S} .ra-home-hero__live-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #c62436;
  }
  ${S} .ra-home-hero__player {
    position: relative;
    aspect-ratio: 16 / 9;
    border-radius: 10px;
    overflow: hidden;
    background: #000;
    box-shadow: 0 18px 44px rgba(20, 18, 14, 0.16);
  }
  ${S} .ra-home-hero__facade {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  ${S} .ra-home-hero__facade img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    transition: transform 0.4s ease, opacity 0.3s ease;
  }
  ${S} .ra-home-hero__facade:hover img {
    transform: scale(1.02);
    opacity: 0.9;
  }
  ${S} .ra-home-hero__play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    width: 66px;
    height: 66px;
    border-radius: 50%;
    background: rgba(17, 17, 17, 0.62);
    border: 1px solid rgba(255, 255, 255, 0.75);
    color: #fff;
    transition: background 0.2s ease, transform 0.2s ease;
  }
  ${S} .ra-home-hero__facade:hover .ra-home-hero__play {
    background: #c62436;
    border-color: #c62436;
    transform: translate(-50%, -50%) scale(1.06);
  }
  ${S} .ra-home-hero__duration {
    position: absolute;
    right: 10px;
    bottom: 10px;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.78);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  ${S} .ra-home-hero__player iframe {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border: 0;
  }
  ${S} .ra-home-hero__video-title {
    display: block;
    margin-top: 12px;
    color: #14140f;
    font-family: var(--font-heading-family, Georgia, serif);
    font-size: 19px;
    line-height: 1.3;
    text-decoration: none;
  }
  ${S} .ra-home-hero__video-title:hover {
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  ${S} .ra-home-hero__portrait {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 43%;
    right: 0;
    pointer-events: none;
  }
  ${S} .ra-home-hero__portrait-img {
    display: block;
    height: 108%;
    width: auto;
    max-width: none;
    object-fit: contain;
    object-position: top left;
  }
  @media screen and (max-width: 989px) {
    ${S} .ra-home-hero__inner {
      display: block;
      width: 100%;
      padding-top: 0;
    }
    ${S} .ra-home-hero__col {
      width: 100%;
      padding: 14px 20px 28px;
    }
    ${S} .ra-home-hero__copy {
      --ra-p-size: 102vw;
      --ra-p-right: -30vw;
      --ra-p-drop: -12vw;
      --ra-stage: 76vw;
      position: relative;
      display: block;
      min-height: var(--ra-stage);
    }
    ${S} .ra-home-hero__headline-block {
      position: relative;
      z-index: 1;
      padding-top: 5vw;
      max-width: 52%;
    }
    ${S} .ra-home-hero__portrait {
      position: absolute;
      left: auto;
      right: var(--ra-p-right);
      bottom: var(--ra-p-drop);
      z-index: 0;
      width: var(--ra-p-size);
      margin: 0;
      display: block;
    }
    ${S} .ra-home-hero__kicker,
    ${S} .ra-home-hero__lede,
    ${S} .ra-home-hero__actions {
      display: none;
    }
    ${S} .ra-home-hero__heading {
      max-width: none;
      padding: 0;
      font-size: clamp(30px, 8.6vw, 42px);
      line-height: 1.22;
      text-wrap: initial;
      white-space: normal;
    }
    ${S} .ra-home-hero__heading-a {
      display: block;
      word-spacing: 100vw;
    }
    ${S} .ra-home-hero__heading-b {
      display: none;
    }
    ${S} .ra-home-hero__portrait-img {
      display: block;
      height: auto;
      width: 100%;
      max-width: none;
      margin: 0;
    }
    ${S} .ra-home-hero__tagline {
      margin-top: 22px;
    }
    ${S} .ra-home-hero__rule {
      width: 76px;
      margin-bottom: 14px;
    }
    ${S} .ra-home-hero__tagline-text {
      font-size: clamp(22px, 6.4vw, 30px);
      line-height: 1.14;
    }
    ${S} .ra-home-hero__video {
      max-width: none;
      margin-top: 22px;
    }
  }
`;
}
