export interface WorkshopIntroSettings { anchor?: string; eyebrow?: string; heading?: string; text?: string }

/** Port of sections/workshop-collection.liquid (the "Rep Collection" label above the product grid). */
export default function WorkshopCollection({ id, settings: s }: { id: string; settings: WorkshopIntroSettings }) {
  const css = `
  .ra-workshop-collection.ra-section {
    padding-top: 28px;
    padding-bottom: 14px;
  }

  .ra-workshop-collection .ra-intro__text,
  .ra-workshop-collection .ra-intro__text p {
    font-size: 17px;
    line-height: 1.6;
  }`;
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <section className="ra-section ra-workshop-collection" id={s.anchor || "rep-collection"}>
        <div className="ra-container-sm ra-text-center">
          {s.eyebrow ? <p className="ra-section-header__eyebrow">{s.eyebrow}</p> : null}
          {s.heading ? <h2 className="ra-section-header__title">{s.heading}</h2> : null}
          {s.text ? <div className="ra-intro__text" dangerouslySetInnerHTML={{ __html: s.text }} /> : null}
        </div>
      </section>
    </section>
  );
}
