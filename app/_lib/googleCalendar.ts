/* Read-only Google Calendar fetch. Uses a short-lived OAuth access token
   (calendar.readonly) to list every calendar the account can access — including
   calendars shared in from another account — and pull events for a window
   around now, mapped into the app's CalendarEvents shape. Nothing is persisted;
   results live in memory for the session. */

import type { CalendarEvents } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");
const isoLocal = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

type GCalListResponse = { items?: { id: string; selected?: boolean; primary?: boolean }[] };
type GCalEventsResponse = {
  items?: { summary?: string; status?: string; start?: { dateTime?: string; date?: string } }[];
};

/**
 * Fetch events from all accessible calendars.
 * @param token Google OAuth access token with calendar.readonly.
 * @param monthsBack/monthsFwd window around today to fetch (default -1 / +2).
 */
export async function fetchGoogleCalendarEvents(
  token: string,
  monthsBack = 1,
  monthsFwd = 2,
): Promise<CalendarEvents> {
  const headers = { Authorization: `Bearer ${token}` };

  const listRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", { headers });
  if (listRes.status === 401) throw new Error("Google session expired — reconnect to refresh.");
  if (!listRes.ok) throw new Error(`Couldn't list calendars (${listRes.status}).`);
  const listData = (await listRes.json()) as GCalListResponse;
  const calendars = (listData.items || []).filter((c) => c.selected !== false);

  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1).toISOString();
  const timeMax = new Date(now.getFullYear(), now.getMonth() + monthsFwd, 1).toISOString();

  const out: CalendarEvents = {};
  for (const cal of calendars) {
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cal.id)}/events` +
      `?singleEvents=true&orderBy=startTime&maxResults=250` +
      `&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`;
    const evRes = await fetch(url, { headers });
    if (!evRes.ok) continue; // skip a calendar we can't read rather than failing all
    const evData = (await evRes.json()) as GCalEventsResponse;
    for (const ev of evData.items || []) {
      if (ev.status === "cancelled") continue;
      const dt = ev.start?.dateTime;
      const d = ev.start?.date;
      let date: string;
      let time = "";
      if (dt) {
        const js = new Date(dt);
        date = isoLocal(js);
        time = `${pad(js.getHours())}:${pad(js.getMinutes())}`;
      } else if (d) {
        date = d; // all-day: already YYYY-MM-DD
      } else {
        continue;
      }
      (out[date] ||= []).push({ title: ev.summary || "(no title)", time, src: "google" });
    }
  }

  // Sort each day by time (all-day/no-time last).
  for (const key of Object.keys(out)) {
    out[key]!.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }
  return out;
}
