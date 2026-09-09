import { isBlank, str } from "./util";

export interface PillarBlockSettings { label?: string; heading?: string; body?: string; link_label?: string; link_url?: string }
export interface HomePillarsSection {
  settings: { background?: string; eyebrow?: string; heading?: string; intro?: string };
  blocks?: Record<string, { type: string; settings: PillarBlockSettings }>;
  block_order?: string[];
}

/** Port of sections/home-pillars.liquid. */
export default function HomePillars({ id, section }: { id: string; section: HomePillarsSection }) {
  const s = section.settings;
  const order = section.block_order ?? Object.keys(section.blocks ?? {});
  const bg = isBlank(s.background) ? "#0f1e3d" : str(s.background);

  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  #HomePillars-${id} .ra-home-pillars__header {
    max-width: 640px;
    margin-left: auto;
    margin-right: auto;
  }
  #HomePillars-${id}.ra-publication__section {
    padding-top: 56px;
    padding-bottom: 64px;
    background: ${bg};
    border-top-color: transparent;
  }
  #HomePillars-${id} .ra-section-header__title,
  #HomePillars-${id} .ra-section-header__eyebrow,
  #HomePillars-${id} .ra-section-header__text {
    color: #fff;
  }
  @media screen and (max-width: 749px) {
    #HomePillars-${id}.ra-publication__section {
      padding-top: 44px;
      padding-bottom: 48px;
    }
  }
`,
        }}
      />
      <section className="ra-publication ra-publication__section" id={`HomePillars-${id}`}>
        <div className="ra-publication__section-inner">
          <div className="ra-section-header ra-text-center ra-home-pillars__header">
            {!isBlank(s.eyebrow) && <p className="ra-section-header__eyebrow">{s.eyebrow}</p>}
            <h2 className="ra-section-header__title">{s.heading}</h2>
            {!isBlank(s.intro) && <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: str(s.intro) }} />}
          </div>

          <div className="ra-publication__pillars">
            {order.map((bid) => {
              const b = section.blocks?.[bid]?.settings ?? {};
              return (
                <article className="ra-publication__pillar" key={bid}>
                  <span className="ra-publication__pillar-number">{b.label}</span>
                  <h3 className="ra-publication__pillar-title">{b.heading}</h3>
                  <div className="ra-publication__pillar-text" dangerouslySetInnerHTML={{ __html: str(b.body) }} />
                  {!isBlank(b.link_label) && !isBlank(b.link_url) && (
                    <p style={{ margin: "20px 0 0" }}>
                      <a className="ra-text-link" href={b.link_url}>{b.link_label}</a>
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
