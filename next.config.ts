import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "udeivbgtpfccbtstvsxa.supabase.co" }, { protocol: "https", hostname: "img.youtube.com" }, { protocol: "https", hostname: "i.ytimg.com" }] },
  async redirects() {
    return [
      { source: "/pages/partners-allies", destination: "/pages/partners", permanent: true },
      { source: "/pages/great-books-project-2", destination: "/pages/great-books-project", permanent: true },
      { source: "/collections/frontpage", destination: "/collections/all", permanent: true },
    ];
  },
};

export default nextConfig;
