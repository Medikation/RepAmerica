/** Port of sections/workshop-disclaimer.liquid. */
export default function WorkshopDisclaimer({ id, settings: s }: { id: string; settings: { text?: string } }) {
  const css = `
  .ra-workshop-disclaimer__text {
    margin: 0;
    font-size: var(--ra-text-sm);
    color: var(--ra-color-subtle);
  }`;
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <section className="ra-section ra-workshop-disclaimer" id={`WorkshopDisclaimer-${id}`}>
        <div className="ra-container-sm ra-text-center">
          {s.text ? <p className="ra-workshop-disclaimer__text" dangerouslySetInnerHTML={{ __html: s.text }} /> : null}
        </div>
      </section>
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </section>
  );
}
