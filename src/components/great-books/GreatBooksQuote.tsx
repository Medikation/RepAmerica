/** Port of sections/great-books-quote.liquid */
export default function GreatBooksQuote({ id, settings }: { id: string; settings: { text?: string } }) {
  return (
    <section className="ra-section ra-gb-quote" id={`GreatBooksQuote-${id}`}>
      <div className="ra-container-sm">
        <p className="ra-gb-quote__text">{settings.text ?? ""}</p>
      </div>
    </section>
  );
}
