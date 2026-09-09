import type { Metadata } from "next";
import { getArticles, getPage, getSetting, orderedSections } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import WatchHero, { type WatchHeroSettings } from "@/components/watch/WatchHero";
import WatchGrid, { type WatchCard, type WatchFilter } from "@/components/watch/WatchGrid";
import WatchPagination from "@/components/watch/WatchPagination";
import { handleize, metaString, shortDate, videoId } from "@/components/watch/utils";

export const revalidate = 300;

interface Section {
  type: string;
  disabled?: boolean;
  settings: Record<string, unknown>;
  blocks?: Record<string, { type: string; settings: Record<string, string> }>;
  block_order?: string[];
}
interface Template { sections: Record<string, Section>; order: string[] }

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("watch");
  return buildMetadata({
    title: page?.seo_title ?? page?.title ?? "Watch",
    noSuffix: Boolean(page?.seo_title),
    description: page?.seo_description,
    path: "/pages/watch",
    shareKey: "watch",
  });
}

export default async function WatchPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const [{ page: pageParam }, template, articles, page] = await Promise.all([
    searchParams,
    getSetting<Template>("template:page.watch"),
    getArticles("watch", { desc: true }),
    getPage("watch"),
  ]);

  const featured = articles[0] ?? null;

  return (
    <>
      {orderedSections(template).map(({ id, section }) => {
        if (!section || section.disabled) return null;
        switch (section.type) {
          case "main-page": {
            // Disabled in the template; kept for parity should Medi re-enable it.
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
          case "watch-hero":
            return <WatchHero key={id} id={id} settings={section.settings as WatchHeroSettings} featured={featured} />;
          case "watch-video-grid": {
            const s = section.settings as { heading?: string; limit?: number };
            const limit = Math.max(1, Number(s.limit) || 250);
            const pages = Math.max(1, Math.ceil(articles.length / limit));
            const current = Math.min(pages, Math.max(1, parseInt(pageParam ?? "1", 10) || 1));
            const slice = articles.slice((current - 1) * limit, current * limit);
            const filters: WatchFilter[] = (section.block_order ?? [])
              .map((bid) => section.blocks?.[bid])
              .filter((b): b is NonNullable<typeof b> => Boolean(b && b.type === "filter"))
              .map((b) => ({ label: b.settings.label, value: handleize(b.settings.value || "all") }));
            const cards: WatchCard[] = slice.map((a) => {
              const category = metaString(a, "category") || "Commentary";
              return {
                handle: a.handle,
                title: a.title,
                category,
                categoryHandle: handleize(category),
                videoId: videoId(a),
                imageUrl: a.image_url,
                imageWidth: a.image_width,
                imageHeight: a.image_height,
                duration: metaString(a, "duration"),
                date: shortDate(a.published_at),
              };
            });
            return (
              <WatchGrid key={id} id={id} heading={s.heading} filters={filters} cards={cards}>
                <WatchPagination basePath="/pages/watch" current={current} pages={pages} />
              </WatchGrid>
            );
          }
          default:
            return null;
        }
      })}
    </>
  );
}
