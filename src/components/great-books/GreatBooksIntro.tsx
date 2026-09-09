/** Port of sections/great-books-intro.liquid */
export interface GreatBooksIntroSection {
  settings: { text?: string };
  blocks?: Record<string, { type: string; settings: { line?: string } }>;
  block_order?: string[];
}

export default function GreatBooksIntro({ id, section }: { id: string; section: GreatBooksIntroSection }) {
  const blocks = (section.block_order ?? []).map((k) => section.blocks?.[k]).filter(Boolean) as { settings: { line?: string } }[];
  return (
    <section className="ra-section ra-gb-intro" id={`GreatBooksIntro-${id}`}>
      <div className="ra-container-sm">
        <div className="ra-intro__text ra-gb-intro__text" dangerouslySetInnerHTML={{ __html: section.settings.text ?? "" }} />

        {blocks.length > 0 && (
          <ul className="ra-gb-chain" aria-label="How the great books influence one another">
            {blocks.map((b, i) => (
              <li key={i} className="ra-gb-chain__item">
                {b.settings.line}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
