// schema.org markup for the schedule pages: a WebPage whose main entity is an ItemList of Events, plus a BroadcastEvent
// for every stream Rep America runs (YouTube for the rallies, TikTok for Medi's own lives). Written so Google's Event
// rich results and AI crawlers can read the week without parsing the HTML. Server-only (pure).
import { isoET, plainDescription, SITE, type Schedule, type ScheduleEvent } from "@/lib/schedule";
import { placeOf } from "@/lib/streamPackage";
import { CHANNEL_URL } from "@/lib/youtubeLives";

const TIKTOK_PROFILE = "https://www.tiktok.com/@repamerica";

const PERSON: Record<string, { name: string; sameAs?: string[]; url?: string } | null> = {
  trump: { name: "Donald J. Trump", sameAs: ["https://www.wikidata.org/wiki/Q22686", "https://www.whitehouse.gov/administration/donald-j-trump/"] },
  vance: { name: "JD Vance", sameAs: ["https://www.whitehouse.gov/administration/jd-vance/"] },
  medi: { name: "Medi", url: `${SITE}/about`, sameAs: [CHANNEL_URL, "https://www.instagram.com/medikation", TIKTOK_PROFILE] },
  "white-house": null,
  other: null,
};

function eventNode(e: ScheduleEvent, pageUrl: string, image: string | null) {
  const p = placeOf(e);
  const id = `${pageUrl}#event-${e.id}`;
  const location: Record<string, unknown>[] = [];
  if (e.platform !== "tiktok" && (e.location || p)) {
    location.push({
      "@type": "Place",
      name: e.location ?? (p ? `${p.city}, ${p.st}` : undefined),
      address: { "@type": "PostalAddress", ...(p ? { addressLocality: p.city, addressRegion: p.st } : {}), addressCountry: "US" },
    });
  }
  if (e.watchUrl && e.status !== "canceled") location.push({ "@type": "VirtualLocation", url: e.watchUrl });
  const performer = PERSON[e.performer];
  const online = e.platform === "tiktok" || (!!e.watchUrl && !location.some((l) => l["@type"] === "Place"));
  return {
    "@type": "Event",
    "@id": id,
    name: e.platform === "tiktok" ? `${e.headline} — ${e.sub ?? ""}`.replace(/ — $/, "") : e.headline,
    description: plainDescription(e),
    startDate: isoET(e.startsMs),
    ...(e.endsMs ? { endDate: isoET(e.endsMs) } : {}),
    eventStatus: e.status === "canceled" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: online ? "https://schema.org/OnlineEventAttendanceMode" : e.watchUrl && e.status !== "canceled" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: location.length === 1 ? location[0] : location,
    ...(performer ? { performer: { "@type": "Person", ...performer } } : {}),
    ...(e.platform === "tiktok" ? { organizer: { "@type": "Organization", name: "Rep America", url: SITE } } : {}),
    url: id,
    ...(image ? { image: [image] } : {}),
    isAccessibleForFree: true,
    ...(e.source_url ? { sameAs: e.source_url } : {}),
    ...(e.aftershowOf ? { superEvent: { "@id": `${pageUrl}#event-${e.aftershowOf}` } } : {}),
  };
}

function broadcastNode(e: ScheduleEvent, pageUrl: string) {
  const tiktok = e.platform === "tiktok";
  return {
    "@type": "BroadcastEvent",
    "@id": `${pageUrl}#broadcast-${e.id}`,
    name: tiktok ? `Rep America LIVE on TikTok — ${e.sub ?? "Talk to Medi"}` : `Rep America LIVE: ${e.headline}`,
    isLiveBroadcast: true,
    startDate: isoET(e.startsMs),
    url: e.watchUrl,
    broadcastOfEvent: { "@id": `${pageUrl}#event-${tiktok && e.aftershowOf ? e.aftershowOf : e.id}` },
    publishedOn: tiktok
      ? { "@type": "BroadcastService", name: "Rep America on TikTok", url: TIKTOK_PROFILE, broadcastDisplayName: "@repamerica" }
      : { "@type": "BroadcastService", name: "Rep America", url: CHANNEL_URL, broadcastDisplayName: "Rep America on YouTube" },
    videoFormat: "HD",
    inLanguage: "en-US",
  };
}

export function scheduleJsonLd(s: Schedule, opts: { pageUrl: string; title: string; description: string; listName: string; image: string | null }) {
  const { pageUrl, image } = opts;
  const events = [...s.upcoming, ...s.past];
  const graph: unknown[] = [
    {
      "@type": "WebPage",
      "@id": `${pageUrl}#webpage`,
      url: pageUrl,
      name: opts.title,
      description: opts.description,
      inLanguage: "en-US",
      dateModified: new Date(s.now).toISOString(),
      isPartOf: { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Rep America", url: SITE },
      about: [{ "@type": "Person", ...PERSON.trump }, { "@type": "Person", ...PERSON.vance }, { "@type": "Organization", name: "The White House", url: "https://www.whitehouse.gov/" }, { "@type": "Person", ...PERSON.medi }],
      mainEntity: { "@id": `${pageUrl}#list` },
      publisher: { "@type": "Organization", name: "Rep America", url: SITE },
    },
    {
      "@type": "ItemList",
      "@id": `${pageUrl}#list`,
      name: opts.listName,
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: s.upcoming.length,
      itemListElement: s.upcoming.map((e, i) => ({ "@type": "ListItem", position: i + 1, item: { "@id": `${pageUrl}#event-${e.id}` } })),
    },
    ...events.map((e) => eventNode(e, pageUrl, image)),
    ...events.filter((e) => e.watchUrl && e.status !== "canceled").map((e) => broadcastNode(e, pageUrl)),
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}
