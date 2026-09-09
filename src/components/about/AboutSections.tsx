/** Ports of the small About sections: about-philosophy, about-mission, about-pillars, about-story, about-founder, about-cta.
 *  All styled by src/styles/rep-america-about.css. */

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
const Html = ({ className, html }: { className?: string; html: unknown }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: str(html) }} />
);

type Settings = Record<string, unknown>;
export interface BlockSection { settings: Settings; blocks?: Record<string, { type: string; settings: Settings }>; block_order?: string[] }
const blocksOf = (s: BlockSection) => (s.block_order ?? Object.keys(s.blocks ?? {})).map((bid) => ({ bid, b: s.blocks?.[bid]?.settings ?? {} }));

const Wrap = ({ id, children }: { id: string; children: React.ReactNode }) => (
  <section id={`shopify-section-${id}`} className="shopify-section">{children}</section>
);

/** sections/about-philosophy.liquid */
export function AboutPhilosophy({ id, settings: s }: { id: string; settings: Settings }) {
  const labels = ["Stronger Individuals", "Stronger Families", "Stronger Communities", "Stronger America"];
  return (
    <Wrap id={id}>
      <section className="ra-about ra-about-philosophy">
        <div className="ra-about__shell">
          <div className="ra-about-philosophy__intro">
            <div>
              <p className="ra-about__eyebrow">{str(s.kicker)}</p>
              <h2 className="ra-about__section-heading">{str(s.heading)}</h2>
            </div>
            <Html className="ra-about__body" html={s.intro} />
          </div>
          <div className="ra-about-philosophy__chain" aria-label="Rep America philosophy">
            {labels.map((label, i) => (
              <div className="ra-about-philosophy__item" key={label}>
                <span className="ra-about-philosophy__number">0{i + 1}</span>
                <span className="ra-about-philosophy__label">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Wrap>
  );
}

/** sections/about-mission.liquid */
export function AboutMission({ id, settings: s }: { id: string; settings: Settings }) {
  return (
    <Wrap id={id}>
      <section className="ra-about ra-about-mission">
        <div className="ra-about__shell">
          <p className="ra-about__eyebrow">{str(s.eyebrow)}</p>
          <h2 className="ra-about__section-heading">{str(s.heading)}</h2>
          <Html className="ra-about__body ra-about-mission__body" html={s.body} />
        </div>
      </section>
    </Wrap>
  );
}

/** sections/about-pillars.liquid */
export function AboutPillars({ id, section }: { id: string; section: BlockSection }) {
  const s = section.settings;
  return (
    <Wrap id={id}>
      <section className="ra-about ra-about-pillars">
        <div className="ra-about__shell">
          <div className="ra-about-pillars__header">
            <div>
              <p className="ra-about__eyebrow">{str(s.eyebrow)}</p>
              <h2 className="ra-about__section-heading">{str(s.heading)}</h2>
            </div>
            <Html className="ra-about__body" html={s.intro} />
          </div>
          <div className="ra-about-pillars__grid">
            {blocksOf(section).map(({ bid, b }) => (
              <article className="ra-about-pillars__card" key={bid}>
                <span className="ra-about-pillars__index">{str(b.label)}</span>
                <h3>{str(b.heading)}</h3>
                <Html html={b.body} />
              </article>
            ))}
          </div>
        </div>
      </section>
    </Wrap>
  );
}

/** sections/about-story.liquid */
export function AboutStory({ id, settings: s }: { id: string; settings: Settings }) {
  return (
    <Wrap id={id}>
      <section className="ra-about ra-about-story">
        <div className="ra-about__shell">
          <div className="ra-about-story__grid">
            <div>
              <p className="ra-about__eyebrow">{str(s.eyebrow)}</p>
              <h2 className="ra-about__section-heading">{str(s.heading)}</h2>
              <Html className="ra-about__body" html={s.body} />
            </div>
            <div className="ra-about-story__media">
              {!isBlank(s.image) && <img src={str(s.image)} loading="lazy" sizes="(min-width: 901px) 50vw, 100vw" alt="" />}
            </div>
          </div>
        </div>
      </section>
    </Wrap>
  );
}

/** sections/about-founder.liquid — with no image the grid collapses to one column (`--solo`). */
export function AboutFounder({ id, settings: s }: { id: string; settings: Settings }) {
  const hasImage = !isBlank(s.image);
  return (
    <Wrap id={id}>
      <section className={`ra-about ra-about-founder${hasImage ? "" : " ra-about-founder--solo"}`}>
        <div className="ra-about__shell">
          <div className="ra-about-founder__grid">
            {hasImage && (
              <div className="ra-about-founder__media">
                <img src={str(s.image)} loading="lazy" sizes="(min-width: 901px) 40vw, 100vw" alt="" />
              </div>
            )}
            <div>
              <p className="ra-about__eyebrow">{str(s.eyebrow)}</p>
              <h2 className="ra-about__section-heading">{str(s.heading)}</h2>
              <Html className="ra-about__body" html={s.body} />
              <div className="ra-about-founder__signature">
                <strong>{str(s.name)}</strong>
                <span>{str(s.role)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      <style
        dangerouslySetInnerHTML={{
          __html: `
  .ra-about-founder--solo .ra-about-founder__grid {
    grid-template-columns: 1fr;
  }
  .ra-about-founder--solo .ra-about__body,
  .ra-about-founder--solo .ra-about__section-heading {
    max-width: 780px;
  }
`,
        }}
      />
    </Wrap>
  );
}

/** sections/about-cta.liquid */
export function AboutCta({ id, settings: s }: { id: string; settings: Settings }) {
  return (
    <Wrap id={id}>
      <section className="ra-about ra-about-cta">
        <div className="ra-about__shell">
          <div className="ra-about-cta__inner">
            <p className="ra-about__eyebrow">{str(s.eyebrow)}</p>
            <h2 className="ra-about__section-heading">{str(s.heading)}</h2>
            <Html className="ra-about__body ra-about-cta__body" html={s.body} />
            {!isBlank(s.button_label) && !isBlank(s.button_link) && (
              <a className="ra-about-cta__button" href={str(s.button_link)}>{str(s.button_label)}</a>
            )}
          </div>
        </div>
      </section>
    </Wrap>
  );
}
