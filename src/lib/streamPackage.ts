// Ready-to-paste YouTube live title, description and thumbnail for a Trump / White House / campaign event, plus the
// public labels the /trump-schedule page uses. Pure helpers — no DB, no React — shared by the admin Today tab, the
// thumbnail route and the public schedule.

export type StreamEvent = {
  id: number;
  starts_at: string;
  ends_at?: string | null;
  all_day: boolean;
  title: string;
  kind?: "trump" | "white-house" | "campaign" | "other" | string;
  location: string | null;
  notes: string | null;
  status?: string | null;
  stream_url?: string | null;
  source_url?: string | null;
  stream_title?: string | null;
  stream_description?: string | null;
  live_url?: string | null;
  live_url_alt?: string | null;
  video_url?: string | null;
  is_public?: boolean | null;
};

export const US_STATES: Record<string, string> = { AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",CT:"Connecticut",DE:"Delaware",FL:"Florida",GA:"Georgia",HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming",DC:"Washington, D.C." };

export const ET = "America/New_York";
export const timeET = (ms: number) => new Date(ms).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: ET });
/** "3 PM" / "3:30 PM" in ET — the short form used in live titles. */
export const shortTimeET = (ms: number) => timeET(ms).replace(":00", "");
/** "Sun 10/25" in ET. */
export const shortDateET = (ms: number) => { const d = new Date(ms); return `${d.toLocaleDateString("en-US", { weekday: "short", timeZone: ET })} ${d.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: ET })}`; };
export const SCHEDULE_LINK = "https://repamerica.com/trump-schedule";
export const timePT = (ms: number) => new Date(ms).toLocaleString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Los_Angeles" });

/** "Midterm rally in St. Clair County (Port Huron), MI featuring President Trump" → { city: "Port Huron", state: "Michigan", st: "MI" } */
export function placeOf(e: Pick<StreamEvent, "title" | "location">): { city: string; state: string | null; st: string } | null {
  const re = /\bin ([^,()]+?)(?:\s*\(([^)]*)\))?,\s*([A-Z]{2})\b/;
  const re2 = /([^,()]+?)(?:\s*\(([^)]*)\))?,\s*([A-Z]{2})\b/;
  const m = re.exec(e.title) ?? re2.exec(e.location ?? "");
  if (!m) return null;
  let city = m[1].trim();
  const paren = (m[2] ?? "").replace(/\s*area$/i, "").trim();
  if (paren && /county/i.test(city)) city = paren; // "St. Clair County (Port Huron)" → Port Huron
  return { city, state: US_STATES[m[3]] ?? null, st: m[3] };
}

export const placeLabel = (p: ReturnType<typeof placeOf>) => (p ? (p.state ? `${p.city}, ${p.state}` : p.city) : null);

export const isRally = (e: Pick<StreamEvent, "title">) => /rally/i.test(e.title);

export type Performer = "trump" | "vance" | "white-house" | "medi" | "other";

/** Who the event is about. Vance is named in the title; Trump is the default for kind=trump or any title naming him. */
export function performerOf(e: Pick<StreamEvent, "title" | "kind">): Performer {
  const t = e.title;
  if (e.kind === "medi") return "medi"; // Medi's own live (TikTok / YouTube talk stream), not a political event
  if (/\bvance\b/i.test(t) && !/\btrump\b/i.test(t)) return "vance";
  if (/\btrump\b/i.test(t) || e.kind === "trump") return "trump";
  if (e.kind === "white-house" || /white house|press (briefing|secretary)|leavitt/i.test(t)) return "white-house";
  return "other";
}

export const PERFORMER_NAME: Record<Performer, string> = { trump: "President Trump", vance: "Vice President JD Vance", "white-house": "The White House", medi: "Medi", other: "" };
const PERFORMER_SHORT: Record<Performer, string> = { trump: "Trump", vance: "JD Vance", "white-house": "White House", medi: "Medi", other: "" };

/** The thumbnail's state word: "FLORIDA". Trump rallies only (that is what the template shows); null when the state can't be read. */
export function thumbState(e: Pick<StreamEvent, "title" | "location" | "kind">): string | null {
  if (performerOf(e) !== "trump" || !isRally(e)) return null;
  const p = placeOf(e);
  return p?.state ? p.state.toUpperCase() : null;
}

/** What the event is, without the who: "Rally", "Press Conference", "Town Hall", "Speech", or the cleaned title. */
function eventKindWord(e: Pick<StreamEvent, "title">): { word: string | null; fallback: string } {
  const t = e.title;
  let word: string | null = null;
  if (isRally(e)) word = "Rally";
  else if (/press conference|gaggle/i.test(t)) word = "Press Conference";
  else if (/press briefing|briefing/i.test(t)) word = "Press Briefing";
  else if (/town hall/i.test(t)) word = "Town Hall";
  else if (/address|speech|remarks|speaks/i.test(t)) word = "Speech";
  const fallback = t
    .replace(/\s*featuring (President|Vice President)\s+(Trump|Vance)\s*/i, "")
    .replace(/^(President |Vice President )?(Trump|Vance)[:\s—-]*/i, "")
    .replace(/\s*\((replaces|moved|was)[^)]*\)\s*/i, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
  return { word, fallback };
}

/** The YouTube live title + description — overrides from the row win, otherwise generated. */
export function streamPackage(e: StreamEvent, signoff: string): { title: string; description: string } {
  const who = performerOf(e);
  const place = placeLabel(placeOf(e));
  const { word, fallback } = eventKindWord(e);
  const short = PERFORMER_SHORT[who];
  let what: string;
  if (word && short) what = place ? `${short} ${word} in ${place}` : `${short} ${word}`;
  else if (short) what = `${short}: ${fallback}`;
  else what = fallback;
  // Title format (Medi, 2026-10-25): "LIVE 3 PM ET | Trump Rally in Port Huron, Michigan - Sun 10/25"
  const s = Date.parse(e.starts_at);
  const title = e.stream_title?.trim() || `LIVE${e.all_day ? "" : ` ${shortTimeET(s)} ET`} | ${what} - ${shortDateET(s)}`;

  const when = e.notes?.match(/\b\d{1,2}(?::\d{2})?\s*[AP]M\s*ET\b/i)?.[0] ?? (e.all_day ? null : `${timeET(Date.parse(e.starts_at))} ET`);
  const name = PERFORMER_NAME[who] || "This";
  const lead = isRally(e)
    ? `${name} is live${place ? ` in ${place}` : ""} — watch the rally with me. I'm reacting live and reading the chat.`
    : `${name}${place ? ` in ${place}` : ""} — watch it with me. I'm reacting live and reading the chat.`;
  const facts = [e.location, when ? `Scheduled for ${when}` : null].filter(Boolean).join(" · ");
  const scheduleLine = `Every Trump rally and White House event this week, with my lives: ${SCHEDULE_LINK}`;
  const description = e.stream_description?.trim() || [lead, facts, scheduleLine, signoff.trim()].filter(Boolean).join("\n\n");
  return { title, description };
}

/** Public, human label for the schedule page: "Trump rally — Perry, Georgia" / "JD Vance rally — Topeka, Kansas" / cleaned title. */
export function publicLabel(e: StreamEvent): { headline: string; sub: string | null } {
  const who = performerOf(e);
  if (who === "medi") return { headline: e.title, sub: e.notes ?? null };
  const place = placeLabel(placeOf(e));
  const { word, fallback } = eventKindWord(e);
  const short = PERFORMER_SHORT[who];
  const headline = word && short ? `${short} ${word.toLowerCase()}${place ? ` — ${place}` : ""}` : short ? `${short}: ${fallback}` : fallback;
  const sub = /midterm/i.test(e.title) ? "Midterm rally" : null;
  return { headline, sub };
}

/** Normalised title for matching a YouTube stream to an event: emoji, "LIVE:" prefix and punctuation stripped. */
export function normTitle(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}️]/gu, " ")
    .replace(/^\s*live\s*[:\-—]\s*/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}
