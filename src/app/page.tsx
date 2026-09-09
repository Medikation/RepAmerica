import type { Metadata } from "next";
import { getArticles, getSetting, orderedSections, type Blog } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import HomeHero, { type HomeHeroSettings } from "@/components/home/HomeHero";
import HomeProjectIntro, { type HomeProjectIntroSettings } from "@/components/home/HomeProjectIntro";
import HomeWorkshopIntro, { type HomeWorkshopIntroSection } from "@/components/home/HomeWorkshopIntro";
import HomeLatest, { type HomeLatestSettings } from "@/components/home/HomeLatest";
import HomePillars, { type HomePillarsSection } from "@/components/home/HomePillars";
import HomeCta, { type HomeCtaSettings } from "@/components/home/HomeCta";

export const revalidate = 300;

interface Section { type: string; disabled?: boolean; settings: Record<string, unknown>; blocks?: Record<string, { type: string; settings: Record<string, unknown> }>; block_order?: string[] }
interface Template { sections: Record<string, Section>; order: string[] }

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/", shareKey: "home" });
}

const asBlog = (v: unknown): Blog => (v === "watch" || v === "great-books" || v === "essentials" ? v : "watch");

async function HomeSection({ id, section }: { id: string; section: Section }) {
  const sid = `template--index__${id}`;
  switch (section.type) {
    case "home-hero": {
      const s = section.settings as HomeHeroSettings;
      const latest = (await getArticles(asBlog(s.video_blog), { desc: true }))[0] ?? null;
      return <HomeHero id={sid} settings={s} latest={latest} />;
    }
    case "home-project-intro":
      return <HomeProjectIntro id={sid} settings={section.settings as HomeProjectIntroSettings} />;
    case "home-workshop-intro":
      return <HomeWorkshopIntro id={sid} section={section as unknown as HomeWorkshopIntroSection} />;
    case "home-latest": {
      const s = section.settings as HomeLatestSettings;
      const articles = await getArticles(asBlog(s.blog), { desc: true });
      return <HomeLatest id={sid} settings={s} articles={articles} />;
    }
    case "home-pillars":
      return <HomePillars id={sid} section={section as unknown as HomePillarsSection} />;
    case "home-cta":
      return <HomeCta id={sid} settings={section.settings as HomeCtaSettings} />;
    default:
      return null;
  }
}

export default async function HomePage() {
  const template = await getSetting<Template>("template:index");
  const sections = orderedSections(template).filter(({ section }) => section && !section.disabled);
  return (
    <>
      {sections.map(({ id, section }) => (
        <HomeSection key={id} id={id} section={section} />
      ))}
    </>
  );
}
