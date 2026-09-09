import { isBlank, str } from "./util";

export interface HomeCtaSettings { eyebrow?: string; heading?: string; body?: string; button_label?: string; button_link?: string }

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
`,
        }}
      />
      <section className="ra-about ra-about-cta ra-home-cta">
        <div className="ra-about__shell">
          <div className="ra-about-cta__inner">
            <p className="ra-about__eyebrow">{settings.eyebrow}</p>
            <h2 className="ra-about__section-heading">{settings.heading}</h2>
            <div className="ra-about__body ra-about-cta__body" dangerouslySetInnerHTML={{ __html: str(settings.body) }} />
            {!isBlank(settings.button_label) && !isBlank(settings.button_link) && (
              <a className="ra-about-cta__button" href={settings.button_link}>{settings.button_label}</a>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
