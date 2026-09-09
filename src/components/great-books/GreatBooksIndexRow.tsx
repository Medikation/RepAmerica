import type { Article } from "@/lib/data";
import { articleUrl, editionOf, metaStr } from "./meta";

/** One `<li class="ra-gb-index__row">` — the row markup shared by great-books-list.liquid and the
 *  "Read next" list in great-books-article.liquid. `num` is the position in its list_category. */
export default function GreatBooksIndexRow({ article, num }: { article: Article; num: number }) {
  const author = metaStr(article, "author");
  const edition = editionOf(article);
  const written = metaStr(article, "written_display");
  const buyLink = metaStr(article, "affiliate_url");

  return (
    <li className="ra-gb-index__row">
      <a className="ra-gb-index__link" href={articleUrl(article)}>
        <span className="ra-gb-index__num">{num}</span>
        {article.image_url ? (
          <span className="ra-gb-index__cover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.image_url} alt="" loading="lazy" />
          </span>
        ) : (
          <span className="ra-gb-index__cover ra-gb-index__cover--empty"></span>
        )}
        <span className="ra-gb-index__body">
          <span className="ra-gb-index__title">{article.title}</span>
          <span className="ra-gb-index__meta">
            {author}
            {written && (
              <>
                {" "}
                <span aria-hidden="true">·</span> {written}
              </>
            )}
            {edition && (
              <>
                {" "}
                <span aria-hidden="true">·</span> {edition}
              </>
            )}
          </span>
        </span>
      </a>
      {buyLink && (
        <a
          className="ra-gb-index__buy"
          href={buyLink}
          target="_blank"
          rel="nofollow sponsored noopener"
          aria-label={`View ${article.title} on Amazon — the recommended edition`}
        >
          Amazon
        </a>
      )}
    </li>
  );
}
