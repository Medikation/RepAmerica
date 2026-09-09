"use client";

import { useState } from "react";
import YoutubeThumb from "./YoutubeThumb";

/** The hero's video FACADE (thumbnail + play button) that swaps itself for the real YouTube player on click —
 *  port of the inline <script> in sections/home-hero.liquid. */
export default function HeroPlayer({ videoId, title, duration }: { videoId: string; title: string; duration: string }) {
  const [playing, setPlaying] = useState(false);
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
          <YoutubeThumb videoId={videoId} alt="" loading="eager" />
          <span className="ra-home-hero__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" focusable="false"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
          </span>
          {duration ? <span className="ra-home-hero__duration">{duration}</span> : null}
        </button>
      )}
    </div>
  );
}
