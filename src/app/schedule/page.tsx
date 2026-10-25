import type { Metadata } from "next";
import { getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getPublicSchedule, MEDI_DESCRIPTION, MEDI_PATH, MEDI_TITLE, MEDI_URL, SCHEDULE_PATH } from "@/lib/schedule";
import { scheduleJsonLd } from "@/lib/scheduleJsonLd";
import { CHANNEL_LIVE_URL } from "@/lib/youtubeLives";
import SchedulePageBody from "@/components/schedule/SchedulePageBody";

// Rep America's own week: the Trump / White House events Medi streams live on YouTube, the TikTok live that follows each
// rally, and any other live he schedules. The full political listing is /trump-schedule — same data, other door.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const base = await buildMetadata({ title: MEDI_TITLE, noSuffix: true, description: MEDI_DESCRIPTION, path: MEDI_PATH, shareKey: "watch" });
  return {
    ...base,
    alternates: { ...(base.alternates ?? {}), canonical: MEDI_URL, types: { "text/calendar": `${MEDI_URL}.ics`, "application/json": `${MEDI_URL}.json` } },
    keywords: ["Rep America live", "Medi live", "Rep America schedule", "Trump rally live stream with commentary", "Rep America TikTok live", "Medikation live"],
  };
}

export default async function RepAmericaSchedulePage() {
  const [s, theme] = await Promise.all([getPublicSchedule({ daysAhead: 7, daysBack: 14, scope: "medi" }), getSetting<Record<string, string>>("theme").catch(() => ({}) as Record<string, string>)]);
  const image = theme.share_image_watch_url ?? theme.share_image_fallback ?? null;
  const next = s.upcoming.find((e) => e.phase === "upcoming" && e.watchUrl) ?? null;
  const jsonLd = scheduleJsonLd(s, { pageUrl: MEDI_URL, title: MEDI_TITLE, description: MEDI_DESCRIPTION, listName: "Rep America LIVE — this week", image });
  return (
    <SchedulePageBody
      s={s}
      c={{
        id: "schedule",
        eyebrow: "Rep America LIVE · this week · times in ET and PT",
        h1: "This Week on Rep America",
        lead: (
          <>
            Where to find Medi live this week: the <strong>Trump rallies and White House events</strong> he streams on YouTube with the chat open, and <strong>Rep America LIVE on TikTok</strong> after every rally — <em>{s.tiktok.headline}</em>. Debates, questions, real talk.
          </>
        ),
        primaryHref: next?.watchUrl ?? CHANNEL_LIVE_URL,
        primaryLabel: next ? (next.platform === "tiktok" ? "Next: Rep America LIVE on TikTok" : `Next live: ${next.headline}`) : "Rep America on YouTube",
        icsHref: `${MEDI_PATH}.ics`,
        jsonHref: `${MEDI_PATH}.json`,
        crossLink: <>Want every Trump, White House and political event this week, covered or not? <a href={SCHEDULE_PATH}>Full Trump &amp; White House schedule →</a></>,
        upcomingNote: "Rally times come from the campaign and can move. The TikTok live starts when Trump wraps — usually 1½ to 2 hours after the rally begins — so that time is approximate.",
        emptyText: "Nothing scheduled yet this week — check back, or subscribe to the calendar above and your phone will tell you.",
        pastNote: "The last two weeks of rallies Medi streamed live — replays and highlights on the Rep America YouTube channel.",
        about: (
          <>
            <p>
              Rep America is Medi&apos;s channel: live coverage of Trump rallies and White House events on YouTube, and <strong>Rep America LIVE</strong> on TikTok (@repamerica) — one show, every time: debate him on Trump, or ask him anything about money, work, family and your future. The TikTok live follows every rally he covers and runs on its own on other nights; those get added here as they&apos;re scheduled.
            </p>
            <p>
              The red button on a rally opens the YouTube live (vertical, where the chat is) and the replay afterwards. The black button opens TikTok. The full political listing for the week — including events Medi isn&apos;t covering — is the <a href={SCHEDULE_PATH}>Trump &amp; White House schedule</a>.
            </p>
          </>
        ),
        jsonLd,
      }}
    />
  );
}
