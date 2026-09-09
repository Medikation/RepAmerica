// Inline SVGs from ../shopify_export/theme/assets used by the commerce pages (icons.tsx is owned by the header/footer agent).

export const IconCaret = () => (
  <svg className="icon icon-caret" viewBox="0 0 10 6">
    <path fill="currentColor" fillRule="evenodd" d="M9.354.646a.5.5 0 0 0-.708 0L5 4.293 1.354.646a.5.5 0 0 0-.708.708l4 4a.5.5 0 0 0 .708 0l4-4a.5.5 0 0 0 0-.708" clipRule="evenodd" />
  </svg>
);

export const IconMinus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-minus" viewBox="0 0 10 2">
    <path fill="currentColor" fillRule="evenodd" d="M.5 1C.5.7.7.5 1 .5h8a.5.5 0 1 1 0 1H1A.5.5 0 0 1 .5 1" clipRule="evenodd" />
  </svg>
);

export const IconPlus = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-plus" viewBox="0 0 10 10">
    <path fill="currentColor" fillRule="evenodd" d="M1 4.51a.5.5 0 0 0 0 1h3.5l.01 3.5a.5.5 0 0 0 1-.01V5.5l3.5-.01a.5.5 0 0 0-.01-1H5.5L5.49.99a.5.5 0 0 0-1 .01v3.5l-3.5.01z" clipRule="evenodd" />
  </svg>
);

export const IconError = () => (
  <svg className="icon icon-error" viewBox="0 0 13 13">
    <circle cx="6.5" cy="6.5" r="5.5" stroke="#fff" strokeWidth="2" />
    <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" strokeWidth=".7" />
    <path fill="#fff" d="m5.874 3.528.1 4.044h1.053l.1-4.044zm.627 6.133c.38 0 .68-.288.68-.656s-.3-.656-.68-.656-.681.288-.681.656.3.656.68.656" />
    <path fill="#fff" stroke="#EB001B" strokeWidth=".7" d="M5.874 3.178h-.359l.01.359.1 4.044.008.341h1.736l.008-.341.1-4.044.01-.359H5.873Zm.627 6.833c.56 0 1.03-.432 1.03-1.006s-.47-1.006-1.03-1.006-1.031.432-1.031 1.006.47 1.006 1.03 1.006Z" />
  </svg>
);

export const IconInventoryStatus = () => (
  <svg className="icon icon-inventory-status">
    <circle cx="7.5" cy="7.5" r="7.5" fill="currentColor" />
    <circle cx="7.5" cy="7.5" r="5" fill="currentColor" stroke="#FFF" />
  </svg>
);

export const IconArrow = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-arrow" viewBox="0 0 14 10">
    <path fill="currentColor" fillRule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clipRule="evenodd" />
  </svg>
);

export const LoadingSpinner = ({ hidden = true }: { hidden?: boolean }) => (
  <div className={`loading__spinner${hidden ? " hidden" : ""}`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="spinner" viewBox="0 0 66 66">
      <circle strokeWidth="6" cx="33" cy="33" r="30" fill="none" className="path" />
    </svg>
  </div>
);
