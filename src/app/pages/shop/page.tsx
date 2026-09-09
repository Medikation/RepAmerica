import type { Metadata } from "next";
import { getArticles, getCollection, getPage, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import WorkshopHero, { type WorkshopHeroSettings } from "@/components/workshop/WorkshopHero";
import WorkshopCollection, { type WorkshopIntroSettings } from "@/components/workshop/WorkshopCollection";
import FeaturedCollection, { type FeaturedCollectionSettings } from "@/components/workshop/FeaturedCollection";
import WorkshopEssentialsIntro, { type WorkshopEssentialsIntroSettings } from "@/components/workshop/WorkshopEssentialsIntro";
import WorkshopEssentialsList, { type WorkshopEssentialsListSettings } from "@/components/workshop/WorkshopEssentialsList";
import WorkshopDisclaimer from "@/components/workshop/WorkshopDisclaimer";
import WorkshopCta, { type WorkshopCtaSettings } from "@/components/workshop/WorkshopCta";

export const revalidate = 300;

interface Section { type: string; disabled?: boolean; settings: Record<string, unknown> }
interface Template { sections: Record<string, Section>; order: string[] }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("shop");
  return buildMetadata({
    title: page?.seo_title ?? page?.title ?? "Shop",
    noSuffix: Boolean(page?.seo_title),
    description: page?.seo_description,
    path: "/pages/shop",
    shareKey: "workshop",
  });
}

/** The Workshop — port of templates/page.shop.json, sections rendered in template order. */
export default async function ShopPage() {
  const [template, page, essentials] = await Promise.all([
    getSetting<Template>("template:page.shop"),
    getPage("shop"),
    getArticles("essentials"), // ascending = the Liquid's `| reverse`
  ]);

  const sections = orderedSections(template);
  const collectionHandles = Array.from(new Set(
    sections.filter(({ section }) => section?.type === "featured-collection" && !section.disabled)
      .map(({ section }) => String(section.settings.collection ?? ""))
      .filter(Boolean),
  ));
  const collections = Object.fromEntries(await Promise.all(collectionHandles.map(async (h) => [h, await getCollection(h)] as const)));

  return (
    <>
      {sections.map(({ id, section }) => {
        if (!section || section.disabled) return null;
        switch (section.type) {
          case "main-page": {
            const s = section.settings as { padding_top?: number; padding_bottom?: number };
            const css = `.section-${id}-padding { padding-top: ${Math.round((s.padding_top ?? 36) * 0.75)}px; padding-bottom: ${Math.round((s.padding_bottom ?? 36) * 0.75)}px; }
@media screen and (min-width: 750px) { .section-${id}-padding { padding-top: ${s.padding_top ?? 36}px; padding-bottom: ${s.padding_bottom ?? 36}px; } }`;
            return (
              <div key={id} id={`shopify-section-${id}`} className="shopify-section">
                <style dangerouslySetInnerHTML={{ __html: css }} />
                <div className={`page-width page-width--narrow section-${id}-padding`}>
                  <h1 className="main-page-title page-title h0">{page?.title}</h1>
                  <div className="rte" dangerouslySetInnerHTML={{ __html: page?.body_html ?? "" }} />
                </div>
              </div>
            );
          }
          case "workshop-hero":
            return <WorkshopHero key={id} id={id} settings={section.settings as WorkshopHeroSettings} />;
          case "workshop-collection":
            return <WorkshopCollection key={id} id={id} settings={section.settings as WorkshopIntroSettings} />;
          case "featured-collection": {
            const s = section.settings as FeaturedCollectionSettings;
            return <FeaturedCollection key={id} id={id} settings={s} collection={s.collection ? collections[s.collection] ?? null : null} />;
          }
          case "workshop-essentials-intro":
            return <WorkshopEssentialsIntro key={id} id={id} settings={section.settings as WorkshopEssentialsIntroSettings} />;
          case "workshop-essentials-list":
            return <WorkshopEssentialsList key={id} id={id} settings={section.settings as WorkshopEssentialsListSettings} articles={essentials} />;
          case "workshop-disclaimer":
            return <WorkshopDisclaimer key={id} id={id} settings={section.settings as { text?: string }} />;
          case "workshop-cta":
            return <WorkshopCta key={id} id={id} settings={section.settings as WorkshopCtaSettings} />;
          default:
            return null;
        }
      })}
    </>
  );
}
