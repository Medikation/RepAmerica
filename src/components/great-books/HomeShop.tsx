/** Port of sections/home-shop.liquid (the "Products That Reflect Our Values" teaser). */
export default function HomeShop({ id, settings }: { id: string; settings: { eyebrow?: string; heading?: string; badges?: string } }) {
  const sid = `HomeShop-${id}`;
  const style = `
  #${sid}.ra-section {
    padding-top: var(--ra-space-xl);
  }
`;
  return (
    <section className="ra-section ra-home-shop" id={sid}>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div className="ra-container-sm ra-text-center">
        {settings.eyebrow && <p className="ra-section-header__eyebrow">{settings.eyebrow}</p>}
        {settings.heading && <h2 className="ra-section-header__title">{settings.heading}</h2>}
        {settings.badges && <div className="ra-intro__text" dangerouslySetInnerHTML={{ __html: settings.badges }} />}
      </div>
    </section>
  );
}
