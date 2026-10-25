import type { Metadata } from "next";
import { getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getPublicSchedule, MEDI_PATH, SCHEDULE_DESCRIPTION, SCHEDULE_PATH, SCHEDULE_TITLE, SCHEDULE_URL } from "@/lib/schedule";
import { scheduleJsonLd } from "@/lib/scheduleJsonLd";
import { CHANNEL_LIVE_URL } from "@/lib/youtubeLives";
import SchedulePageBody from "@/components/schedule/SchedulePageBody";

// The political reference: every public Trump / White House / Vance / political event for the week, with Medi's
// YouTube live where he streams it. Rep America's own week (TikTok lives etc.) lives at /schedule — same data, other door.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const base = await buildMetadata({ title: SCHEDULE_TITLE, noSuffix: true, description: SCHEDULE_DESCRIPTION, path: SCHEDULE_PATH, shareKey: "watch" });
  return {
    ...base,
    alternates: { ...(base.alternates ?? {}), canonical: SCHEDULE_URL, types: { "text/calendar": `${SCHEDULE_URL}.ics`, "application/json": `${SCHEDULE_URL}.json` } },
    keywords: ["Trump schedule", "Trump rally schedule", "Trump rally today", "Trump schedule this week", "where is Trump today", "White House schedule", "White House press briefing today", "Trump rally live stream", "JD Vance rally schedule", "Rep America"],
  };
}

export default async function TrumpSchedulePage() {
  const [s, theme] = await Promise.all([getPublicSchedule({ daysAhead: 7, daysBack: 14, scope: "political" }), getSetting<Record<string, string>>("theme").catch(() => ({}) as Record<string, string>)]);
  const image = theme.share_image_watch_url ?? theme.share_image_fallback ?? null;
  const nextCovered = s.upcoming.find((e) => e.phase === "upcoming" && e.watchUrl) ?? null;
  const jsonLd = scheduleJsonLd(s, { pageUrl: SCHEDULE_URL, title: SCHEDULE_TITLE, description: SCHEDULE_DESCRIPTION, listName: "Trump and White House schedule — next 7 days", image });
  return (
    <SchedulePageBody
      s={s}
      c={{
        id: "trump-schedule",
        eyebrow: "Political schedule · updated daily · times in ET and PT",
        h1: "Trump & White House Schedule This Week",
        lead: (
          <>
            Every upcoming <strong>Trump rally</strong>, <strong>White House</strong> press briefing, signing and event, <strong>JD Vance rally</strong> and major political event for the next seven days — when it starts, where it is, the official page, and the <strong>Rep America live stream</strong> for the ones Medi covers live on YouTube.
          </>
        ),
        primaryHref: nextCovered?.watchUrl ?? CHANNEL_LIVE_URL,
        primaryLabel: nextCovered ? `Next live: ${nextCovered.headline}` : "Rep America live on YouTube",
        icsHref: `${SCHEDULE_PATH}.ics`,
        jsonHref: `${SCHEDULE_PATH}.json`,
        crossLink: <>Looking for Medi&apos;s own week — the rallies he streams plus his TikTok lives? <a href={MEDI_PATH}>Rep America LIVE schedule →</a></>,
        upcomingNote: "Times come from the campaign, the White House and the event hosts and can move — the row updates when they do.",
        emptyText: "Nothing announced for the next seven days yet. New rallies usually post a few days out — check back, or subscribe to the calendar above.",
        pastNote: "The last two weeks of events Medi streamed live — replays and highlights on the Rep America YouTube channel.",
        about: (
          <>
            <p>
              This page lists President Trump&apos;s rallies and public events, White House press briefings, signings and announcements, Vice President JD Vance&apos;s rallies, and other major political events for the week ahead, compiled daily from the official sources (campaign event pages, the White House daily guidance, and the networks carrying the feeds). Each row links to the official event page where one exists. Times are shown in Eastern and Pacific; the local time at the venue is in the note when it differs.
            </p>
            <p>
              <strong>Watch live with Medi.</strong> Rep America streams the rallies live on YouTube in two layouts: the vertical stream, where most of the audience and the chat are, and a widescreen stream. The red button on an event opens the live; after the event it opens the replay. Replays and highlight cuts also land in <a href="/watch">Watch</a>. After each rally, Medi goes live on TikTok — that and the rest of his week are on the <a href={MEDI_PATH}>Rep America LIVE schedule</a>.
            </p>
          </>
        ),
        jsonLd,
      }}
    />
  );
}
