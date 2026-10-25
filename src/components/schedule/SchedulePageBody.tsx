import type { ReactNode } from "react";
import { dayKeyET, dayLabelET, type Schedule, type ScheduleEvent } from "@/lib/schedule";
import ScheduleEventRow from "@/components/schedule/ScheduleEventRow";
import { scheduleStyles } from "@/components/schedule/scheduleStyles";

export type SchedulePageConfig = {
  id: string; // section id suffix
  eyebrow: string;
  h1: string;
  lead: ReactNode;
  primaryHref: string;
  primaryLabel: string;
  icsHref: string;
  jsonHref: string;
  crossLink: ReactNode; // "the other door"
  upcomingNote: string;
  emptyText: string;
  pastNote: string | null;
  about: ReactNode;
  jsonLd: unknown;
};

function groupByDay(list: ScheduleEvent[]): [string, ScheduleEvent[]][] {
  const m = new Map<string, ScheduleEvent[]>();
  for (const e of list) { const k = dayKeyET(e.startsMs); m.set(k, [...(m.get(k) ?? []), e]); }
  return Array.from(m.entries());
}

/** The body both schedule pages share: header, live-now banner, next-7-days grouped by ET day, recently covered, about. */
export default function SchedulePageBody({ s, c }: { s: Schedule; c: SchedulePageConfig }) {
  const todayKey = dayKeyET(s.now);
  const days = groupByDay(s.upcoming);
  const liveNow = s.upcoming.filter((e) => e.phase === "live" && e.watchUrl);
  const updated = new Date(s.now).toLocaleString("en-US", { month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  return (
    <section id={`shopify-section-${c.id}`} className="shopify-section ra-sched">
      <style dangerouslySetInnerHTML={{ __html: scheduleStyles }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(c.jsonLd).replace(/</g, "\\u003c") }} />
      <div className="ra-sched__inner">
        <header>
          <p className="ra-sched__eyebrow"><span className="ra-sched__dot" aria-hidden="true"></span>{c.eyebrow}</p>
          <h1 className="ra-sched__h1">{c.h1}</h1>
          <p className="ra-sched__lead">{c.lead}</p>
          <div className="ra-sched__actions">
            <a className="ra-button ra-button--primary" href={c.primaryHref} target={c.primaryHref.startsWith("http") ? "_blank" : undefined} rel={c.primaryHref.startsWith("http") ? "noopener noreferrer" : undefined}>{c.primaryLabel}</a>
            <a className="ra-button ra-button--secondary" href={c.icsHref}>Add to your calendar</a>
          </div>
          <p className="ra-sched__doors">{c.crossLink}</p>
          {liveNow.length > 0 && (
            <div className="ra-sched__live-banner" role="status">
              <strong>Live now</strong>
              <span>{liveNow[0].headline}</span>
              <a className="ra-button" href={liveNow[0].watchUrl!} target="_blank" rel="noopener noreferrer">{liveNow[0].platform === "tiktok" ? "Join on TikTok" : "Watch with Medi"}</a>
            </div>
          )}
        </header>

        <section className="ra-sched__section" aria-labelledby={`${c.id}-upcoming`}>
          <h2 id={`${c.id}-upcoming`} className="ra-sched__h2">Next 7 days</h2>
          <p className="ra-sched__h2-note">Last checked {updated} ET. {c.upcomingNote}</p>
          {days.length ? days.map(([day, list]) => (
            <div key={day}>
              <h3 className={`ra-sched__day${day === todayKey ? " ra-sched__day--today" : ""}`}>{day === todayKey ? "Today — " : ""}{dayLabelET(list[0].startsMs)}</h3>
              <ol className="ra-sched__list">{list.map((e) => <ScheduleEventRow key={e.id} e={e} />)}</ol>
            </div>
          )) : (
            <p className="ra-sched__empty">{c.emptyText}</p>
          )}
        </section>

        {s.past.length > 0 && c.pastNote && (
          <section className="ra-sched__section" aria-labelledby={`${c.id}-past`}>
            <h2 id={`${c.id}-past`} className="ra-sched__h2">Recently covered</h2>
            <p className="ra-sched__h2-note">{c.pastNote}</p>
            <ol className="ra-sched__list">{s.past.map((e) => <ScheduleEventRow key={e.id} e={e} showDay />)}</ol>
          </section>
        )}

        <section className="ra-sched__about" aria-labelledby={`${c.id}-about`}>
          <h2 id={`${c.id}-about`}>About this schedule</h2>
          {c.about}
          <p>Developers and AI assistants: the same schedule is available as structured data on this page (schema.org Event + BroadcastEvent) and as feeds:</p>
          <ul className="ra-sched__feeds">
            <li><a href={c.jsonHref}>JSON feed</a></li>
            <li><a href={c.icsHref}>iCalendar (.ics) — subscribe in Google, Apple or Outlook calendar</a></li>
          </ul>
        </section>
      </div>
    </section>
  );
}
