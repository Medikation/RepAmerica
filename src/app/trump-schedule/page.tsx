import type { Metadata } from "next";
import { getSetting } from "@/lib/data";
import { buildMetadata } from "@/lib/seo";
import { dayKeyET, dayLabelET, getPublicSchedule, MEDI_PATH, SCHEDULE_DESCRIPTION, SCHEDULE_PATH, SCHEDULE_TITLE, SCHEDULE_URL, whenET, whenPT, type ScheduleEvent } from "@/lib/schedule";
import { scheduleJsonLd } from "@/lib/scheduleJsonLd";
import { CHANNEL_LIVE_URL } from "@/lib/youtubeLives";
import SchedulePageBody from "@/components/schedule/SchedulePageBody";

// The political reference: what President Trump is doing today and in the weeks ahead, with the White House, the Vice
// President, the Secretary of State, Congress and the Supreme Court around it. Refreshed by the daily task; Medi's
// YouTube live is attached where he streams an event. Rep America's own week lives at /schedule — same data, other door.
export const revalidate = 300;

const DAYS_AHEAD = 45; // everything announced, not just the week
const DAYS_BACK = 7;

export async function generateMetadata(): Promise<Metadata> {
  const base = await buildMetadata({ title: SCHEDULE_TITLE, noSuffix: true, description: SCHEDULE_DESCRIPTION, path: SCHEDULE_PATH, shareKey: "watch" });
  return {
    ...base,
    alternates: { ...(base.alternates ?? {}), canonical: SCHEDULE_URL, types: { "text/calendar": `${SCHEDULE_URL}.ics`, "application/json": `${SCHEDULE_URL}.json` } },
    keywords: ["Trump schedule today", "Trump schedule this week", "what is Trump doing today", "where is Trump today", "Trump public schedule", "when is Trump speaking next", "White House schedule", "White House press briefing today", "JD Vance schedule", "Marco Rubio schedule", "Trump live stream", "Rep America"],
  };
}

const line = (e: ScheduleEvent) => `${e.all_day ? "Time to be announced" : `${whenET(e)} (${whenPT(e)})`}: ${e.headline}`;

export default async function TrumpSchedulePage() {
  const [s, theme] = await Promise.all([getPublicSchedule({ daysAhead: DAYS_AHEAD, daysBack: DAYS_BACK, scope: "political" }), getSetting<Record<string, string>>("theme").catch(() => ({}) as Record<string, string>)]);
  const image = theme.share_image_watch_url ?? theme.share_image_fallback ?? null;
  const nextCovered = s.upcoming.find((e) => e.phase === "upcoming" && e.watchUrl) ?? null;

  // The plain answers people search for: today, what's next, any rallies.
  const todayKey = dayKeyET(s.now);
  const live = (e: ScheduleEvent) => e.status !== "canceled";
  const trumpToday = [...s.past, ...s.upcoming].filter((e) => e.performer === "trump" && live(e) && dayKeyET(e.startsMs) === todayKey).sort((a, b) => a.startsMs - b.startsMs);
  const othersToday = s.upcoming.filter((e) => e.performer !== "trump" && live(e) && dayKeyET(e.startsMs) === todayKey);
  const nextTrump = s.upcoming.find((e) => e.performer === "trump" && live(e) && dayKeyET(e.startsMs) > todayKey) ?? null;
  const rallies = s.upcoming.filter((e) => e.performer === "trump" && live(e) && /rally/i.test(e.title));
  const todayLabel = dayLabelET(s.now);

  const todayText = trumpToday.length
    ? `President Trump's public schedule for ${todayLabel}: ${trumpToday.map(line).join("; ")}.`
    : `Nothing public is on President Trump's schedule for ${todayLabel}.`;
  const nextText = nextTrump
    ? `President Trump's next public event is ${dayLabelET(nextTrump.startsMs)}${nextTrump.all_day ? "" : ` at ${whenET(nextTrump)} (${whenPT(nextTrump)})`}: ${nextTrump.headline}${nextTrump.location ? `, ${nextTrump.location}` : ""}.`
    : "No further public events have been announced yet. The White House usually releases the next day's schedule the evening before.";
  const rallyText = rallies.length
    ? `Yes. ${rallies.map((e) => `${dayLabelET(e.startsMs)}: ${e.headline}`).join("; ")}.`
    : "No Trump rallies are on the schedule right now. If one is announced it will be listed here the same day.";
  const faq = [
    { q: "What is Trump doing today?", a: todayText },
    { q: "When is Trump's next public event?", a: nextText },
    { q: "Is Trump holding any rallies?", a: rallyText },
    { q: "Where can I watch Trump live?", a: "Official events are streamed on the White House YouTube channel, and C-SPAN carries most of them. Each event on this page links to where it airs. Medi covers the major ones live, with commentary and an open chat, on the Rep America YouTube channel." },
    { q: "How often is this schedule updated?", a: "Twice a day, morning and evening, from the White House daily guidance, the State Department public schedule, the Vice President's schedule, and the House, Senate and Supreme Court calendars. Times can change on short notice; the page shows when it was last checked." },
  ];
  const jsonLd = scheduleJsonLd(s, { pageUrl: SCHEDULE_URL, title: SCHEDULE_TITLE, description: SCHEDULE_DESCRIPTION, listName: "Trump and White House schedule: upcoming events", image, faq });

  return (
    <SchedulePageBody
      s={s}
      c={{
        id: "trump-schedule",
        eyebrow: "Updated twice daily · times in ET and PT",
        h1: "Trump's Schedule Today and This Week",
        lead: (
          <>
            What <strong>President Trump</strong> is doing today and what&apos;s coming up, with the <strong>White House</strong>, <strong>JD Vance</strong>, <strong>Marco Rubio</strong>, Congress and the Supreme Court alongside. Where to watch each one, and what happened in the last few days.
          </>
        ),
        primaryHref: nextCovered?.watchUrl ?? CHANNEL_LIVE_URL,
        primaryLabel: nextCovered ? `Next live: ${nextCovered.headline}` : "Rep America live on YouTube",
        icsHref: `${SCHEDULE_PATH}.ics`,
        jsonHref: `${SCHEDULE_PATH}.json`,
        crossLink: s.daily
          ? <>Medi is live on YouTube {s.daily.label}, covering the day&apos;s politics. <a href={MEDI_PATH}>Rep America LIVE schedule →</a></>
          : <>Looking for Medi&apos;s own lives? <a href={MEDI_PATH}>Rep America LIVE schedule →</a></>,
        answer: (
          <div className="ra-sched__answer" id="today">
            <div className="ra-sched__answer-cell">
              <p className="ra-sched__answer-label">Today · {todayLabel}</p>
              {trumpToday.length ? (
                <ul className="ra-sched__answer-list">
                  {trumpToday.map((e) => (<li key={e.id}><b>{e.all_day ? "Time TBA" : whenET(e)}</b> · <a href={`#event-${e.id}`}>{e.headline}</a></li>))}
                </ul>
              ) : (
                <p className="ra-sched__answer-main">Nothing public on President Trump&apos;s schedule today.</p>
              )}
              {othersToday.length > 0 && <p className="ra-sched__answer-sub">Also today: {othersToday.map((e) => e.headline).join("; ")}.</p>}
            </div>
            <div className="ra-sched__answer-cell">
              <p className="ra-sched__answer-label">Next</p>
              {nextTrump ? (
                <>
                  <p className="ra-sched__answer-main"><a href={`#event-${nextTrump.id}`}>{nextTrump.headline}</a></p>
                  <p className="ra-sched__answer-sub">{dayLabelET(nextTrump.startsMs)}{nextTrump.all_day ? "" : ` · ${whenET(nextTrump)} · ${whenPT(nextTrump)}`}</p>
                </>
              ) : (
                <p className="ra-sched__answer-main">Nothing further announced yet.</p>
              )}
              <p className="ra-sched__answer-sub">{rallies.length ? `${rallies.length} Trump ${rallies.length === 1 ? "rally" : "rallies"} announced.` : "No Trump rallies are scheduled right now."}</p>
            </div>
          </div>
        ),
        upcomingHeading: "Coming up",
        upcomingNote: "Everything announced so far. Times come from the official schedules and can move.",
        emptyText: "Nothing has been announced yet. The White House usually releases the next day's schedule the evening before; this page picks it up the same night.",
        pastHeading: "The last 7 days",
        pastNote: "What happened, newest first. Where Medi covered it live, the replay is linked.",
        faq,
        about: (
          <>
            <p>
              This page tracks President Trump&apos;s public schedule: remarks, news conferences, signings, meetings with foreign leaders, travel and anything else the White House puts on the daily guidance. Around it are White House press briefings, Vice President JD Vance, Secretary of State Marco Rubio, major votes and hearings in Congress, and Supreme Court argument and decision days. It is compiled twice a day from the official schedules and each row links to its source. Times are shown in Eastern and Pacific; the local time is in the details when the event is somewhere else.
            </p>
            <p>
              <strong>Watch live with Medi.</strong> Rep America covers the major events live on YouTube, with commentary and an open chat. When Medi is streaming an event, a red button on that row opens the live, and afterwards the replay. Replays and highlight cuts also land in <a href="/watch">Watch</a>, and his own show times are on the <a href={MEDI_PATH}>Rep America LIVE schedule</a>.
            </p>
          </>
        ),
        jsonLd,
      }}
    />
  );
}
