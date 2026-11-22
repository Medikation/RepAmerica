import { dayShortET, statusLabel, whenET, whenPT, type ScheduleEvent } from "@/lib/schedule";
import { isoET } from "@/lib/schedule";

/** One event on the public schedule: time (ET + PT), what / where, and the Rep America button when Medi covers it.
 *  TikTok rows (Medi's own lives, incl. the one after each rally) get the TikTok button and a short indent. */
export default function ScheduleEventRow({ e, showDay = false }: { e: ScheduleEvent; showDay?: boolean }) {
  const st = statusLabel(e);
  const replay = e.phase === "past";
  const canceled = e.status === "canceled";
  const tiktok = e.platform === "tiktok";
  const cls = ["ra-sched__event", `ra-sched__event--${e.phase}`, canceled ? "ra-sched__event--canceled" : "", tiktok ? "ra-sched__event--tiktok" : "", e.aftershowOf ? "ra-sched__event--after" : ""].filter(Boolean).join(" ");
  // Glanceable row: time · what/where · button. Everything else (venue, doors, official links) sits behind "Details".
  const rally = /rally/i.test(e.title);
  const label = tiktok ? "Rep America LIVE on TikTok" : e.performer === "trump" && rally && e.city && e.state ? `${e.city}, ${e.state}` : e.headline;
  const KICKER: Record<string, string> = { trump: "President Trump", vance: "Vice President Vance", rubio: "Secretary Rubio", "white-house": "White House", congress: "Congress", court: "Supreme Court", other: "Major event", medi: "Rep America LIVE" };
  const kicker = tiktok ? (e.aftershowOf ? "After the rally" : "Live") : e.performer === "trump" && rally ? "Trump rally" : KICKER[e.performer] ?? null;
  const closed = e.streamable === false && !replay && !canceled;
  const showStatus = st.tone !== "ok"; // "Scheduled" is the default — no chip noise
  const details = (tiktok ? [e.sub, e.notes] : [e.sub && !/^Midterm rally$/i.test(e.sub) ? e.sub : null, e.location, e.notes]).filter(Boolean) as string[];
  return (
    <li id={`event-${e.id}`} className={cls} data-who={e.performer}>
      <div className="ra-sched__time">
        {showDay && <span className="ra-sched__time-day">{dayShortET(e.startsMs)}</span>}
        <time dateTime={isoET(e.startsMs)} className="ra-sched__time-et">{e.aftershowOf ? `~${whenET(e)}` : whenET(e)}</time>
        {!e.all_day && <span className="ra-sched__time-pt">{e.aftershowOf ? `~${whenPT(e)}` : whenPT(e)}</span>}
      </div>
      <div className="ra-sched__body">
        {kicker && <p className={`ra-sched__kicker${e.performer === "trump" ? " ra-sched__kicker--trump" : ""}`}>{kicker}{closed && <span className="ra-sched__status ra-sched__status--muted">No cameras</span>}{showStatus && <span className={`ra-sched__status ra-sched__status--${st.tone}`}>{st.text}</span>}</p>}
        <h3 className="ra-sched__name">{e.performer === "trump" && rally && !tiktok ? <><span className="ra-sched__trump">Trump</span> · {label}</> : label}</h3>
        {(details.length > 0 || (e.source_url && !canceled && !tiktok)) && (
          <details className="ra-sched__more">
            <summary>Details</summary>
            {details.length > 0 && <p className="ra-sched__meta">{details.join(" · ")}</p>}
            {e.source_url && !canceled && !tiktok && (
              <p className="ra-sched__source"><a href={e.source_url} target="_blank" rel="noopener noreferrer nofollow">Official event details</a>{e.stream_url && !e.watchUrl ? <> · <a href={e.stream_url} target="_blank" rel="noopener noreferrer nofollow">Official stream</a></> : null}</p>
            )}
          </details>
        )}
      </div>
      <div className="ra-sched__action">
        {tiktok && e.watchUrl && !canceled && !replay ? (
          <a className={`ra-button ra-button--primary ra-sched__watch ra-sched__watch--tiktok${e.phase === "live" ? " ra-sched__watch--live" : ""}`} href={e.watchUrl} target="_blank" rel="noopener noreferrer">
            {e.phase === "live" ? "Live on TikTok now" : "Join on TikTok"}
          </a>
        ) : e.watchUrl && !canceled && !tiktok ? (
          <>
            <a className={`ra-button ${replay ? "ra-button--secondary" : "ra-button--primary"} ra-sched__watch${e.phase === "live" ? " ra-sched__watch--live" : ""}`} href={e.watchUrl} target="_blank" rel="noopener noreferrer">
              {e.phase === "live" ? "Watch live now" : replay ? "Watch the replay" : e.virtual ? "Watch on YouTube" : "Watch live with Medi"}
            </a>
            {e.liveLinks?.horizontal && e.liveLinks.vertical && (
              <a className="ra-sched__alt" href={e.liveLinks.horizontal} target="_blank" rel="noopener noreferrer">widescreen stream</a>
            )}
            {e.video_url && <a className="ra-sched__alt" href={e.video_url} target="_blank" rel="noopener noreferrer">highlights</a>}
          </>
        ) : e.video_url && !canceled ? (
          <a className="ra-button ra-button--secondary ra-sched__watch" href={e.video_url} target="_blank" rel="noopener noreferrer">Watch the highlights</a>
        ) : e.stream_url && !canceled && !tiktok && e.streamable !== false && !replay ? (
          <a className="ra-sched__alt" href={e.stream_url} target="_blank" rel="noopener noreferrer nofollow">Where to watch</a>
        ) : null}
      </div>
    </li>
  );
}
