import type { Metadata } from "next";
import { getArticles, getCollection, getPage, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import GreatBooksHero, { type GreatBooksHeroSettings } from "@/components/great-books/GreatBooksHero";
import GreatBooksIntro, { type GreatBooksIntroSection } from "@/components/great-books/GreatBooksIntro";
import GreatBooksList, { type GreatBooksListSettings } from "@/components/great-books/GreatBooksList";
import GreatBooksQuote from "@/components/great-books/GreatBooksQuote";
import FeaturedEntries, { type FeaturedEntriesSection } from "@/components/great-books/FeaturedEntries";
import HomeShop from "@/components/great-books/HomeShop";
import HomeCollection, { type HomeCollectionSettings } from "@/components/great-books/HomeCollection";
import GreatBooksVideos, { type GreatBooksVideosSettings } from "@/components/great-books/GreatBooksVideos";

export const revalidate = 300;

interface TemplateSection {
  type: string;
  disabled?: boolean;
  settings: Record<string, unknown>;
  blocks?: Record<string, { type: string; settings: Record<string, unknown> }>;
  block_order?: string[];
}
interface Template {
  sections: Record<string, TemplateSection>;
  order: string[];
}

const HANDLE = "great-books-project";
const TEMPLATE_KEY = "template:page.great-books";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage(HANDLE);
  return buildMetadata({
    title: page?.seo_title || page?.title || "The Great Books Project",
    description: page?.seo_description ?? null,
    path: `/pages/${HANDLE}`,
    shareKey: "great_books",
  });
}

/** Port of templates/page.great-books.json. Sections render in `order`; "main" (main-page) is disabled in the template. */
export default async function GreatBooksProjectPage() {
  const [template, articles, page, watch] = await Promise.all([getSetting<Template>(TEMPLATE_KEY), getArticles("great-books"), getPage(HANDLE), getArticles("watch", { desc: true })]);

  const sections = orderedSections(template).filter(({ section }) => !section.disabled);

  const collectionHandles = sections.filter((s) => s.section.type === "home-collection").map((s) => String(s.section.settings.collection ?? ""));
  const collections = Object.fromEntries(await Promise.all(collectionHandles.map(async (h) => [h, await getCollection(h)] as const)));

  return (
    <>
      {sections.map(({ id, section }) => {
        const sectionId = `template--page-great-books__${id}`;
        switch (section.type) {
          case "main-page": {
            const pt = Number(section.settings.padding_top ?? 36);
            const pb = Number(section.settings.padding_bottom ?? 36);
            const style = `
  .section-${sectionId}-padding { padding-top: ${Math.round(pt * 0.75)}px; padding-bottom: ${Math.round(pb * 0.75)}px; }
  @media screen and (min-width: 750px) { .section-${sectionId}-padding { padding-top: ${pt}px; padding-bottom: ${pb}px; } }
`;
            return (
              <section key={id} id={`shopify-section-${sectionId}`} className="shopify-section section">
                <style dangerouslySetInnerHTML={{ __html: style }} />
                <div className={`page-width page-width--narrow section-${sectionId}-padding`}>
                  <h1 className="main-page-title page-title h0">{page?.title ?? ""}</h1>
                  <div className="rte" dangerouslySetInnerHTML={{ __html: page?.body_html ?? "" }} />
                </div>
              </section>
            );
          }
          case "great-books-hero":
            return (
              <section key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <GreatBooksHero id={sectionId} settings={section.settings as GreatBooksHeroSettings} />
              </section>
            );
          case "great-books-intro":
            return (
              <div key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <GreatBooksIntro id={sectionId} section={section as unknown as GreatBooksIntroSection} />
              </div>
            );
          case "great-books-list":
            return (
              <div key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <GreatBooksList id={sectionId} settings={section.settings as GreatBooksListSettings} articles={articles} />
              </div>
            );
          case "great-books-quote":
            return (
              <div key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <GreatBooksQuote id={sectionId} settings={section.settings as { text?: string }} />
              </div>
            );
          case "featured-entries":
            return (
              <section key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <FeaturedEntries id={sectionId} section={section as unknown as FeaturedEntriesSection} articles={articles} />
              </section>
            );
          case "great-books-videos":
            return (
              <div key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <GreatBooksVideos id={sectionId} settings={section.settings as GreatBooksVideosSettings} watch={watch} />
              </div>
            );
          case "home-shop":
            return (
              <section key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <HomeShop id={sectionId} settings={section.settings as { eyebrow?: string; heading?: string; badges?: string }} />
              </section>
            );
          case "home-collection": {
            const settings = section.settings as HomeCollectionSettings;
            const collection = collections[String(settings.collection ?? "")];
            return (
              <section key={id} id={`shopify-section-${sectionId}`} className="shopify-section">
                <HomeCollection id={sectionId} settings={settings} products={collection?.products ?? []} />
              </section>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
