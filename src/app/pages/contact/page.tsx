import type { Metadata } from "next";
import { getPage, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { ContactForm, ContactHero, ContactIntro, type ContactFormState } from "@/components/contact/ContactSections";

export const revalidate = 300;

interface Section { type: string; disabled?: boolean; settings: Record<string, unknown> }
interface Template { sections: Record<string, Section>; order: string[] }
type SearchParams = Record<string, string | string[] | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  return buildMetadata({
    title: page?.seo_title || page?.title || "Contact",
    description: page?.seo_description ?? null,
    path: "/pages/contact",
  });
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Status handed back by /api/contact in the query string (progressive enhancement: plain HTML form POST + redirect). */
function formState(sp: SearchParams): ContactFormState {
  const values = { name: one(sp.name), email: one(sp.email), phone: one(sp.phone), body: one(sp.body) };
  if (one(sp.posted) === "true") return { posted: true };
  switch (one(sp.error)) {
    case "invalid":
      return { error: "is invalid", values };
    case "unavailable":
      return { notice: "The contact form isn't available right now. Please email team@repamerica.com directly.", values };
    case "failed":
      return { notice: "We couldn't send your message. Please try again or email team@repamerica.com.", values };
    default:
      return {};
  }
}

export default async function ContactPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [template, sp] = await Promise.all([getSetting<Template>("template:page.contact"), searchParams]);
  const state = formState(sp);
  // `main` (main-page) is disabled in the template, so the page body is not rendered.
  const sections = orderedSections(template).filter(({ section }) => section && !section.disabled);

  return (
    <>
      {sections.map(({ id, section }) => {
        const sid = `template--page.contact__${id}`;
        switch (section.type) {
          case "contact-hero":
            return <ContactHero key={id} id={sid} settings={section.settings} />;
          case "contact-intro":
            return <ContactIntro key={id} id={sid} settings={section.settings} />;
          case "contact-form":
            return <ContactForm key={id} id={sid} settings={section.settings} state={state} />;
          default:
            return null;
        }
      })}
    </>
  );
}
