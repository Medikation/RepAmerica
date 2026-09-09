"use client";

import { useState } from "react";
import Image from "next/image";

/** The hero's video FACADE (thumbnail + play button) that swaps itself for the real YouTube player on click —
 *  port of the inline <script> in sections/home-hero.liquid.
 *  The thumbnail goes through Next/Vercel image optimization (smaller, CDN-cached, preloaded with `priority`) and shows a
 *  blurred tiny preview (`blurDataURL`, fetched server-side) instead of a black box while it loads. */
export default function HeroPlayer({ videoId, title, duration, blurDataURL }: { videoId: string; title: string; duration: string; blurDataURL?: string }) {
  const [playing, setPlaying] = useState(false);
  const [src, setSrc] = useState(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
  return (
    <div className="ra-home-hero__player" data-ra-video={videoId}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button type="button" className="ra-home-hero__facade" aria-label={`Play ${title}`} onClick={() => setPlaying(true)}>
          <Image
            src={src}
            alt=""
            width={1280}
            height={720}
            priority
            sizes="(max-width: 749px) 100vw, (max-width: 989px) 70vw, 640px"
            placeholder={blurDataURL ? "blur" : "empty"}
            blurDataURL={blurDataURL}
            onError={() => setSrc((s) => (s.includes("maxresdefault") ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : s))}
          />
          <span className="ra-home-hero__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
          </span>
          {duration ? <span className="ra-home-hero__duration">{duration}</span> : null}
        </button>
      )}
    </div>
  );
}
