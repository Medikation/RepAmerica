import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "udeivbgtpfccbtstvsxa.supabase.co" }, { protocol: "https", hostname: "img.youtube.com" }, { protocol: "https", hostname: "i.ytimg.com" }] },
  async redirects() {
    return [
      { source: "/pages/partners-allies", destination: "/partners", permanent: true },
      { source: "/pages/great-books-project-2", destination: "/great-books", permanent: true },
      { source: "/collections/frontpage", destination: "/collections/all", permanent: true },
      // 2026-10-15: /pages/ prefix dropped (Shopify leftover). Old URLs stay valid forever via 308s.
      { source: "/pages/great-books-project", destination: "/great-books", permanent: true },
      { source: "/great-books-project", destination: "/great-books", permanent: true },
      { source: "/pages/:handle", destination: "/:handle", permanent: true },
      // Same day: /blogs/ prefix dropped. Guides, videos and essentials live one level up now.
      { source: "/blogs/watch", destination: "/watch", permanent: true },
      { source: "/blogs/great-books", destination: "/great-books", permanent: true },
      { source: "/blogs/essentials", destination: "/essentials", permanent: true },
      { source: "/blogs/:blog/:handle", destination: "/:blog/:handle", permanent: true },
    ];
  },
};

export default nextConfig;
