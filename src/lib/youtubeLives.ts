// Rep America's own YouTube lives, read from the channel's public Streams page (no API key): scheduled lives, the one
// on air, and recent replays. Used to attach "Watch live with Medi" links to show_events automatically — Medi schedules
// the live on YouTube with the title the Today tab gave him, and the site finds it by that title.
// Server-only. Cached 5 minutes; a failed fetch returns [] and the pages fall back to what is stored on the rows.
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase";
import { normTitle, placeOf, streamPackage, type StreamEvent } from "@/lib/streamPackage";

export const CHANNEL_ID = "UCcq9rL_fV7b7eDBGcO7fTgQ";
export const CHANNEL_URL = "https://www.youtube.com/@RepAmerica";
export const CHANNEL_LIVE_URL = `${CHANNEL_URL}/streams`;

export type ChannelStream = {
  videoId: string;
  url: string;
  title: string;
  vertical: boolean; // Medi prefixes the vertical (Shorts-feed) twin with 📱
  scheduledText: string | null; // "10/24/26, 4:00 PM" (Pacific, as YouTube renders it for an anonymous US request) or null for live / past
  live: boolean;
};

export async function fetchChannelStreams(): Promise<ChannelStream[]> {
  const res = await fetch(`https://www.youtube.com/channel/${CHANNEL_ID}/streams?hl=en&gl=US`, {
    cache: "no-store",
    headers: {
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
      cookie: "CONSENT=YES+1; SOCS=CAI",
    },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) throw new Error(`YouTube ${res.status}`);
  const html = await res.text();
  const m = /var ytInitialData = (\{[\s\S]*?\});<\/script>/.exec(html);
  if (!m) throw new Error("ytInitialData not found");
  const data = JSON.parse(m[1]) as unknown;
  const out: ChannelStream[] = [];
  const seen = new Set<string>();
  const walk = (o: unknown) => {
    if (Array.isArray(o)) { o.forEach(walk); return; }
    if (!o || typeof o !== "object") return;
    const rec = o as Record<string, unknown>;
    if (rec.lockupViewModel && typeof rec.lockupViewModel === "object") {
      const v = rec.lockupViewModel as { contentId?: string; metadata?: { lockupMetadataViewModel?: { title?: { content?: string } } } };
      const videoId = v.contentId;
      const title = v.metadata?.lockupMetadataViewModel?.title?.content ?? "";
      if (videoId && title && !seen.has(videoId)) {
        seen.add(videoId);
        const s = JSON.stringify(v);
        const sched = /Scheduled for ([^"]+)"/.exec(s)?.[1]?.replace(/\\u202f/g, " ") ?? null;
        const live = !sched && (/"text":"LIVE"/.test(s) || /\bwatching\b/.test(s));
        out.push({ videoId, url: `https://www.youtube.com/watch?v=${videoId}`, title, vertical: /\u{1F4F1}/u.test(title), scheduledText: sched, live });
      }
      return;
    }
    Object.values(rec).forEach(walk);
  };
  walk(data);
  return out;
}

/** The channel's streams (scheduled first, as YouTube lists them), cached 5 minutes. [] when YouTube can't be read. */
export const getChannelStreams = unstable_cache(
  async (): Promise<ChannelStream[]> => {
    try { return await fetchChannelStreams(); } catch { return []; }
  },
  ["ra-channel-streams"],
  { revalidate: 300 },
);

export type LiveLinks = { vertical: string | null; horizontal: string | null; live: boolean; scheduled: boolean };

/** Match the channel's streams to events by title (the title the Today tab generated, or the row's override). */
export function matchLives(events: StreamEvent[], streams: ChannelStream[]): Map<number, LiveLinks> {
  const byTitle = new Map<string, ChannelStream[]>();
  for (const s of streams) {
    const k = normTitle(s.title);
    byTitle.set(k, [...(byTitle.get(k) ?? []), s]);
  }
  const out = new Map<number, LiveLinks>();
  for (const e of events) {
    const want = normTitle(streamPackage(e, "").title);
    let hits = byTitle.get(want) ?? [];
    if (!hits.length) {
      // Fallback for older, hand-typed titles: same day (Pacific) + the state or city in the title.
      const p = placeOf(e);
      const day = new Date(Date.parse(e.starts_at)).toLocaleDateString("en-US", { timeZone: "America/Los_Angeles", year: "2-digit", month: "numeric", day: "numeric" });
      hits = streams.filter((s) => {
        if (!p) return false;
        const t = s.title.toLowerCase();
        const placeHit = (p.state && t.includes(p.state.toLowerCase())) || t.includes(p.city.toLowerCase());
        return placeHit && s.scheduledText?.startsWith(day) === true;
      });
    }
    if (!hits.length) continue;
    const vertical = hits.find((h) => h.vertical) ?? null;
    const horizontal = hits.find((h) => !h.vertical) ?? null;
    out.set(e.id, {
      vertical: vertical?.url ?? null,
      horizontal: horizontal?.url ?? null,
      live: hits.some((h) => h.live),
      scheduled: hits.some((h) => !!h.scheduledText),
    });
  }
  return out;
}

export type EventWithLive = StreamEvent & { liveLinks: LiveLinks | null };

/**
 * Attach live links to events: what the row already stores, refreshed from the channel when a match is found.
 * New matches are written back to show_events (live_url = vertical, live_url_alt = horizontal) so the links survive
 * after the stream drops off YouTube's first page — the live URL is also the replay URL once the stream ends.
 */
export async function withLiveLinks<T extends StreamEvent>(events: T[]): Promise<(T & { liveLinks: LiveLinks | null })[]> {
  const streams = await getChannelStreams();
  const matched = matchLives(events, streams);
  const writes: PromiseLike<unknown>[] = [];
  const out = events.map((e) => {
    const m = matched.get(e.id) ?? null;
    const vertical = m?.vertical ?? e.live_url ?? null;
    const horizontal = m?.horizontal ?? e.live_url_alt ?? null;
    if (m && ((m.vertical && m.vertical !== e.live_url) || (m.horizontal && m.horizontal !== e.live_url_alt))) {
      try {
        writes.push(
          supabaseAdmin().from("show_events").update({ live_url: vertical, live_url_alt: horizontal }).eq("id", e.id).then(() => undefined, () => undefined),
        );
      } catch { /* no service key locally — links still render from the match */ }
    }
    const liveLinks: LiveLinks | null = vertical || horizontal ? { vertical, horizontal, live: m?.live ?? false, scheduled: m?.scheduled ?? false } : null;
    return { ...e, liveLinks };
  });
  if (writes.length) await Promise.allSettled(writes);
  return out;
}

/** Primary public link for an event's Rep America coverage: the vertical live (where the chat is), else the horizontal. */
export const primaryLive = (l: LiveLinks | null) => l?.vertical ?? l?.horizontal ?? null;
