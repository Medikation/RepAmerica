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
    const body = JSON.stringify({ path: pathname, referrer });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      else fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    } catch {}
  }, [pathname]);
  return null;
}
