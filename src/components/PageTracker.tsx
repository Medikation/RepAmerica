"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Site-wide pageview beacon → /api/track (first-party, no cookies). Fires on load and every route change. */
export default function PageTracker() {
  const pathname = usePathname();
  const last = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname || last.current === pathname) return;
    last.current = pathname;
    let referrer = "";
    try {
      if (document.referrer) {
        const host = new URL(document.referrer).hostname;
        if (host && !host.endsWith("repamerica.com")) referrer = host;
      }
    } catch {}
    // utm_source / utm_medium from the first URL of the visit (Medi tags links: youtube/instagram + channel/description/pinned/bio/story).
    let source = "", medium = "";
    try {
      const q = new URLSearchParams(window.location.search);
      source = (q.get("utm_source") ?? "").slice(0, 40);
      medium = (q.get("utm_medium") ?? "").slice(0, 40);
      if (source) sessionStorage.setItem("ra_utm", JSON.stringify({ source, medium }));
      else { const saved = sessionStorage.getItem("ra_utm"); if (saved) ({ source, medium } = JSON.parse(saved)); }
    } catch {}
    const body = JSON.stringify({ path: pathname, referrer, source, medium });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {}
  }, [pathname]);
  return null;
}
