"use client";

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";

// Dawn's <share-button> custom element (declared here so this file stays self-contained; the
// products agent's custom-elements.d.ts declares the others the same way).
declare global {
  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "share-button": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
      }
    }
  }
}

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-share" viewBox="0 0 13 12"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" d="M1.625 8.125v2.167a1.083 1.083 0 0 0 1.083 1.083h7.584a1.083 1.083 0 0 0 1.083-1.083V8.125"/><path fill="currentColor" fillRule="evenodd" d="M6.148 1.271a.5.5 0 0 1 .707 0L9.563 3.98a.5.5 0 0 1-.707.707L6.501 2.332 4.147 4.687a.5.5 0 1 1-.708-.707z" clipRule="evenodd"/><path fill="currentColor" fillRule="evenodd" d="M6.5 1.125a.5.5 0 0 1 .5.5v6.5a.5.5 0 0 1-1 0v-6.5a.5.5 0 0 1 .5-.5" clipRule="evenodd"/></svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-close" viewBox="0 0 18 17"><path fill="currentColor" d="M.865 15.978a.5.5 0 0 0 .707.707l7.433-7.431 7.579 7.282a.501.501 0 0 0 .846-.37.5.5 0 0 0-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 1 0-.707-.708L8.991 7.853 1.413.573a.5.5 0 1 0-.693.72l7.563 7.268z"/></svg>
);
const ClipboardIcon = () => (
  <svg className="icon icon-clipboard" width="11" height="13" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" viewBox="0 0 11 13">
    <path fillRule="evenodd" clipRule="evenodd" d="M2 1a1 1 0 011-1h7a1 1 0 011 1v9a1 1 0 01-1 1V1H2zM1 2a1 1 0 00-1 1v9a1 1 0 001 1h7a1 1 0 001-1V3a1 1 0 00-1-1H1zm0 10V3h7v9H1z" fill="currentColor"/>
  </svg>
);

/** Port of snippets/share-button.liquid + assets/share.js (Dawn's <share-button> custom element). */
export default function ShareButton({ id, label, shareUrl }: { id: string; label: string; shareUrl: string }) {
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => { setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function"); }, []);

  const copy = () => navigator.clipboard.writeText(shareUrl).then(() => setCopied(true));
  const close = () => { if (details.current) details.current.open = false; setCopied(false); };

  return (
    <share-button id={`Share-${id}`} className="share-button quick-add-hidden">
      <button className={`share-button__button${canShare ? "" : " hidden"}`} type="button" onClick={() => navigator.share({ url: shareUrl, title: document.title })}>
        <span className="svg-wrapper"><ShareIcon /></span>
        {label}
      </button>
      <details id={`Details-share-${id}`} ref={details} hidden={canShare} onToggle={() => { if (!details.current?.open) setCopied(false); }}>
        <summary className="share-button__button">
          <span className="svg-wrapper"><ShareIcon /></span>
          {label}
        </summary>
        <div className="share-button__fallback motion-reduce">
          <div className="field">
            <span id={`ShareMessage-${id}`} className={`share-button__message${copied ? "" : " hidden"}`} role="status">{copied ? "Link copied to clipboard" : " "}</span>
            <input
              type="text"
              className="field__input"
              id={`ShareUrl-${id}`}
              value={shareUrl}
              placeholder="Link"
              onClick={(e) => e.currentTarget.select()}
              readOnly
            />
            <label className="field__label" htmlFor={`ShareUrl-${id}`}>Link</label>
          </div>
          <button className={`share-button__close${copied ? "" : " hidden"}`} type="button" onClick={close}>
            <span className="svg-wrapper"><CloseIcon /></span>
            <span className="visually-hidden">Close share</span>
          </button>
          <button className="share-button__copy" type="button" onClick={copy}>
            <span className="svg-wrapper"><ClipboardIcon /></span>
            <span className="visually-hidden">Copy link</span>
          </button>
        </div>
      </details>
    </share-button>
  );
}
