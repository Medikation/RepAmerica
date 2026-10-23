// Ready-to-paste YouTube live title, description and thumbnail for a Trump / White House event on /admin/today.
// Pure helpers — no DB, no React — so the page and the thumbnail route share one source of truth.

export type StreamEvent = {
  id: number;
  starts_at: string;
  all_day: boolean;
  title: string;
  location: string | null;
  notes: string | null;
  stream_title?: string | null;
  stream_description?: string | null;
};

export const US_STATES: Record<string, string> = { AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"Washington, D.C." };

const timeET = (ms: number) => new Date(ms).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });

/** "Midterm rally in St. Clair County (Port Huron), MI featuring President Trump" → { city: "Port Huron", state: "Michigan" } */
export function placeOf(e: Pick<StreamEvent, "title" | "location">): { city: string; state: string | null } | null {
  const re = /\bin ([^,()]+?)(?:\s*\(([^)]*)\))?,\s*([A-Z]{2})\b/;
  const re2 = /([^,()]+?)(?:\s*\(([^)]*)\))?,\s*([A-Z]{2})\b/;
  const m = re.exec(e.title) ?? re2.exec(e.location ?? "");
  if (!m) return null;
  let city = m[1].trim();
  const paren = (m[2] ?? "").replace(/\s*area$/i, "").trim();
  if (paren && /county/i.test(city)) city = paren; // "St. Clair County (Port Huron)" → Port Huron
  return { city, state: US_STATES[m[3]] ?? null };
}

export const placeLabel = (p: ReturnType<typeof placeOf>) => (p ? (p.state ? `${p.city}, ${p.state}` : p.city) : null);

export const isRally = (e: Pick<StreamEvent, "title">) => /rally/i.test(e.title);

/** The thumbnail's state word: "FLORIDA". Rallies only; null when the state can't be read from the event. */
export function thumbState(e: Pick<StreamEvent, "title" | "location">): string | null {
  const p = placeOf(e);
  return p?.state ? p.state.toUpperCase() : null;
}

/** The YouTube live title + description — overrides from the row win, otherwise generated. */
export function streamPackage(e: StreamEvent, signoff: string): { title: string; description: string } {
  const place = placeLabel(placeOf(e));
  const t = e.title;
  let what: string;
  if (isRally(e)) what = place ? `Trump Rally in ${place}` : "Trump Rally";
  else if (/press conference|briefing|gaggle/i.test(t)) what = place ? `Trump Press Conference in ${place}` : "Trump Press Conference";
  else if (/town hall/i.test(t)) what = place ? `Trump Town Hall in ${place}` : "Trump Town Hall";
  else if (/address|speech|remarks|speaks/i.test(t)) what = place ? `Trump Speaks in ${place}` : "Trump Speaks";
  else what = t.replace(/\s*featuring President Trump\s*/i, "").replace(/^President Trump[:\s—-]*/i, "").trim().replace(/^./, (c) => c.toUpperCase());
  if (!/\bTrump\b/.test(what)) what = `Trump: ${what}`;
  const title = e.stream_title?.trim() || `LIVE: ${what}`;
  const when = e.notes?.match(/\b\d{1,2}(?::\d{2})?\s*[AP]M\s*ET\b/i)?.[0] ?? (e.all_day ? null : `${timeET(Date.parse(e.starts_at))} ET`);
  const lead = isRally(e)
    ? `President Trump is live${place ? ` in ${place}` : ""} — watch the rally with me. I'm reacting live and reading the chat.`
    : `President Trump${place ? ` in ${place}` : ""} — watch it with me. I'm reacting live and reading the chat.`;
  const facts = [e.location, when ? `Scheduled for ${when}` : null].filter(Boolean).join(" · ");
  const description = e.stream_description?.trim() || [lead, facts, signoff.trim()].filter(Boolean).join("\n\n");
  return { title, description };
}
