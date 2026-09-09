/** Ports of sections/contact-hero.liquid, contact-intro.liquid and contact-form.liquid. */

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
const isBlank = (v: unknown) => v == null || (typeof v === "string" && v.trim() === "");
type Settings = Record<string, unknown>;

/** Strings from locales/en.default.json → templates.contact.form */
export const CONTACT_T = {
  title: "Contact form",
  name: "Name",
  email: "Email",
  phone: "Phone number",
  comment: "Comment",
  post_success: "Thanks for contacting us. We'll get back to you as soon as possible.",
  error_heading: "Please adjust the following:",
  accessibility_error: "Error",
};

const IconSuccess = () => (
  <svg className="icon icon-success" viewBox="0 0 13 13">
    <path fill="#428445" stroke="#fff" strokeWidth=".7" d="M6.5 12.35a5.85 5.85 0 1 0 0-11.7 5.85 5.85 0 0 0 0 11.7Z" />
    <path stroke="#fff" d="m5.533 8.664 3.72-3.982M4.106 6.769l2.032 1.857" />
  </svg>
);
const IconError = () => (
  <svg className="icon icon-error" viewBox="0 0 13 13">
    <circle cx="6.5" cy="6.5" r="5.5" stroke="#fff" strokeWidth="2" />
    <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" strokeWidth=".7" />
    <path fill="#fff" d="m5.874 3.528.1 4.044h1.053l.1-4.044zm.627 6.133c.38 0 .68-.288.68-.656s-.3-.656-.68-.656-.681.288-.681.656.3.656.68.656" />
    <path fill="#fff" stroke="#EB001B" strokeWidth=".7" d="M5.874 3.178h-.359l.01.359.1 4.044.008.341h1.736l.008-.341.1-4.044.01-.359H5.873Zm.627 6.833c.56 0 1.03-.432 1.03-1.006s-.47-1.006-1.03-1.006-1.031.432-1.031 1.006.47 1.006 1.03 1.006Z" />
  </svg>
);

export function ContactHero({ id, settings: s }: { id: string; settings: Settings }) {
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  #ContactHero-${id} {
    padding-bottom: var(--ra-space-lg);
  }
  #ContactHero-${id} .ra-section-header {
    margin-bottom: 0;
  }
  #ContactHero-${id} .ra-section-header__eyebrow {
    color: #c62436;
  }
`,
        }}
      />
      <section className="ra-section ra-contact-hero" id={`ContactHero-${id}`}>
        <div className="ra-container">
          <div className="ra-section-header">
            {!isBlank(s.eyebrow) && <p className="ra-section-header__eyebrow">{str(s.eyebrow)}</p>}
            <h1 className="ra-section-header__title">{str(s.heading)}</h1>
            {!isBlank(s.text) && <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: str(s.text) }} />}
          </div>
        </div>
      </section>
    </section>
  );
}

export function ContactIntro({ id, settings: s }: { id: string; settings: Settings }) {
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  #ContactIntro-${id}.ra-section {
    padding-top: var(--ra-space-md);
  }
  #ContactIntro-${id} .ra-intro__text {
    margin-left: 0;
    max-width: 640px;
    text-align: left;
  }
`,
        }}
      />
      <section className="ra-section ra-intro" id={`ContactIntro-${id}`}>
        <div className="ra-container">
          <div className="ra-intro__text" dangerouslySetInnerHTML={{ __html: str(s.text) }} />
        </div>
      </section>
    </section>
  );
}

export interface ContactFormState {
  posted?: boolean;
  /** Error message for the email field (shown like Shopify's form.errors). */
  error?: string;
  /** Message unrelated to a field (e.g. the mailer is not configured). */
  notice?: string;
  values?: { name?: string; email?: string; phone?: string; body?: string };
}

export function ContactForm({ id, settings: s, state }: { id: string; settings: Settings; state: ContactFormState }) {
  const pt = Number(s.padding_top ?? 36);
  const pb = Number(s.padding_bottom ?? 36);
  const scheme = str(s.color_scheme) || "scheme-1";
  const v = state.values ?? {};
  const hasError = !!state.error;

  return (
    <section id={`shopify-section-${id}`} className="shopify-section section">
      <style
        dangerouslySetInnerHTML={{
          __html: `
  .section-${id}-padding {
    padding-top: ${Math.round(pt * 0.75)}px;
    padding-bottom: ${Math.round(pb * 0.75)}px;
  }
  @media screen and (min-width: 750px) {
    .section-${id}-padding {
      padding-top: ${pt}px;
      padding-bottom: ${pb}px;
    }
    #shopify-section-${id} .contact.page-width--narrow {
      max-width: 640px;
    }
  }
`,
        }}
      />
      <div className={`color-${scheme} gradient`}>
        <div className={`contact page-width page-width--narrow section-${id}-padding`}>
          {!isBlank(s.heading) ? (
            <h2 className={`title title-wrapper--no-top-margin inline-richtext ${str(s.heading_size)}`} dangerouslySetInnerHTML={{ __html: str(s.heading) }} />
          ) : (
            <h2 className="visually-hidden">{CONTACT_T.title}</h2>
          )}
          <form method="post" action="/api/contact#ContactForm" id="ContactForm" acceptCharset="UTF-8" className="isolate">
            <input type="hidden" name="form_type" value="contact" />
            <input type="hidden" name="utf8" value="✓" />
            {state.posted ? (
              <h2 className="form-status form-status-list form__message" tabIndex={-1} autoFocus>
                <IconSuccess />
                {CONTACT_T.post_success}
              </h2>
            ) : hasError || state.notice ? (
              <>
                <div className="form__message">
                  <h2 className="form-status caption-large text-body" role="alert" tabIndex={-1} autoFocus>
                    <IconError />
                    {CONTACT_T.error_heading}
                  </h2>
                </div>
                <ul className="form-status-list caption-large" role="list">
                  {hasError && (
                    <li>
                      <a href="#ContactForm-email" className="link">{CONTACT_T.email} {state.error}</a>
                    </li>
                  )}
                  {state.notice && <li>{state.notice}</li>}
                </ul>
              </>
            ) : null}
            <div className="contact__fields">
              <div className="field">
                <input className="field__input" autoComplete="name" type="text" id="ContactForm-name" name={`contact[${CONTACT_T.name}]`} defaultValue={v.name ?? ""} placeholder={CONTACT_T.name} />
                <label className="field__label" htmlFor="ContactForm-name">{CONTACT_T.name}</label>
              </div>
              <div className="field field--with-error">
                <input
                  autoComplete="email"
                  type="email"
                  id="ContactForm-email"
                  className="field__input"
                  name="contact[email]"
                  spellCheck={false}
                  autoCapitalize="off"
                  defaultValue={v.email ?? ""}
                  aria-required="true"
                  aria-invalid={hasError ? "true" : undefined}
                  aria-describedby={hasError ? "ContactForm-email-error" : undefined}
                  placeholder={CONTACT_T.email}
                />
                <label className="field__label" htmlFor="ContactForm-email">
                  {CONTACT_T.email}
                  <span aria-hidden="true">*</span>
                </label>
                {hasError && (
                  <small className="contact__field-error" id="ContactForm-email-error">
                    <span className="visually-hidden">{CONTACT_T.accessibility_error}</span>
                    <span className="form__message">
                      <span className="svg-wrapper"><IconError /></span>
                      {CONTACT_T.email} {state.error}
                    </span>
                  </small>
                )}
              </div>
            </div>
            <div className="field">
              <input type="tel" id="ContactForm-phone" className="field__input" autoComplete="tel" name={`contact[${CONTACT_T.phone}]`} pattern="[0-9\-]*" defaultValue={v.phone ?? ""} placeholder={CONTACT_T.phone} />
              <label className="field__label" htmlFor="ContactForm-phone">{CONTACT_T.phone}</label>
            </div>
            <div className="field">
              <textarea rows={10} id="ContactForm-body" className="text-area field__input" name={`contact[${CONTACT_T.comment}]`} placeholder={CONTACT_T.comment} defaultValue={v.body ?? ""} />
              <label className="form__label field__label" htmlFor="ContactForm-body">{CONTACT_T.comment}</label>
            </div>
            <div className="contact__button">
              <button type="submit" className="button">Send Message</button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
