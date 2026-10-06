"use client";

import { useState } from "react";

/** Click-to-play YouTube embed: a thumbnail + play button until clicked, then the real player.
 *  Keeps the ~500 KB YouTube player off the guide pages until someone actually wants the video. */
export default function LiteYouTube({ id, title }: { id: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing) {
    return (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      ></iframe>
    );
  }
  return (
    <button type="button" className="ra-lite-yt" onClick={() => setPlaying(true)} aria-label={`Play: ${title}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`}
        alt=""
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.src.endsWith("/hqdefault.jpg")) img.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        }}
      />
      <span className="ra-lite-yt__play" aria-hidden="true" />
    </button>
  );
}
