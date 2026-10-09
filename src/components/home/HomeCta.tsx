import { isBlank, str } from "./util";

export interface HomeCtaSettings { eyebrow?: string; heading?: string; body?: string; button_label?: string; button_link?: string; /** Round 82: the portrait that used to live in the hero */ image?: string }

/** Port of sections/home-cta.liquid (shares the About page's CTA styling from rep-america-about.css). */
export default function HomeCta({ id, settings }: { id: string; settings: HomeCtaSettings }) {
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  .ra-home-cta {
    padding: clamp(56px, 6vw, 88px) 0 clamp(48px, 5vw, 72px);
  }
  .ra-home-cta .ra-about-cta__button {
    margin-top: 28px;
  }
  .ra-home-cta--portrait .ra-about-cta__inner {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(260px, 38%);
    gap: 40px;
    align-items: center;
    text-align: left;
  }
  .ra-home-cta__portrait { position: relative; aspect-ratio: 1 / 1; overflow: hidden; }
  .ra-home-cta__portrait img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: center bottom; }
  @media screen and (max-width: 749px) {
    .ra-home-cta--portrait .ra-about-cta__inner { grid-template-columns: 1fr; gap: 24px; text-align: center; }
    .ra-home-cta__portrait { max-width: 320px; margin: 0 auto; }
  }
`,
        }}
      />
      <section className={`ra-about ra-about-cta ra-home-cta${!isBlank(settings.image) ? " ra-home-cta--portrait" : ""}`}>
        <div className="ra-about__shell">
          <div className="ra-about-cta__inner">
            <div>
              <p className="ra-about__eyebrow">{settings.eyebrow}</p>
              <h2 className="ra-about__section-heading">{settings.heading}</h2>
              <div className="ra-about__body ra-about-cta__body" dangerouslySetInnerHTML={{ __html: str(settings.body) }} />
              {!isBlank(settings.button_label) && !isBlank(settings.button_link) && (
                <a className="ra-about-cta__button" href={settings.button_link}>{settings.button_label}</a>
              )}
            </div>
            {!isBlank(settings.image) && (
              <div className="ra-home-cta__portrait">
                <img src={str(settings.image)} alt="Medi Hashemi in a Rep America cap" width={1800} height={1450} loading="lazy" />
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
