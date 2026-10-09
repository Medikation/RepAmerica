import type { Article } from "@/lib/data";
import { str } from "./util";

export const isLivestream = (a: Article) => str(a.meta?.category).toLowerCase() === "livestream";
const isFeatured = (a: Article) => a.meta?.featured_home === true || a.meta?.featured_home === "true";

/** Hero selection: a pinned video (`meta.featured_home = true`) takes slot 1; then the newest cuts (anything but Livestream);
 *  livestreams only fill in if there aren't enough cuts. `articles` must be newest-first. */
export function pickHeroArticles(articles: Article[], n = 3): Article[] {
  const featured = articles.filter(isFeatured);
  const cuts = articles.filter((a) => !isLivestream(a));
  const out: Article[] = [];
  for (const a of [...featured, ...cuts, ...articles]) {
    if (out.some((p) => p.id === a.id)) continue;
    out.push(a);
    if (out.length === n) break;
  }
  return out;
}
