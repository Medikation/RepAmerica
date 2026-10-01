// Server-only. Reads Medi's Google Calendars (medi@ and team@repamerica.com) for /admin/today.
// Auth is a Google service account the calendars are shared with ("See all event details"); its JSON key lives in
// the GOOGLE_SERVICE_ACCOUNT_JSON env var (Vercel). The JWT-bearer exchange is done by hand (RS256 via node:crypto)
// so the site carries no Google SDK. Read-only scope — nothing here can change a calendar.
import { createSign } from "node:crypto";

export const PT = "America/Los_Angeles";
export const CALENDARS: { id: string; label: string }[] = [
  { id: "medi@repamerica.com", label: "medi@" },
  { id: "team@repamerica.com", label: "team@" },
];
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

type ServiceAccount = { client_email: string; private_key: string };

type GEvent = {
  id: string;
  iCalUID?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  eventType?: string;
  transparency?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
  organizer?: { email?: string; displayName?: string; self?: boolean };
  attendees?: { email?: string; displayName?: string; self?: boolean; organizer?: boolean; responseStatus?: string }[];
  conferenceData?: { entryPoints?: { entryPointType?: string; uri?: string }[] };
};

export type CalEvent = {
  key: string; // stable id for React keys
  title: string;
  allDay: boolean;
  startsAt: number; // epoch ms
  endsAt: number; // epoch ms (all-day: start of the day after the last day)
  calendars: string[]; // labels of the calendars it sits on ("medi@", "team@")
  response: "accepted" | "declined" | "tentative" | "needsAction" | null; // Medi's own reply, when he's an attendee
  organizer: string | null;
  location: string | null;
  joinUrl: string | null;
  otherJoinUrls: string[]; // distinct meeting links that disagree with joinUrl (forwarded invites get fresh Meet rooms)
  htmlLink: string | null;
  attendeeCount: number;
  free: boolean; // "transparency: transparent" (shows as available)
};

export type CalendarResult = { events: CalEvent[]; errors: { calendar: string; message: string }[]; configured: boolean };

function loadServiceAccount(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const j = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!j.client_email || !j.private_key) return null;
    // A key pasted through a dashboard sometimes arrives with escaped newlines.
    return { client_email: j.client_email, private_key: String(j.private_key).replace(/\\n/g, "\n") };
  } catch {
    return null;
  }
}

const b64url = (s: string) => Buffer.from(s).toString("base64url");

let tokenCache: { token: string; expiresAt: number } | null = null;

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.expiresAt > now + 60) return tokenCache.token;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const signature = signer.sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${header}.${claims}.${signature}` }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(body.error_description ?? body.error ?? `token exchange failed (${res.status})`);
  tokenCache = { token: body.access_token, expiresAt: now + (body.expires_in ?? 3600) };
  return body.access_token;
}

// Meeting links as people actually paste them — with or without a scheme ("Link: meet.google.com/abc-defg-hij").
const MEETING_SRC = "(?:https?:\\/\\/)?(?:[\\w.-]*zoom\\.us\\/[jw]\\/\\S+|meet\\.google\\.com\\/[a-z]{3}-[a-z]{4}-[a-z]{3}\\S*|teams\\.microsoft\\.com\\/l\\/meetup-join\\/\\S+|[\\w.-]*webex\\.com\\/\\S+|streamyard\\.com\\/\\S+|riverside\\.fm\\/\\S+)";
const MEETING_RE = new RegExp(MEETING_SRC, "gi");
const isMeetingLink = (s: string) => new RegExp(`^\\s*${MEETING_SRC}\\s*$`, "i").test(s);
const cleanUrl = (u: string) => { const t = u.replace(/[)>\].,;'"]+$/g, "").replace(/\/+$/, ""); return /^https?:\/\//i.test(t) ? t : `https://${t}`; };

/** Meeting links in a copy of an event, most authoritative first. */
function meetingLinks(e: GEvent): string[] {
  const out: string[] = [];
  for (const ep of e.conferenceData?.entryPoints ?? []) if (ep.entryPointType === "video" && ep.uri) out.push(cleanUrl(ep.uri));
  if (e.hangoutLink) out.push(cleanUrl(e.hangoutLink));
  for (const text of [e.location ?? "", e.description ?? ""]) for (const m of text.match(MEETING_RE) ?? []) out.push(cleanUrl(m));
  return Array.from(new Set(out));
}

function normTitle(s: string) {
  return s.replace(/^\s*(?:(?:updated|new)\s+)?invitation:\s*/i, "").replace(/^\s*(?:fwd?|re):\s*/i, "").replace(/\s+@\s+.*$/, "").trim().toLowerCase();
}

function toEvent(e: GEvent, calLabel: string): CalEvent | null {
  if (e.status === "cancelled") return null;
  if (e.eventType === "workingLocation" || e.eventType === "birthday") return null;
  const allDay = !!e.start?.date;
  const startsAt = allDay ? Date.parse(`${e.start!.date}T00:00:00-07:00`) : Date.parse(e.start?.dateTime ?? "");
  const endsAt = allDay ? Date.parse(`${e.end?.date ?? e.start!.date}T00:00:00-07:00`) : Date.parse(e.end?.dateTime ?? e.start?.dateTime ?? "");
  if (!Number.isFinite(startsAt)) return null;
  const self = e.attendees?.find((a) => a.self);
  const response = (self?.responseStatus as CalEvent["response"]) ?? null;
  const links = meetingLinks(e);
  return {
    key: `${calLabel}:${e.id}`,
    title: e.summary?.trim() || "(untitled)",
    allDay,
    startsAt,
    endsAt: Number.isFinite(endsAt) ? endsAt : startsAt,
    calendars: [calLabel],
    response,
    organizer: e.organizer?.displayName || e.organizer?.email || null,
    location: e.location && !isMeetingLink(e.location) ? e.location : null,
    joinUrl: links[0] ?? null,
    otherJoinUrls: links.slice(1),
    htmlLink: e.htmlLink ?? null,
    attendeeCount: e.attendees?.length ?? 0,
    free: e.transparency === "transparent",
  };
}

/** Same meeting on both calendars (invited directly and via the team@ forward) → one row. Match on iCalUID, else on time + title. */
function merge(copies: { ev: CalEvent; raw: GEvent; votes: Map<string, number> }[]): CalEvent[] {
  const groups = new Map<string, typeof copies>();
  for (const c of copies) {
    const k = c.raw.iCalUID && !/^_/.test(c.raw.id) ? `uid:${c.raw.iCalUID}` : `t:${c.ev.startsAt}|${c.ev.endsAt}|${normTitle(c.ev.title)}`;
    const k2 = `t:${c.ev.startsAt}|${c.ev.endsAt}|${normTitle(c.ev.title)}`;
    const existing = groups.get(k) ?? groups.get(k2);
    if (existing) existing.push(c);
    else groups.set(k, [c]);
    if (!groups.has(k2)) groups.set(k2, groups.get(k)!);
  }
  const seen = new Set<object>();
  const out: CalEvent[] = [];
  for (const g of groups.values()) {
    if (seen.has(g)) continue;
    seen.add(g);
    // Prefer medi@'s copy (it carries his own reply); then count which meeting link the copies agree on.
    const sorted = [...g].sort((a, b) => (a.ev.calendars[0] === "medi@" ? -1 : 0) - (b.ev.calendars[0] === "medi@" ? -1 : 0));
    const base = { ...sorted[0].ev };
    base.calendars = Array.from(new Set(g.map((c) => c.ev.calendars[0])));
    base.response = sorted.find((c) => c.ev.response)?.ev.response ?? null;
    base.title = sorted.map((c) => c.ev.title).sort((a, b) => a.length - b.length)[0].replace(/^\s*(?:(?:updated|new)\s+)?invitation:\s*/i, "");
    const votes = new Map<string, number>();
    for (const c of g) for (const [u, n] of c.votes) votes.set(u, (votes.get(u) ?? 0) + n);
    const ranked = Array.from(votes.entries()).sort((a, b) => b[1] - a[1]).map(([u]) => u);
    base.joinUrl = ranked[0] ?? null;
    base.otherJoinUrls = ranked.slice(1);
    base.key = sorted[0].ev.key;
    out.push(base);
  }
  return out.sort((a, b) => a.startsAt - b.startsAt || a.title.localeCompare(b.title));
}

/** Events on all configured calendars between two instants (ms). Never throws: errors come back per calendar. */
export async function fetchCalendarEvents(timeMin: number, timeMax: number): Promise<CalendarResult> {
  const sa = loadServiceAccount();
  if (!sa) return { events: [], errors: [], configured: false };
  let token: string;
  try {
    token = await accessToken(sa);
  } catch (err) {
    return { events: [], errors: [{ calendar: "google", message: err instanceof Error ? err.message : String(err) }], configured: true };
  }
  const errors: CalendarResult["errors"] = [];
  const copies: { ev: CalEvent; raw: GEvent; votes: Map<string, number> }[] = [];
  await Promise.all(
    CALENDARS.map(async (cal) => {
      try {
        const items: GEvent[] = [];
        let pageToken: string | undefined;
        do {
          const qs = new URLSearchParams({ singleEvents: "true", orderBy: "startTime", timeMin: new Date(timeMin).toISOString(), timeMax: new Date(timeMax).toISOString(), maxResults: "250", timeZone: PT });
          if (pageToken) qs.set("pageToken", pageToken);
          const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events?${qs}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" });
          const body = (await res.json().catch(() => ({}))) as { items?: GEvent[]; nextPageToken?: string; error?: { message?: string } };
          if (!res.ok) throw new Error(body.error?.message ?? `HTTP ${res.status}`);
          items.push(...(body.items ?? []));
          pageToken = body.nextPageToken;
        } while (pageToken);
        for (const raw of items) {
          const ev = toEvent(raw, cal.label);
          if (!ev) continue;
          const votes = new Map<string, number>();
          const links = meetingLinks(raw);
          // The conference field of a forwarded invite is a fresh auto-generated room; a link that also appears in the
          // description (or on the other calendar's copy) is the one the organizer actually sent.
          links.forEach((u) => votes.set(u, (votes.get(u) ?? 0) + 1));
          for (const m of (raw.description ?? "").match(MEETING_RE) ?? []) { const u = cleanUrl(m); votes.set(u, (votes.get(u) ?? 0) + 1); }
          copies.push({ ev, raw, votes });
        }
      } catch (err) {
        errors.push({ calendar: cal.label, message: err instanceof Error ? err.message : String(err) });
      }
    }),
  );
  return { events: merge(copies), errors, configured: true };
}

/* ---------- time helpers (the site runs in UTC on Vercel; everything shown is Pacific) ---------- */

function tzOffsetMs(at: number, tz: string): number {
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const p = Object.fromEntries(f.formatToParts(new Date(at)).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - Math.floor(at / 1000) * 1000;
}

/** Midnight of a YYYY-MM-DD day in `tz`, as epoch ms. */
export function zonedDayStart(dateKey: string, tz = PT): number {
  const [y, m, d] = dateKey.split("-").map(Number);
  const naive = Date.UTC(y, m - 1, d, 0, 0, 0);
  const first = naive - tzOffsetMs(naive, tz);
  return naive - tzOffsetMs(first, tz);
}

/** YYYY-MM-DD of an instant in `tz`. */
export const dayKey = (ms: number, tz = PT) => new Date(ms).toLocaleDateString("en-CA", { timeZone: tz });

/** YYYY-MM-DD plus n days (calendar arithmetic, DST-safe). */
export function addDays(dateKey: string, n: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n, 12)).toISOString().slice(0, 10);
}
