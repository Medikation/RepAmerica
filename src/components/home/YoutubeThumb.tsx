"use client";

import { useState } from "react";

/** YouTube `maxresdefault` thumbnail that falls back to `hqdefault` — on error (404) AND on YouTube's 120×90 grey
 *  placeholder, which comes back with a 200 when a video has no maxres frame (older uploads, Shorts). */
export default function YoutubeThumb({
  videoId, alt, loading = "lazy",
}: { videoId: string; alt: string; loading?: "eager" | "lazy" }) {
  const [src, setSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  const fallback = () => setSrc((s) => (s.includes("maxresdefault") ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : s));
  return (
    <img
      src={src}
      alt={alt}
      width={1280}
      height={720}
      loading={loading}
      onError={fallback}
      onLoad={(e) => { if (e.currentTarget.naturalWidth <= 120) fallback(); }}
    />
  );
}
