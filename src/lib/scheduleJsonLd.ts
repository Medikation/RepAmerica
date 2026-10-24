// schema.org markup for the public schedule: a WebPage whose main entity is an ItemList of Events, plus a BroadcastEvent
// for every event Rep America streams live. Written so Google's Event rich results and AI crawlers can read the week
// without parsing the HTML. Server-only (pure).
import { isoET, plainDescription, SCHEDULE_DESCRIPTION, SCHEDULE_TITLE, SCHEDULE_URL, SITE, type Schedule, type ScheduleEvent } from "@/lib/schedule";
import { placeOf } from "@/lib/streamPackage";
import { CHANNEL_URL } from "@/lib/youtubeLives";

const PERSON: Record<string, { name: string; sameAs: string[] } | null> = {
  trump: { name: "Donald J. Trump", sameAs: ["https://www.wikidata.org/wiki/Q22686", "https://www.whitehouse.gov/administration/donald-j-trump/"] },
  vance: { name: "JD Vance", sameAs: ["https://www.whitehouse.gov/administration/jd-vance/"] },
  "white-house": null,
  other: null,
};

function eventNode(e: ScheduleEvent, image: string | null) {
  const p = placeOf(e);
  const id = `${SCHEDULE_URL}#event-${e.id}`;
  const location: Record<string, unknown>[] = [];
  if (e.location || p) {
    location.push({
      "@type": "Place",
      name: e.location ?? (p ? `${p.city}, ${p.st}` : undefined),
      address: { "@type": "PostalAddress", ...(p ? { addressLocality: p.city, addressRegion: p.st } : {}), addressCountry: "US" },
    });
  }
  if (e.watchUrl && e.status !== "canceled") location.push({ "@type": "VirtualLocation", url: e.watchUrl });
  const performer = PERSON[e.performer];
  const node: Record<string, unknown> = {
    "@type": "Event",
    "@id": id,
    name: e.headline,
    description: plainDescription(e),
    startDate: isoET(e.startsMs),
    ...(e.endsMs ? { endDate: isoET(e.endsMs) } : {}),
    eventStatus: e.status === "canceled" ? "https://schema.org/EventCancelled" : e.status === "tentative" ? "https://schema.org/EventScheduled" : "https://schema.org/EventScheduled",
    eventAttendanceMode: e.watchUrl && e.status !== "canceled" ? "https://schema.org/MixedEventAttendanceMode" : "https://schema.org/OfflineEventAttendanceMode",
    location: location.length === 1 ? location[0] : location,
    ...(performer ? { performer: { "@type": "Person", ...performer } } : {}),
    url: id,
    ...(image ? { image: [image] } : {}),
    isAccessibleForFree: true,
    ...(e.source_url ? { sameAs: e.source_url } : {}),
  };
  return node;
}

function broadcastNode(e: ScheduleEvent) {
  return {
    "@type": "BroadcastEvent",
    "@id": `${SCHEDULE_URL}#broadcast-${e.id}`,
    name: `Rep America LIVE: ${e.headline}`,
    isLiveBroadcast: true,
    startDate: isoET(e.startsMs),
    url: e.watchUrl,
    broadcastOfEvent: { "@id": `${SCHEDULE_URL}#event-${e.id}` },
    publishedOn: { "@type": "BroadcastService", name: "Rep America", url: CHANNEL_URL, broadcastDisplayName: "Rep America on YouTube" },
    videoFormat: "HD",
    inLanguage: "en-US",
  };
}

export function scheduleJsonLd(s: Schedule, image: string | null) {
  const events = [...s.upcoming, ...s.past];
  const graph: unknown[] = [
    {
      "@type": "WebPage",
      "@id": `${SCHEDULE_URL}#webpage`,
      url: SCHEDULE_URL,
      name: SCHEDULE_TITLE,
      description: SCHEDULE_DESCRIPTION,
      inLanguage: "en-US",
      dateModified: new Date(s.now).toISOString(),
      isPartOf: { "@type": "WebSite", "@id": `${SITE}/#website`, name: "Rep America", url: SITE },
      about: [{ "@type": "Person", ...PERSON.trump }, { "@type": "Person", ...PERSON.vance }, { "@type": "Organization", name: "The White House", url: "https://www.whitehouse.gov/" }],
      mainEntity: { "@id": `${SCHEDULE_URL}#list` },
      publisher: { "@type": "Organization", name: "Rep America", url: SITE },
    },
    {
      "@type": "ItemList",
      "@id": `${SCHEDULE_URL}#list`,
      name: "Trump rally schedule and White House events — next 7 days",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: s.upcoming.length,
      itemListElement: s.upcoming.map((e, i) => ({ "@type": "ListItem", position: i + 1, item: { "@id": `${SCHEDULE_URL}#event-${e.id}` } })),
    },
    ...events.map((e) => eventNode(e, image)),
    ...events.filter((e) => e.watchUrl && e.status !== "canceled").map(broadcastNode),
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}
