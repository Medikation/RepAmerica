/* Inline SVG icons copied verbatim from ../shopify_export/theme/assets/icon-*.svg
 * (the Liquid `{{ 'icon-foo.svg' | inline_asset_content }}` filter). Class names are kept
 * because base.css targets `.icon-hamburger`, `.icon-close`, `.icon-caret`, etc. */

export function IconArrow() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-arrow" viewBox="0 0 14 10">
      <path fill="currentColor" fillRule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clipRule="evenodd" />
    </svg>
  );
}

export function IconCaret() {
  return (
    <svg className="icon icon-caret" viewBox="0 0 10 6">
      <path fill="currentColor" fillRule="evenodd" d="M9.354.646a.5.5 0 0 0-.708 0L5 4.293 1.354.646a.5.5 0 0 0-.708.708l4 4a.5.5 0 0 0 .708 0l4-4a.5.5 0 0 0 0-.708" clipRule="evenodd" />
    </svg>
  );
}

export function IconHamburger() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-hamburger" viewBox="0 0 18 16">
      <path fill="currentColor" d="M1 .5a.5.5 0 1 0 0 1h15.71a.5.5 0 0 0 0-1zM.5 8a.5.5 0 0 1 .5-.5h15.71a.5.5 0 0 1 0 1H1A.5.5 0 0 1 .5 8m0 7a.5.5 0 0 1 .5-.5h15.71a.5.5 0 0 1 0 1H1a.5.5 0 0 1-.5-.5" />
    </svg>
  );
}

export function IconClose() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-close" viewBox="0 0 18 17">
      <path fill="currentColor" d="M.865 15.978a.5.5 0 0 0 .707.707l7.433-7.431 7.579 7.282a.501.501 0 0 0 .846-.37.5.5 0 0 0-.153-.351L9.712 8.546l7.417-7.416a.5.5 0 1 0-.707-.708L8.991 7.853 1.413.573a.5.5 0 1 0-.693.72l7.563 7.268z" />
    </svg>
  );
}

export function IconSearch() {
  return (
    <svg fill="none" className="icon icon-search" viewBox="0 0 18 19">
      <path fill="currentColor" fillRule="evenodd" d="M11.03 11.68A5.784 5.784 0 1 1 2.85 3.5a5.784 5.784 0 0 1 8.18 8.18m.26 1.12a6.78 6.78 0 1 1 .72-.7l5.4 5.4a.5.5 0 1 1-.71.7z" clipRule="evenodd" />
    </svg>
  );
}

/** icon-reset.svg (note: the theme gives it the `icon-close` class). */
export function IconReset() {
  return (
    <svg fill="none" stroke="currentColor" className="icon icon-close" viewBox="0 0 18 18">
      <circle cx="9" cy="9" r="8.5" strokeOpacity=".2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.83 11.83 6.172 6.17M6.229 11.885l5.544-5.77" />
    </svg>
  );
}

export function IconCartEmpty() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-cart-empty" viewBox="0 0 40 40">
      <path fill="currentColor" fillRule="evenodd" d="M15.75 11.8h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33L28.4 11.8zm0 1h-2.22l-.71 10.67a4 4 0 0 0 3.99 4.27h7.38a4 4 0 0 0 4-4.27l-.72-10.67h-2.22v.63a4.75 4.75 0 1 1-9.5 0zm8.5 0h-7.5v.63a3.75 3.75 0 1 0 7.5 0z" />
    </svg>
  );
}

export function IconCart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-cart" viewBox="0 0 40 40">
      <path fill="currentColor" fillRule="evenodd" d="M20.5 6.5a4.75 4.75 0 0 0-4.75 4.75v.56h-3.16l-.77 11.6a5 5 0 0 0 4.99 5.34h7.38a5 5 0 0 0 4.99-5.33l-.77-11.6h-3.16v-.57A4.75 4.75 0 0 0 20.5 6.5m3.75 5.31v-.56a3.75 3.75 0 1 0-7.5 0v.56zm-7.5 1h7.5v.56a3.75 3.75 0 1 1-7.5 0zm-1 0v.56a4.75 4.75 0 1 0 9.5 0v-.56h2.22l.71 10.67a4 4 0 0 1-3.99 4.27h-7.38a4 4 0 0 1-4-4.27l.72-10.67z" />
    </svg>
  );
}

export function IconAccount() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" className="icon icon-account" viewBox="0 0 18 19">
      <path fill="currentColor" fillRule="evenodd" d="M6 4.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8m5.58 12.15c1.12.82 1.83 2.24 1.91 4.85H1.51c.08-2.6.79-4.03 1.9-4.85C4.66 11.75 6.5 11.5 9 11.5s4.35.26 5.58 1.15M9 10.5c-2.5 0-4.65.24-6.17 1.35C1.27 12.98.5 14.93.5 18v.5h17V18c0-3.07-.77-5.02-2.33-6.15-1.52-1.1-3.67-1.35-6.17-1.35" clipRule="evenodd" />
    </svg>
  );
}

export function IconError() {
  return (
    <svg className="icon icon-error" viewBox="0 0 13 13">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="#fff" strokeWidth="2" />
      <circle cx="6.5" cy="6.5" r="5.5" fill="#EB001B" stroke="#EB001B" strokeWidth=".7" />
      <path fill="#fff" d="m5.874 3.528.1 4.044h1.053l.1-4.044zm.627 6.133c.38 0 .68-.288.68-.656s-.3-.656-.68-.656-.681.288-.681.656.3.656.68.656" />
      <path fill="#fff" stroke="#EB001B" strokeWidth=".7" d="M5.874 3.178h-.359l.01.359.1 4.044.008.341h1.736l.008-.341.1-4.044.01-.359H5.873Zm.627 6.833c.56 0 1.03-.432 1.03-1.006s-.47-1.006-1.03-1.006-1.031.432-1.031 1.006.47 1.006 1.03 1.006Z" />
    </svg>
  );
}

export function IconSuccess() {
  return (
    <svg className="icon icon-success" viewBox="0 0 13 13">
      <path fill="#428445" stroke="#fff" strokeWidth=".7" d="M6.5 12.35a5.85 5.85 0 1 0 0-11.7 5.85 5.85 0 0 0 0 11.7Z" />
      <path stroke="#fff" d="m5.533 8.664 3.72-3.982M4.106 6.769l2.032 1.857" />
    </svg>
  );
}

/* ---------- Social ---------- */

export function IconFacebook() {
  return (
    <svg className="icon icon-facebook" viewBox="0 0 20 20">
      <path fill="currentColor" d="M18 10.049C18 5.603 14.419 2 10 2s-8 3.603-8 8.049C2 14.067 4.925 17.396 8.75 18v-5.624H6.719v-2.328h2.03V8.275c0-2.017 1.195-3.132 3.023-3.132.874 0 1.79.158 1.79.158v1.98h-1.009c-.994 0-1.303.621-1.303 1.258v1.51h2.219l-.355 2.326H11.25V18c3.825-.604 6.75-3.933 6.75-7.951" />
    </svg>
  );
}

export function IconInstagram() {
  return (
    <svg className="icon icon-instagram" viewBox="0 0 20 20">
      <path fill="currentColor" fillRule="evenodd" d="M13.23 3.492c-.84-.037-1.096-.046-3.23-.046-2.144 0-2.39.01-3.238.055-.776.027-1.195.164-1.487.273a2.4 2.4 0 0 0-.912.593 2.5 2.5 0 0 0-.602.922c-.11.282-.238.702-.274 1.486-.046.84-.046 1.095-.046 3.23s.01 2.39.046 3.229c.004.51.097 1.016.274 1.495.145.365.319.639.602.913.282.282.538.456.92.602.474.176.974.268 1.479.273.848.046 1.103.046 3.238.046s2.39-.01 3.23-.046c.784-.036 1.203-.164 1.486-.273.374-.146.648-.329.921-.602.283-.283.447-.548.602-.922.177-.476.27-.979.274-1.486.037-.84.046-1.095.046-3.23s-.01-2.39-.055-3.229c-.027-.784-.164-1.204-.274-1.495a2.4 2.4 0 0 0-.593-.913 2.6 2.6 0 0 0-.92-.602c-.284-.11-.703-.237-1.488-.273ZM6.697 2.05c.857-.036 1.131-.045 3.302-.045a63 63 0 0 1 3.302.045c.664.014 1.321.14 1.943.374a4 4 0 0 1 1.414.922c.41.397.728.88.93 1.414.23.622.354 1.279.365 1.942C18 7.56 18 7.824 18 10.005c0 2.17-.01 2.444-.046 3.292-.036.858-.173 1.442-.374 1.943-.2.53-.474.976-.92 1.423a3.9 3.9 0 0 1-1.415.922c-.51.191-1.095.337-1.943.374-.857.036-1.122.045-3.302.045-2.171 0-2.445-.009-3.302-.055-.849-.027-1.432-.164-1.943-.364a4.15 4.15 0 0 1-1.414-.922 4.1 4.1 0 0 1-.93-1.423c-.183-.51-.329-1.085-.365-1.943C2.009 12.45 2 12.167 2 10.004c0-2.161 0-2.435.055-3.302.027-.848.164-1.432.365-1.942a4.4 4.4 0 0 1 .92-1.414 4.2 4.2 0 0 1 1.415-.93c.51-.183 1.094-.33 1.943-.366Zm.427 4.806a4.105 4.105 0 1 1 5.805 5.805 4.105 4.105 0 0 1-5.805-5.805m1.882 5.371a2.668 2.668 0 1 0 2.042-4.93 2.668 2.668 0 0 0-2.042 4.93m5.922-5.942a.958.958 0 1 1-1.355-1.355.958.958 0 0 1 1.355 1.355" clipRule="evenodd" />
    </svg>
  );
}

export function IconYoutube() {
  return (
    <svg className="icon icon-youtube" viewBox="0 0 20 20">
      <path fill="currentColor" d="M18.16 5.87c.34 1.309.34 4.08.34 4.08s0 2.771-.34 4.08a2.13 2.13 0 0 1-1.53 1.53c-1.309.34-6.63.34-6.63.34s-5.321 0-6.63-.34a2.13 2.13 0 0 1-1.53-1.53c-.34-1.309-.34-4.08-.34-4.08s0-2.771.34-4.08a2.17 2.17 0 0 1 1.53-1.53C4.679 4 10 4 10 4s5.321 0 6.63.34a2.17 2.17 0 0 1 1.53 1.53M8.3 12.5l4.42-2.55L8.3 7.4z" />
    </svg>
  );
}

export function IconTiktok() {
  return (
    <svg className="icon icon-tiktok" viewBox="0 0 20 20">
      <path fill="currentColor" d="M10.511 1.705h2.74s-.157 3.51 3.795 3.768v2.711s-2.114.129-3.796-1.158l.028 5.606A5.073 5.073 0 1 1 8.213 7.56h.708v2.785a2.298 2.298 0 1 0 1.618 2.205z" />
    </svg>
  );
}

export function IconTwitter() {
  return (
    <svg className="icon icon-twitter" viewBox="0 0 20 20">
      <path fill="currentColor" fillRule="evenodd" d="M7.273 2.8 10.8 7.822 15.218 2.8h1.768l-5.4 6.139 5.799 8.254h-4.658l-3.73-5.31-4.671 5.31H2.558l5.654-6.427L2.615 2.8zm6.242 13.125L5.07 4.109h1.405l8.446 11.816z" clipRule="evenodd" />
    </svg>
  );
}

export function IconPinterest() {
  return (
    <svg className="icon icon-pinterest" viewBox="0 0 20 20">
      <path fill="currentColor" d="M10 2.01a8.1 8.1 0 0 1 5.666 2.353 8.09 8.09 0 0 1 1.277 9.68A7.95 7.95 0 0 1 10 18.04a8.2 8.2 0 0 1-2.276-.307c.403-.653.672-1.24.816-1.729l.567-2.2c.134.27.393.5.768.702.384.192.768.297 1.19.297q1.254 0 2.248-.72a4.7 4.7 0 0 0 1.537-1.969c.37-.89.554-1.848.537-2.813 0-1.249-.48-2.315-1.43-3.227a5.06 5.06 0 0 0-3.65-1.374c-.893 0-1.729.154-2.478.461a5.02 5.02 0 0 0-3.236 4.552c0 .72.134 1.355.413 1.902.269.538.672.922 1.22 1.152.096.039.182.039.25 0 .066-.028.114-.096.143-.192l.173-.653c.048-.144.02-.288-.105-.432a2.26 2.26 0 0 1-.548-1.565 3.803 3.803 0 0 1 3.976-3.861c1.047 0 1.863.288 2.44.855.585.576.883 1.315.883 2.228a6.8 6.8 0 0 1-.317 2.122 3.8 3.8 0 0 1-.893 1.556c-.384.384-.836.576-1.345.576-.413 0-.749-.144-1.018-.451-.259-.307-.345-.672-.25-1.085q.22-.77.452-1.537l.173-.701c.057-.25.086-.451.086-.624 0-.346-.096-.634-.269-.855-.192-.22-.451-.336-.797-.336-.432 0-.797.192-1.085.595-.288.394-.442.893-.442 1.499.005.374.063.746.173 1.104l.058.144c-.576 2.478-.913 3.938-1.037 4.36-.116.528-.154 1.153-.125 1.863A8.07 8.07 0 0 1 2 10.03c0-2.208.778-4.11 2.343-5.666A7.72 7.72 0 0 1 10 2.001z" />
    </svg>
  );
}

export function IconSnapchat() {
  return (
    <svg className="icon icon-snapchat" viewBox="0 0 20 20">
      <path fill="currentColor" fillRule="evenodd" d="M17.388 15.396a5 5 0 0 1-1.111.445c-.074.23-.236.564-.596.813a1.9 1.9 0 0 1-.9.308c-.14.015-.313.021-.443.026l-.092.004c-.317.014-.624.042-.958.154l-.002.001a1.7 1.7 0 0 0-.331.168l-.138.085c-.14.087-.33.205-.497.298a4.6 4.6 0 0 1-2.321.602 4.55 4.55 0 0 1-2.315-.602c-.164-.091-.355-.21-.495-.297l-.14-.086a2 2 0 0 0-.338-.172 3.4 3.4 0 0 0-.96-.154l-.09-.003c-.13-.006-.304-.013-.445-.027-.15-.016-.541-.06-.9-.31a1.56 1.56 0 0 1-.593-.809 4.8 4.8 0 0 1-1.112-.446 1.9 1.9 0 0 1-.628-.535 1.44 1.44 0 0 1-.21-1.306 1.5 1.5 0 0 1 .53-.724c.137-.104.27-.17.323-.196 1.23-.604 1.77-1.38 1.996-1.833l-.18-.118c-.167-.11-.342-.223-.438-.291-.252-.178-.572-.449-.779-.85a1.8 1.8 0 0 1-.087-1.473l.002-.005c.344-.922 1.2-1.14 1.704-1.14h.07q.005-.335.033-.678A4.6 4.6 0 0 1 6.132 3.35l.007-.007a5.1 5.1 0 0 1 1.773-1.247 5.1 5.1 0 0 1 2.108-.394c2.272.008 3.522 1.273 3.855 1.655a4.6 4.6 0 0 1 1.176 2.884c.019.227.028.456.032.678h.088c.521.005 1.346.242 1.684 1.133l.005.012a1.8 1.8 0 0 1-.09 1.477c-.209.401-.531.672-.786.85a19 19 0 0 1-.402.267l-.209.138c.224.45.76 1.226 1.994 1.827l.01.004.008.004c.056.029.188.097.325.203.12.093.388.323.52.724.16.493.028.963-.207 1.292a1.9 1.9 0 0 1-.627.541zm-3.315-5.268c.088-.083.33-.248.574-.41l.255-.169.084-.055.217-.144.018-.013.018-.012c.36-.25.514-.504.401-.811-.081-.214-.28-.295-.486-.295a.8.8 0 0 0-.194.02 3 3 0 0 0-.403.12l-.179.068-.013.005-.058.023q-.139.055-.248.093-.05.017-.091.027c-.029.012-.057.012-.082.012-.117 0-.161-.053-.153-.196l.003-.048.017-.264a20 20 0 0 0 .03-.785v-.03a10 10 0 0 0-.03-.943 3.3 3.3 0 0 0-.85-2.102c-.199-.23-1.13-1.217-2.904-1.217a3.8 3.8 0 0 0-1.583.292c-.5.21-.951.527-1.32.93a3.3 3.3 0 0 0-.851 2.101 10 10 0 0 0-.026 1.198l.01.246a22 22 0 0 0 .033.576q0 .028.003.054c.008.135-.032.192-.154.192l-.08-.008-.087-.025a5 5 0 0 1-.254-.096l-.054-.022-.072-.029-.123-.046-.008-.003a3 3 0 0 0-.447-.128 1 1 0 0 0-.142-.011c-.207 0-.405.077-.486.295-.114.307.04.561.397.811l.089.061.274.181.238.156c.243.161.482.323.569.405.175.165.16.293.14.452l-.002.02c-.014.115-.304 1.492-1.926 2.641a6 6 0 0 1-.51.327 7 7 0 0 1-.428.228c-.141.07-.388.217.045.459q.126.069.24.121h.001c.247.113.46.174.65.225l.035.01q.089.022.17.046c.14.042.267.088.382.163.16.104.182.274.203.432.018.133.035.258.133.326.117.082.333.091.623.103.375.015.873.036 1.443.225.287.097.536.253.8.416.514.322 1.08.674 2.075.674 1 0 1.572-.356 2.087-.677.261-.162.508-.315.788-.409.572-.192 1.073-.212 1.448-.226.289-.011.503-.02.617-.102.101-.068.118-.193.135-.328.021-.157.044-.328.206-.434.116-.075.244-.121.388-.163l.2-.056a4 4 0 0 0 .642-.222 4 4 0 0 0 .248-.124c.429-.242.186-.394.04-.468a7 7 0 0 1-.423-.223l-.01-.005a7 7 0 0 1-.5-.319c-1.629-1.145-1.916-2.526-1.93-2.649v-.002c-.024-.163-.044-.293.138-.465m-10.3 4.838h.002Zm.106-1.842h-.002Zm-.249 2.255" clipRule="evenodd" />
    </svg>
  );
}

export function IconTumblr() {
  return (
    <svg className="icon icon-tumblr" viewBox="0 0 20 20">
      <path fill="currentColor" fillRule="evenodd" d="M11.997 18c-2.26 0-3.954-1.235-3.954-4.198V9.061H6V6.489C8.26 5.867 9.201 3.787 9.314 2h2.344v4.068h2.73V9.06h-2.73v4.128c0 1.235.584 1.667 1.516 1.667h1.318V18z" clipRule="evenodd" />
    </svg>
  );
}

export function IconVimeo() {
  return (
    <svg className="icon icon-vimeo" viewBox="0 0 20 20">
      <path fill="currentColor" fillRule="evenodd" d="M17.995 7.002C17.92 8.457 16.9 10.451 14.935 13c-2.039 2.653-3.763 3.988-5.187 3.988q-1.305 0-2.205-2.429L6.33 10.121q-.675-2.43-1.44-2.43c-.12 0-.51.24-1.184.706L3 7.497l2.19-1.95c.989-.869 1.724-1.319 2.218-1.349 1.17-.135 1.89.66 2.16 2.37.3 1.844.495 2.998.6 3.448.344 1.53.704 2.294 1.11 2.294.314 0 .794-.495 1.424-1.5.49-.67.832-1.436 1.004-2.249.09-.87-.255-1.304-1.004-1.304-.36 0-.735.09-1.11.255.735-2.414 2.144-3.584 4.213-3.509 1.545.045 2.265 1.05 2.19 3Z" clipRule="evenodd" />
    </svg>
  );
}

/* ---------- Social icon list (snippets/social-icons.liquid + the drawer's variant) ---------- */

export type SocialSettings = Partial<Record<
  | "social_facebook_link" | "social_instagram_link" | "social_youtube_link" | "social_tiktok_link" | "social_twitter_link"
  | "social_pinterest_link" | "social_snapchat_link" | "social_tumblr_link" | "social_vimeo_link", string>>;

/** Order + labels of snippets/social-icons.liquid; labels are `general.social.links.*` from en.default.json. */
export const SOCIAL_NETWORKS: { key: keyof SocialSettings; label: string; Icon: () => React.JSX.Element }[] = [
  { key: "social_facebook_link", label: "Facebook", Icon: IconFacebook },
  { key: "social_instagram_link", label: "Instagram", Icon: IconInstagram },
  { key: "social_youtube_link", label: "YouTube", Icon: IconYoutube },
  { key: "social_tiktok_link", label: "TikTok", Icon: IconTiktok },
  { key: "social_twitter_link", label: "X (Twitter)", Icon: IconTwitter },
  { key: "social_pinterest_link", label: "Pinterest", Icon: IconPinterest },
  { key: "social_snapchat_link", label: "Snapchat", Icon: IconSnapchat },
  { key: "social_tumblr_link", label: "Tumblr", Icon: IconTumblr },
  { key: "social_vimeo_link", label: "Vimeo", Icon: IconVimeo },
];

export function hasSocialLinks(theme: SocialSettings): boolean {
  return SOCIAL_NETWORKS.some((n) => !!theme[n.key]);
}

/** `{% render 'social-icons', class: ... %}` */
export function SocialIcons({ theme, className }: { theme: SocialSettings; className?: string }) {
  return (
    <ul className={`list-unstyled list-social${className ? ` ${className}` : ""}`} role="list">
      {SOCIAL_NETWORKS.filter((n) => !!theme[n.key]).map(({ key, label, Icon }) => (
        <li key={key} className="list-social__item">
          <a href={theme[key]} className="link list-social__link">
            <span className="svg-wrapper"><Icon /></span>
            <span className="visually-hidden">{label}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
