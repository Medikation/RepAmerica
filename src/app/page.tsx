import type { Metadata } from "next";
import { cache } from "react";
import { getArticles, getCollection, getSetting, orderedSections, type Blog } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import HomeHero, { type HomeHeroSettings } from "@/components/home/HomeHero";
import HomeMediaHero, { type HomeMediaHeroSettings } from "@/components/home/HomeMediaHero";
import { pickHeroArticles } from "@/components/home/pickHero";
import HomeProjectIntro, { type HomeProjectIntroSettings } from "@/components/home/HomeProjectIntro";
import HomeWorkshopIntro, { type HomeWorkshopIntroSection } from "@/components/home/HomeWorkshopIntro";
import HomeLatest, { type HomeLatestSettings } from "@/components/home/HomeLatest";
import HomePillars, { type HomePillarsSection } from "@/components/home/HomePillars";
import HomeCta, { type HomeCtaSettings } from "@/components/home/HomeCta";

export const revalidate = 300;

interface Section { type: string; disabled?: boolean; settings: Record<string, unknown>; blocks?: Record<string, { type: string; settings: Record<string, unknown> }>; block_order?: string[] }
interface Template { sections: Record<string, Section>; order: string[] }

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({ path: "/", shareKey: "home", title: "Rep America with Medi: Commentary, Great Books, American Made Products", noSuffix: true });
}

const asBlog = (v: unknown): Blog => (v === "watch" || v === "great-books" || v === "essentials" ? v : "watch");

/** Round 82: the media hero's three videos, shared with home-latest so the grid skips them. Memoised per request by `cache`. */
const heroVideos = cache(async (blog: Blog) => pickHeroArticles(await getArticles(blog, { desc: true }), 3));

async function HomeSection({ id, section, heroBlog }: { id: string; section: Section; heroBlog: Blog | null }) {
  const sid = `template--index__${id}`;
  switch (section.type) {
    case "home-hero": {
      const s = section.settings as HomeHeroSettings;
      const latest = (await getArticles(asBlog(s.video_blog), { desc: true }))[0] ?? null;
      return <HomeHero id={sid} settings={s} latest={latest} />;
    }
    case "home-media-hero": {
      const s = section.settings as HomeMediaHeroSettings & { video_blog?: string; hats_collection?: string };
      const videos = await heroVideos(asBlog(s.video_blog));
      const col = await getCollection(s.hats_collection || "rep-america");
      const hats = (col?.products ?? []).filter((p) => p.is_published).slice(0, 3);
      return <HomeMediaHero id={sid} settings={s} videos={videos} hats={hats} />;
    }
    case "home-project-intro":
      return <HomeProjectIntro id={sid} settings={section.settings as HomeProjectIntroSettings} />;
    case "home-workshop-intro":
      return <HomeWorkshopIntro id={sid} section={section as unknown as HomeWorkshopIntroSection} />;
    case "home-latest": {
      const s = section.settings as HomeLatestSettings;
      const articles = await getArticles(asBlog(s.blog), { desc: true });
      const exclude = heroBlog && heroBlog === asBlog(s.blog) ? (await heroVideos(heroBlog)).map((a) => a.id) : [];
      return <HomeLatest id={sid} settings={s} articles={articles} exclude={exclude} />;
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
  // Round 82: the homepage layout lives in settings key "template:index-v2" (media hero + hat rail + tabbed Recent Content);
  // "template:index" is the pre-Round-82 layout, kept as the fallback / rollback.
  const v2 = await getSetting<Template>("template:index-v2").catch(() => null);
  const template = v2 && v2.order ? v2 : await getSetting<Template>("template:index");
  const sections = orderedSections(template).filter(({ section }) => section && !section.disabled);
  const hero = sections.find(({ section }) => section.type === "home-media-hero");
  const heroBlog = hero ? asBlog((hero.section.settings as { video_blog?: string }).video_blog) : null;
  return (
    <>
      {sections.map(({ id, section }) => (
        <HomeSection key={id} id={id} section={section} heroBlog={heroBlog} />
      ))}
    </>
  );
}
