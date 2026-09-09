/* Generic page: sections/main-page.liquid + templates/page.json (getSetting("template:page")). */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPage, getSetting } from "@/lib/data";
import { supabase } from "@/lib/supabase";
import { buildMetadata } from "@/lib/seo";

export const revalidate = 300;

/** Pages with their own dedicated routes (owned elsewhere) — never served by this generic template. */
const DEDICATED = new Set(["about", "watch", "great-books-project", "shop", "contact"]);

interface PageTemplate { sections: { main: { settings: { padding_top?: number; padding_bottom?: number } } } }

export async function generateStaticParams() {
  const { data } = await supabase.from("pages").select("handle").eq("is_published", true);
  return (data ?? []).map((p) => p.handle as string).filter((h) => !DEDICATED.has(h)).map((handle) => ({ handle }));
}

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle: rawHandle } = await params; const handle = decodeURIComponent(rawHandle);
  if (DEDICATED.has(handle)) return {};
  const page = await getPage(handle);
  if (!page) return {};
  return buildMetadata({ title: page.seo_title ?? page.title, description: page.seo_description, path: `/pages/${handle}` });
}

export default async function GenericPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle: rawHandle } = await params; const handle = decodeURIComponent(rawHandle);
  if (DEDICATED.has(handle)) notFound();
  const [page, template] = await Promise.all([getPage(handle), getSetting<PageTemplate>("template:page")]);
  if (!page) notFound();
  const s = template.sections.main?.settings ?? {};
  const pt = s.padding_top ?? 36;
  const pb = s.padding_bottom ?? 36;
  const sectionId = "main-page";
  const style = `
    .section-${sectionId}-padding { padding-top: ${Math.round(pt * 0.75)}px; padding-bottom: ${Math.round(pb * 0.75)}px; }
    @media screen and (min-width: 750px) { .section-${sectionId}-padding { padding-top: ${pt}px; padding-bottom: ${pb}px; } }
  `;
  return (
    <div id="shopify-section-main-page" className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <div className={`page-width page-width--narrow section-${sectionId}-padding`}>
        <h1 className="main-page-title page-title h0">{page.title}</h1>
        <div className="rte" dangerouslySetInnerHTML={{ __html: page.body_html ?? "" }} />
      </div>
    </div>
  );
}
