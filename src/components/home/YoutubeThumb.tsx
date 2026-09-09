"use client";

import { useState } from "react";

/** YouTube `maxresdefault` thumbnail that falls back to `hqdefault` on error — the Liquid's inline `onerror`. */
export default function YoutubeThumb({
  videoId, alt, loading = "lazy",
}: { videoId: string; alt: string; loading?: "eager" | "lazy" }) {
  const [src, setSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  return (
    <img
      src={src}
      alt={alt}
      width={1280}
      height={720}
      loading={loading}
      onError={() => setSrc((s) => (s.includes("maxresdefault") ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : s))}
    />
  );
}
