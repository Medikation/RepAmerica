import { dayShortET, statusLabel, whenET, whenPT, type ScheduleEvent } from "@/lib/schedule";
import { isoET } from "@/lib/schedule";

/** One event on the public schedule: time (ET + PT), what / where, and the Rep America button when Medi covers it. */
export default function ScheduleEventRow({ e, showDay = false }: { e: ScheduleEvent; showDay?: boolean }) {
  const st = statusLabel(e);
  const replay = e.phase === "past";
  const canceled = e.status === "canceled";
  const metaBits = [e.sub, e.location, e.notes].filter(Boolean) as string[];
  return (
    <li id={`event-${e.id}`} className={`ra-sched__event ra-sched__event--${e.phase}${canceled ? " ra-sched__event--canceled" : ""}`}>
      <div className="ra-sched__time">
        {showDay && <span className="ra-sched__time-day">{dayShortET(e.startsMs)}</span>}
        <time dateTime={isoET(e.startsMs)} className="ra-sched__time-et">{whenET(e)}</time>
        {!e.all_day && <span className="ra-sched__time-pt">{whenPT(e)}</span>}
      </div>
      <div className="ra-sched__body">
        <h3 className="ra-sched__name">
          <span className={`ra-sched__status ra-sched__status--${st.tone}`}>{st.text}</span>
          {e.headline}
        </h3>
        {metaBits.length > 0 && <p className="ra-sched__meta">{metaBits.join(" · ")}</p>}
        {e.source_url && !canceled && (
          <p className="ra-sched__source"><a href={e.source_url} target="_blank" rel="noopener noreferrer nofollow">Official event details</a>{e.stream_url && !e.watchUrl ? <> · <a href={e.stream_url} target="_blank" rel="noopener noreferrer nofollow">Official stream</a></> : null}</p>
        )}
      </div>
      <div className="ra-sched__action">
        {e.watchUrl && !canceled ? (
          <>
            <a className={`ra-button ${replay ? "ra-button--secondary" : "ra-button--primary"} ra-sched__watch${e.phase === "live" ? " ra-sched__watch--live" : ""}`} href={e.watchUrl} target="_blank" rel="noopener noreferrer">
              {e.phase === "live" ? "Watch live now" : replay ? "Watch the replay" : "Watch live with Medi"}
            </a>
            {e.liveLinks?.horizontal && e.liveLinks.vertical && (
              <a className="ra-sched__alt" href={e.liveLinks.horizontal} target="_blank" rel="noopener noreferrer">widescreen stream</a>
            )}
            {e.video_url && <a className="ra-sched__alt" href={e.video_url} target="_blank" rel="noopener noreferrer">highlights</a>}
          </>
        ) : e.video_url && !canceled ? (
          <a className="ra-button ra-button--secondary ra-sched__watch" href={e.video_url} target="_blank" rel="noopener noreferrer">Watch the highlights</a>
        ) : null}
      </div>
    </li>
  );
}
