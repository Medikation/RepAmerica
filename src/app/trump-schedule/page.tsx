import type { Metadata } from "next";
import { getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { dayKeyET, dayLabelET, getPublicSchedule, SCHEDULE_DESCRIPTION, SCHEDULE_PATH, SCHEDULE_TITLE, SCHEDULE_URL, type ScheduleEvent } from "@/lib/schedule";
import { scheduleJsonLd } from "@/lib/scheduleJsonLd";
import { CHANNEL_LIVE_URL } from "@/lib/youtubeLives";
import ScheduleEventRow from "@/components/schedule/ScheduleEventRow";
import { scheduleStyles } from "@/components/schedule/scheduleStyles";

// Public, SEO-facing: the week's Trump / JD Vance / White House events with Rep America's live links. Data is the
// same `show_events` table the admin Today tab uses (refreshed daily by the calendar task); live links come from the
// channel's Streams page. Re-rendered at most every 5 minutes.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const base = await buildMetadata({ title: SCHEDULE_TITLE, noSuffix: true, description: SCHEDULE_DESCRIPTION, path: SCHEDULE_PATH, shareKey: "watch" });
  return {
    ...base,
    alternates: { ...(base.alternates ?? {}), canonical: SCHEDULE_URL, types: { "text/calendar": `${SCHEDULE_URL}.ics`, "application/json": `${SCHEDULE_URL}.json` } },
    keywords: ["Trump rally schedule", "Trump rally today", "Trump schedule this week", "where is Trump today", "Trump rally live stream", "JD Vance rally schedule", "White House press briefing today", "White House schedule", "Trump live", "Rep America"],
  };
}

function groupByDay(list: ScheduleEvent[]): [string, ScheduleEvent[]][] {
  const m = new Map<string, ScheduleEvent[]>();
  for (const e of list) { const k = dayKeyET(e.startsMs); m.set(k, [...(m.get(k) ?? []), e]); }
  return Array.from(m.entries());
}

export default async function TrumpSchedulePage() {
  const [s, theme] = await Promise.all([getPublicSchedule({ daysAhead: 7, daysBack: 14 }), getSetting<Record<string, string>>("theme").catch(() => ({}) as Record<string, string>)]);
  const image = theme.share_image_watch_url ?? theme.share_image_fallback ?? null;
  const todayKey = dayKeyET(s.now);
  const days = groupByDay(s.upcoming);
  const liveNow = s.upcoming.filter((e) => e.phase === "live" && e.watchUrl);
  const nextCovered = s.upcoming.find((e) => e.phase === "upcoming" && e.watchUrl) ?? null;
  const updated = new Date(s.now).toLocaleString("en-US", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  const jsonLd = scheduleJsonLd(s, image);

  return (
    <section id="shopify-section-trump-schedule" className="shopify-section ra-sched">
      <style dangerouslySetInnerHTML={{ __html: scheduleStyles }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="ra-sched__inner">
        <header>
          <p className="ra-sched__eyebrow"><span className="ra-sched__dot" aria-hidden="true"></span>Live schedule · updated daily · times in ET and PT</p>
          <h1 className="ra-sched__h1">Trump Rally Schedule This Week</h1>
          <p className="ra-sched__lead">
            Every upcoming <strong>Trump rally</strong>, <strong>JD Vance rally</strong> and <strong>White House event</strong> for the next seven days — when it starts, where it is, and the <strong>Rep America live stream</strong> for the ones Medi covers live on YouTube, with the chat open.
          </p>
          <div className="ra-sched__actions">
            <a className="ra-button ra-button--primary" href={nextCovered?.watchUrl ?? CHANNEL_LIVE_URL} target="_blank" rel="noopener noreferrer">{nextCovered ? `Next live: ${nextCovered.headline}` : "Rep America live on YouTube"}</a>
            <a className="ra-button ra-button--secondary" href={`${SCHEDULE_PATH}.ics`}>Add to your calendar</a>
          </div>
          {liveNow.length > 0 && (
            <div className="ra-sched__live-banner" role="status">
              <strong>Live now</strong>
              <span>{liveNow[0].headline}</span>
              <a className="ra-button" href={liveNow[0].watchUrl!} target="_blank" rel="noopener noreferrer">Watch with Medi</a>
            </div>
          )}
        </header>

        <section className="ra-sched__section" aria-labelledby="sched-upcoming">
          <h2 id="sched-upcoming" className="ra-sched__h2">Next 7 days</h2>
          <p className="ra-sched__h2-note">Last checked {updated} ET. Times come from the campaign, the White House and the event hosts and can move — the row updates when they do.</p>
          {days.length ? days.map(([day, list]) => (
            <div key={day}>
              <h3 className={`ra-sched__day${day === todayKey ? " ra-sched__day--today" : ""}`}>{day === todayKey ? "Today — " : ""}{dayLabelET(list[0].startsMs)}</h3>
              <ol className="ra-sched__list">{list.map((e) => <ScheduleEventRow key={e.id} e={e} />)}</ol>
            </div>
          )) : (
            <p className="ra-sched__empty">Nothing announced for the next seven days yet. New rallies usually post a few days out — check back, or subscribe to the calendar above.</p>
          )}
        </section>

        {s.past.length > 0 && (
          <section className="ra-sched__section" aria-labelledby="sched-past">
            <h2 id="sched-past" className="ra-sched__h2">Recently covered</h2>
            <p className="ra-sched__h2-note">The last two weeks of events Medi streamed live — replays and highlights on the Rep America YouTube channel.</p>
            <ol className="ra-sched__list">{s.past.map((e) => <ScheduleEventRow key={e.id} e={e} showDay />)}</ol>
          </section>
        )}

        <section className="ra-sched__about" aria-labelledby="sched-about">
          <h2 id="sched-about">About this schedule</h2>
          <p>
            This page lists President Trump&apos;s rallies and public events, Vice President JD Vance&apos;s rallies, and White House press briefings and announcements for the week ahead, compiled daily from the official sources (campaign event pages, the White House daily guidance, and the networks carrying the feeds). Each row links to the official event page where one exists. Times are shown in Eastern and Pacific; the local time at the venue is in the note when it differs.
          </p>
          <p>
            <strong>Watch live with Medi.</strong> Rep America streams the rallies live on YouTube in two layouts: the vertical stream, where most of the audience and the chat are, and a widescreen stream. The red button on an event opens the live; after the event it opens the replay. Replays and highlight cuts also land in <a href="/watch">Watch</a>.
          </p>
          <p>Developers and AI assistants: the same schedule is available as structured data on this page (schema.org Event + BroadcastEvent) and as feeds:</p>
          <ul className="ra-sched__feeds">
            <li><a href={`${SCHEDULE_PATH}.json`}>JSON feed</a></li>
            <li><a href={`${SCHEDULE_PATH}.ics`}>iCalendar (.ics) — subscribe in Google, Apple or Outlook calendar</a></li>
          </ul>
        </section>
      </div>
    </section>
  );
}
