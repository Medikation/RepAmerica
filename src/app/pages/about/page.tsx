import type { Metadata } from "next";
import { getPage, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import AboutHero, { type AboutHeroSettings } from "@/components/about/AboutHero";
import { AboutCta, AboutFounder, AboutMission, AboutPhilosophy, AboutPillars, AboutStory, type BlockSection } from "@/components/about/AboutSections";

export const revalidate = 300;

interface Section extends BlockSection { type: string; disabled?: boolean }
interface Template { sections: Record<string, Section>; order: string[] }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return buildMetadata({
    title: page?.seo_title || page?.title || "About",
    description: page?.seo_description ?? null,
    path: "/pages/about",
    shareKey: "about",
  });
}

export default async function AboutPage() {
  const template = await getSetting<Template>("template:page.about");
  // `main` (main-page: page.title + page.body_html) is disabled in the template, so the page body is not rendered.
  const sections = orderedSections(template).filter(({ section }) => section && !section.disabled);

  return (
    <>
      {sections.map(({ id, section }) => {
        const sid = `template--page.about__${id}`;
        switch (section.type) {
          case "about-hero-cinematic-v4":
            return <AboutHero key={id} id={sid} settings={section.settings as AboutHeroSettings} />;
          case "about-philosophy":
            return <AboutPhilosophy key={id} id={sid} settings={section.settings} />;
          case "about-mission":
            return <AboutMission key={id} id={sid} settings={section.settings} />;
          case "about-pillars":
            return <AboutPillars key={id} id={sid} section={section} />;
          case "about-story":
            return <AboutStory key={id} id={sid} settings={section.settings} />;
          case "about-founder":
            return <AboutFounder key={id} id={sid} settings={section.settings} />;
          case "about-cta":
            return <AboutCta key={id} id={sid} settings={section.settings} />;
          default:
            return null;
        }
      })}
    </>
  );
}
