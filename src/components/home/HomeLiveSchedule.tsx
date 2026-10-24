import { dayShortET, getPublicSchedule, SCHEDULE_PATH, whenET, whenPT, type ScheduleEvent } from "@/lib/schedule";
import { scheduleStyles } from "@/components/schedule/scheduleStyles";
import { isBlank, str } from "./util";

export interface HomeLiveScheduleSettings { eyebrow?: string; heading?: string; text?: string; link_label?: string; limit?: number }

/** Homepage strip (section type "home-live-schedule"): the next few Trump / Vance / White House events with
 *  "Watch live" where Medi is streaming, linking to the full /trump-schedule page. Renders nothing when the week is empty. */
export default async function HomeLiveSchedule({ id, settings }: { id: string; settings: HomeLiveScheduleSettings }) {
  const s = await getPublicSchedule({ daysAhead: 7, daysBack: 0 }).catch(() => null);
  if (!s || !s.upcoming.length) return null;
  const limit = Number(settings.limit) || 4;
  const live = s.upcoming.filter((e) => e.phase === "live");
  const list: ScheduleEvent[] = [...live, ...s.upcoming.filter((e) => e.phase !== "live" && e.status !== "canceled")].slice(0, limit);
  const heading = str(settings.heading) || "Trump rally schedule this week";
  return (
    <section id={`shopify-section-${id}`} className="shopify-section">
      <style dangerouslySetInnerHTML={{ __html: scheduleStyles }} />
      <section className="ra-section ra-home-sched" id={`HomeLiveSchedule-${id}`} aria-labelledby={`HomeLiveScheduleHeading-${id}`}>
        <div className="ra-container">
          <div className="ra-section-header ra-section-header--row">
            <div>
              <p className="ra-section-header__eyebrow">{str(settings.eyebrow) || "Live this week"}</p>
              <h2 id={`HomeLiveScheduleHeading-${id}`} className="ra-section-header__title">{heading}</h2>
              {!isBlank(settings.text) && <div className="ra-section-header__text" dangerouslySetInnerHTML={{ __html: str(settings.text) }} />}
            </div>
            <div className="ra-section-header__actions">
              <a className="ra-button ra-button--secondary" href={SCHEDULE_PATH}>{str(settings.link_label) || "Full schedule"}</a>
            </div>
          </div>
          <div className="ra-home-sched__grid">
            {list.map((e) => {
              const href = e.watchUrl ?? `${SCHEDULE_PATH}#event-${e.id}`;
              const external = !!e.watchUrl;
              return (
                <a key={e.id} className={`ra-home-sched__card${e.phase === "live" ? " ra-home-sched__card--live" : ""}`} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                  <span className="ra-home-sched__when"><b>{dayShortET(e.startsMs)}</b> · {whenET(e)}{whenPT(e) ? ` · ${whenPT(e)}` : ""}</span>
                  <h3 className="ra-home-sched__name">{e.headline}</h3>
                  {e.location && <p className="ra-home-sched__place">{e.location}</p>}
                  <span className={`ra-home-sched__cta${e.watchUrl ? "" : " ra-home-sched__cta--muted"}`}>
                    {e.phase === "live" ? "● Live now — watch with Medi" : e.watchUrl ? "Watch live with Medi →" : e.status === "tentative" ? "Tentative · details" : "Details →"}
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      </section>
    </section>
  );
}
