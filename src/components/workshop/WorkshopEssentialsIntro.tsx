export interface WorkshopEssentialsIntroSettings { anchor?: string; eyebrow?: string; heading?: string; text?: string; disclosure?: string }

/** Port of sections/workshop-essentials-intro.liquid. */
export default function WorkshopEssentialsIntro({ id, settings: s }: { id: string; settings: WorkshopEssentialsIntroSettings }) {
  const css = `
  .ra-workshop-essentials-intro__disclosure {
    margin-top: var(--ra-space-md);
    font-size: var(--ra-text-sm);
    font-style: italic;
    color: var(--ra-color-subtle);
  }`;
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section className="ra-section ra-workshop-essentials-intro" id={s.anchor || "the-essentials"}>
        <div className="ra-container-sm ra-text-center">
          {s.eyebrow ? <p className="ra-section-header__eyebrow">{s.eyebrow}</p> : null}
          {s.heading ? <h2 className="ra-section-header__title">{s.heading}</h2> : null}
          {s.text ? <div className="ra-intro__text" dangerouslySetInnerHTML={{ __html: s.text }} /> : null}
          {s.disclosure ? <div className="ra-workshop-essentials-intro__disclosure" dangerouslySetInnerHTML={{ __html: s.disclosure }} /> : null}
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </section>
  );
}
