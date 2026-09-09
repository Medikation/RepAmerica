import type { Article } from "@/lib/data";
import GreatBooksIndexRow from "./GreatBooksIndexRow";
import { inCategory } from "./meta";

/** Port of sections/great-books-list.liquid. `articles` must be the blog in reading order (ascending published_at);
 *  rows are filtered to `list_category` and numbered at render, exactly as the Liquid does. */
export interface GreatBooksListSettings {
  blog?: string;
  list_category?: string;
  heading?: string;
  intro?: string;
  limit?: number;
}

export default function GreatBooksList({ id, settings, articles }: { id: string; settings: GreatBooksListSettings; articles: Article[] }) {
  const rows = inCategory(articles, settings.list_category ?? "Great Books");
  return (
    <section className="ra-section ra-gb-list" id={`GreatBooksList-${id}`}>
      <div className="ra-container-md">
        <div className="ra-gb-list__header">
          {settings.heading && <h2 className="ra-section-header__title ra-gb-list__heading">{settings.heading}</h2>}
          {settings.intro && <div className="ra-gb-list__intro" dangerouslySetInnerHTML={{ __html: settings.intro }} />}
        </div>

        {settings.blog && (
          <ol className="ra-gb-index">
            {rows.map((article, i) => (
              <GreatBooksIndexRow key={article.handle} article={article} num={i + 1} />
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
