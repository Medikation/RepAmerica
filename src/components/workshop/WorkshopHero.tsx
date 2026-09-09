export interface WorkshopHeroSettings {
  eyebrow?: string; heading?: string; text?: string;
  button_label?: string; button_link?: string; button_label_2?: string; button_link_2?: string;
  image?: string; image_alt?: string;
}

/** Port of sections/workshop-hero.liquid. */
export default function WorkshopHero({ id, settings: s }: { id: string; settings: WorkshopHeroSettings }) {
  const domId = `WorkshopHero-${id}`;
  const hasImage = Boolean(s.image);
  const css = `
  #${domId} .ra-hero__eyebrow {
    color: #c62436;
  }

  .ra-hero--type-only .ra-hero__inner {
    grid-template-columns: 1fr;
  }

  .ra-hero--type-only {
    padding-bottom: var(--ra-space-2xl);
  }

  .ra-hero--type-only .ra-hero__text {
    max-width: 640px;
  }`;

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section className={`ra-hero${hasImage ? "" : " ra-hero--type-only"}`} id={domId}>
        <div className="ra-container ra-hero__inner">
          <div>
            {s.eyebrow ? <p className="ra-hero__eyebrow">{s.eyebrow}</p> : null}
            {s.heading ? <h1 className="ra-hero__title">{s.heading}</h1> : null}
            {s.text ? <div className="ra-hero__text" dangerouslySetInnerHTML={{ __html: s.text }} /> : null}
            <div className="ra-hero__actions">
              {s.button_label && s.button_link ? <a href={s.button_link} className="ra-button ra-button--primary">{s.button_label}</a> : null}
              {s.button_label_2 && s.button_link_2 ? <a href={s.button_link_2} className="ra-button ra-button--secondary">{s.button_label_2}</a> : null}
            </div>
          </div>
          {hasImage ? (
            <div className="ra-hero__visual">
              <img src={s.image} loading="eager" fetchPriority="high" sizes="(min-width: 990px) 46vw, 100vw" alt={s.image_alt ?? ""} />
            </div>
          ) : null}
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </section>
  );
}
