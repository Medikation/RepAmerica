# Rep America — Next.js port of the Shopify (Dawn-based) theme

**Goal of this codebase: a faithful 1:1 port of repamerica.com off Shopify.** Same URLs, same markup class names, same look. Improvements come later, in separate rounds — do not redesign anything while porting.

## Stack
- Next.js 15 App Router, TypeScript, `src/` layout, **plain CSS only** (the theme's own stylesheets, copied verbatim into `src/styles/` and imported by `src/app/globals.css`). No Tailwind, no CSS modules, no new global styles unless a section's inline `{% style %}` / `<style>` block needs porting — put those in `src/styles/sections.css` (create if missing) or as a `<style>` string inside the component, keyed with the same class names the Liquid used.
- Data: Supabase, read through `src/lib/data.ts` (`getArticles`, `getArticle`, `getPage`, `getProducts`, `getProduct`, `getCollection`, `getSetting`, `getMenu`, `orderedSections`). All content is server-rendered; pages are `async` server components. `export const revalidate = 300` on each route.
- Article bodies are trusted HTML from the CMS: render with `dangerouslySetInnerHTML`.
- Images: use plain `<img>` with the stored URLs (Supabase Storage), `loading="lazy"` except hero/LCP images. Never hotlink `cdn.shopify.com` — it goes away at cutover.
- Metadata: `buildMetadata()` from `src/lib/seo.ts` in `generateMetadata`.

## Source of truth for each page
- Liquid: `../shopify_export/theme/` (`layout/`, `sections/`, `snippets/`, `templates/*.json`, `config/settings_data.json`). Template JSON holds each section's `settings` and `blocks` — the SAME data is available at runtime via `getSetting("template:<name>")` (e.g. `template:index`, `template:page.about`, `group:header-group`) with `shopify://shop_images/...` already rewritten to storage URLs. Prefer reading settings at runtime over hard-coding copy, so Medi can later edit them in the DB.
- Rendered live HTML for comparison: `../reference/*.html` (home, about, great-books-project, watch, shop, contact, one article per blog, product, collection, blog index, search, 404). **Match the rendered markup's element structure and class names** — the CSS in `src/styles/` targets those classes.
- Live site: https://repamerica.com (still up during the build).

## Liquid → React conventions
- `{{ 'x.css' | asset_url | stylesheet_tag }}` → already globally imported; ignore.
- `{{ 'icon-foo.svg' | inline_asset_content }}` → inline the SVG from `../shopify_export/theme/assets/icon-foo.svg` (copy into `src/components/icons.tsx` as small components).
- `{{ 'key' | t }}` translations → look up the English string in `../shopify_export/theme/locales/en.default.json`.
- `blog.articles` loops: Great Books & Essentials & Watch lists are in ascending `published_at` = reading order; the Liquid used `| reverse` on Shopify's descending default to get this. `getArticles(blog)` already returns ascending. Watch page shows newest first → `getArticles("watch", { desc: true })`.
- Metafields `article.metafields.custom.X` → `article.meta.X`.
- `[[AMAZON]]` marker in Great Books bodies → the template swaps it for `<a class="ra-gb-guide__amazon" href="{affiliate_url}" target="_blank" rel="noopener sponsored">View on Amazon →</a>`; check `great-books-article.liquid` for the exact markup and reproduce it.
- Shopify-only features (customer accounts, localization selectors, cart drawer, predictive search API, Shop Pay, `{{ content_for_header }}`) are dropped. Search becomes a simple server-rendered `/search?q=` over article titles/summaries via Supabase `ilike`. The cart becomes a Stripe Checkout redirect (see `src/app/products`).
- Keep the `page-width`, `color-scheme-N`, `gradient`, `section-*-padding` wrappers — the CSS depends on them.

## Routes (must all exist — URL parity is a launch gate)
`/`, `/pages/about`, `/pages/watch`, `/pages/great-books-project`, `/pages/shop`, `/pages/contact`, `/pages/[handle]` (generic, e.g. data-sharing-opt-out, partners), `/blogs/[blog]` (index), `/blogs/watch/[handle]`, `/blogs/great-books/[handle]`, `/blogs/essentials/[handle]`, `/products/[handle]`, `/collections/[handle]` (all, rep-america, medikation, recommended, frontpage), `/search`, `/sitemap.xml`, `/robots.txt`, `not-found`.

## Don'ts
- Don't install UI libraries. Don't add Tailwind. Don't rename classes. Don't invent copy — every string comes from settings, the locale file, or the Liquid.
- Don't touch files outside your assigned area (other agents are working in parallel in this repo).
