"use client";
/* The footer newsletter form from sections/footer.liquid (`{% form 'customer' %}`), now POSTing to /api/subscribe.
 * Progressive enhancement: without JS the plain form POST still works (the route answers with a redirect back);
 * with JS we fetch() and show the theme's success / error message inline. Strings: newsletter.* in en.default.json. */
import { useState, type FormEvent } from "react";
import { IconArrow, IconError, IconSuccess } from "./icons";

type Status = { state: "idle" } | { state: "submitting" } | { state: "success" } | { state: "error"; message: string };

export default function NewsletterForm({ sectionId }: { sectionId: string }) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const inputId = `NewsletterForm--${sectionId}`;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = (new FormData(form).get("contact[email]") as string | null)?.trim() ?? "";
    setStatus({ state: "submitting" });
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) {
        setStatus({ state: "success" });
        form.reset();
      } else {
        setStatus({ state: "error", message: body.error ?? "Something went wrong. Please try again." });
      }
    } catch {
      setStatus({ state: "error", message: "Something went wrong. Please try again." });
    }
  }

  const hasError = status.state === "error";
  return (
    <form method="post" action="/api/subscribe" id="ContactFooter" acceptCharset="UTF-8" className="footer__newsletter newsletter-form" onSubmit={onSubmit}>
      <input type="hidden" name="form_type" value="customer" />
      <input type="hidden" name="contact[tags]" value="newsletter" />
      <div className="newsletter-form__field-wrapper">
        <div className="field">
          <input
            id={inputId}
            type="email"
            name="contact[email]"
            className="field__input"
            defaultValue=""
            aria-required="true"
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="email"
            aria-invalid={hasError ? "true" : undefined}
            aria-describedby={hasError ? "ContactFooter-error" : status.state === "success" ? "ContactFooter-success" : undefined}
            placeholder="Email"
            required
          />
          <label className="field__label" htmlFor={inputId}>Email</label>
          <button type="submit" className="newsletter-form__button field__button" name="commit" id="Subscribe" aria-label="Subscribe" disabled={status.state === "submitting"}>
            <span className="svg-wrapper"><IconArrow /></span>
          </button>
        </div>
        {hasError && (
          <small className="newsletter-form__message form__message" id="ContactFooter-error">
            <span className="svg-wrapper"><IconError /></span>
            {status.message}
          </small>
        )}
      </div>
      {status.state === "success" && (
        <h3 className="newsletter-form__message newsletter-form__message--success form__message" id="ContactFooter-success" tabIndex={-1}>
          <span className="svg-wrapper"><IconSuccess /></span>
          Thanks for subscribing
        </h3>
      )}
    </form>
  );
}
