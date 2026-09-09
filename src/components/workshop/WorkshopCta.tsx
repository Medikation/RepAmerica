export interface WorkshopCtaSettings {
  eyebrow?: string; heading?: string; body?: string; button_label?: string; button_link?: string; theme?: "red" | "white" | string;
}

/** Port of sections/workshop-cta.liquid (reuses the About page's `.ra-about-cta` styles from rep-america-about.css). */
export default function WorkshopCta({ id, settings: s }: { id: string; settings: WorkshopCtaSettings }) {
  const domId = `WorkshopCta-${id}`;
  const css = s.theme === "white" ? `
    #${domId}.ra-about-cta {
      background: #fff;
      color: var(--ra-about-ink);
      border-top: 1px solid var(--ra-about-line);
    }

    #${domId} .ra-about-cta__body,
    #${domId} .ra-about-cta__body p {
      color: var(--ra-about-muted);
    }

    #${domId} .ra-about-cta .ra-about__section-heading,
    #${domId} .ra-about__section-heading {
      color: var(--ra-about-ink);
    }

    #${domId} .ra-about__eyebrow {
      color: var(--ra-about-accent);
    }

    #${domId} .ra-about-cta__button {
      border-color: var(--ra-about-ink);
      color: var(--ra-about-ink);
    }

    #${domId} .ra-about-cta__button:hover {
      background: var(--ra-about-ink);
      color: #fff;
    }` : "";

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      {css ? <style dangerouslySetInnerHTML={{ __html: css }} /> : null}
      <section className="ra-about ra-about-cta" id={domId}>
        <div className="ra-about__shell">
          <div className="ra-about-cta__inner">
            <p className="ra-about__eyebrow">{s.eyebrow}</p>
            <h2 className="ra-about__section-heading">{s.heading}</h2>
            <div className="ra-about__body ra-about-cta__body" dangerouslySetInnerHTML={{ __html: s.body ?? "" }} />
            {s.button_label && s.button_link ? (
              <a className="ra-about-cta__button" href={s.button_link}>{s.button_label}</a>
            ) : null}
          </div>
        </div>
      </section>
    </section>
  );
}
