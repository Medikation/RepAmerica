import type { Metadata } from "next";
import { getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { getPublicSchedule, MEDI_DESCRIPTION, MEDI_PATH, MEDI_TITLE, MEDI_URL, SCHEDULE_PATH } from "@/lib/schedule";
import { scheduleJsonLd } from "@/lib/scheduleJsonLd";
import { CHANNEL_LIVE_URL } from "@/lib/youtubeLives";
import SchedulePageBody from "@/components/schedule/SchedulePageBody";

// Rep America's own week: Medi's standing weekday show (show_settings daily_live_*), the Trump / White House events he
// streams live on YouTube, and any other live he schedules. The political listing is /trump-schedule — same data, other door.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const base = await buildMetadata({ title: MEDI_TITLE, noSuffix: true, description: MEDI_DESCRIPTION, path: MEDI_PATH, shareKey: "watch" });
  return {
    ...base,
    alternates: { ...(base.alternates ?? {}), canonical: MEDI_URL, types: { "text/calendar": `${MEDI_URL}.ics`, "application/json": `${MEDI_URL}.json` } },
    keywords: ["Rep America live", "Medi live", "Rep America schedule", "Rep America live stream time", "live political commentary YouTube", "Medikation live"],
  };
}

export default async function RepAmericaSchedulePage() {
  const [s, theme] = await Promise.all([getPublicSchedule({ daysAhead: 7, daysBack: 14, scope: "medi" }), getSetting<Record<string, string>>("theme").catch(() => ({}) as Record<string, string>)]);
  const image = theme.share_image_watch_url ?? theme.share_image_fallback ?? null;
  const next = s.upcoming.find((e) => e.watchUrl) ?? null;
  const jsonLd = scheduleJsonLd(s, { pageUrl: MEDI_URL, title: MEDI_TITLE, description: MEDI_DESCRIPTION, listName: "Rep America LIVE: this week", image });
  return (
    <SchedulePageBody
      s={s}
      c={{
        id: "schedule",
        eyebrow: "Rep America LIVE · times in ET and PT",
        h1: "This Week on Rep America",
        lead: s.daily ? (
          <>
            Medi is live on YouTube <strong>{s.daily.label}</strong>. Politics, laughs and life, with the chat open the whole time.
          </>
        ) : (
          <>Medi&apos;s lives on YouTube this week, with the chat open the whole time.</>
        ),
        primaryHref: next?.watchUrl ?? CHANNEL_LIVE_URL,
        primaryLabel: next?.phase === "live" ? "Live now on YouTube" : "Rep America on YouTube",
        icsHref: `${MEDI_PATH}.ics`,
        jsonHref: `${MEDI_PATH}.json`,
        crossLink: <>Want to know what Trump and the White House are doing today? <a href={SCHEDULE_PATH}>Trump &amp; White House schedule →</a></>,
        upcomingNote: "Trump and White House events Medi covers live are added as they are announced.",
        emptyText: "Nothing scheduled yet this week. Check back, or subscribe to the calendar above and your phone will tell you.",
        pastNote: "The last two weeks of events Medi streamed live. Replays and highlights are on the Rep America YouTube channel.",
        about: (
          <>
            <p>
              Rep America is Medi&apos;s channel. The show is <strong>Rep America LIVE</strong>{s.daily ? <>, on YouTube {s.daily.label}</> : null}: the day&apos;s politics, clips and posts, open debates, books, money, family and whatever comes up. It streams in vertical and widescreen at the same time, so watch whichever way you like.
            </p>
            <p>
              When President Trump or the White House does something worth watching live, Medi goes live for it and it shows up here with a red button. For the full political calendar, including events he isn&apos;t covering, see the <a href={SCHEDULE_PATH}>Trump &amp; White House schedule</a>.
            </p>
          </>
        ),
        jsonLd,
      }}
    />
  );
}
