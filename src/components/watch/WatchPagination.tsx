const CaretIcon = () => (
  <svg className="icon icon-caret" viewBox="0 0 10 6"><path fill="currentColor" fillRule="evenodd" d="M9.354.646a.5.5 0 0 0-.708 0L5 4.293 1.354.646a.5.5 0 0 0-.708.708l4 4a.5.5 0 0 0 .708 0l4-4a.5.5 0 0 0 0-.708" clipRule="evenodd"/></svg>
);

/** Port of snippets/pagination.liquid for `{% paginate %}` (Shopify's `?page=N` URLs). Renders nothing for a single page. */
export default function WatchPagination({ basePath, current, pages }: { basePath: string; current: number; pages: number }) {
  if (pages <= 1) return null;
  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);

  // Shopify's paginate.parts: 1, ..., window around current, ..., last (with "…" gaps rendered as plain spans).
  const parts: (number | "…")[] = [];
  const push = (n: number) => { if (!parts.includes(n)) parts.push(n); };
  push(1);
  if (current - 2 > 2) parts.push("…");
  for (let n = Math.max(2, current - 2); n <= Math.min(pages - 1, current + 2); n++) push(n);
  if (current + 2 < pages - 1) parts.push("…");
  push(pages);

  return (
    <div className="pagination-wrapper" data-page={current}>
      <nav className="pagination" role="navigation" aria-label="Pagination">
        <ul className="pagination__list list-unstyled" role="list">
          {current > 1 ? (
            <li>
              <a href={href(current - 1)} className="pagination__item pagination__item--next pagination__item-arrow link motion-reduce" aria-label="Previous page">
                <span className="svg-wrapper"><CaretIcon /></span>
              </a>
            </li>
          ) : null}
          {parts.map((p, i) => (
            <li key={i}>
              {p === "…" ? (
                <span className="pagination__item">…</span>
              ) : p === current ? (
                <a role="link" aria-disabled="true" className="pagination__item pagination__item--current light" aria-current="page" aria-label={`Page ${p}`}>{p}</a>
              ) : (
                <a href={href(p)} className="pagination__item link" aria-label={`Page ${p}`}>{p}</a>
              )}
            </li>
          ))}
          {current < pages ? (
            <li>
              <a href={href(current + 1)} className="pagination__item pagination__item--prev pagination__item-arrow link motion-reduce" aria-label="Next page">
                <span className="svg-wrapper"><CaretIcon /></span>
              </a>
            </li>
          ) : null}
        </ul>
      </nav>
    </div>
  );
}
