"use client";

/* Calendar — unified month view (Google + Outlook), legend, month/week/agenda
   toggle, and a Connect empty state. Events are read-only; there's no real
   OAuth here yet (that's Phase 3 on the Aries roadmap) — Connect just flips
   a local boolean. */

import { useMemo, useState } from "react";
import { Icons } from "./Icons";
import type { CalendarEvents, Task } from "../_lib/types";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// "14:30" -> "2:30p", "11:00" -> "11a" (compact, Google-style).
function fmtTime(t: string) {
  if (!t) return "";
  const [hs, ms] = t.split(":");
  let h = Number(hs);
  const m = Number(ms);
  const ap = h >= 12 ? "p" : "a";
  h = h % 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h}${ap}` : `${h}:${String(m).padStart(2, "0")}${ap}`;
}

// Hour range shown in the week time-grid (7 AM – 8 PM).
const WEEK_HOURS = Array.from({ length: 20 - 7 + 1 }, (_, i) => 7 + i);
function fmtHour(h: number) {
  const ap = h >= 12 ? "PM" : "AM";
  let hh = h % 12;
  if (hh === 0) hh = 12;
  return `${hh} ${ap}`;
}

type Cell = { out: boolean; d: number };

type GoogleStatus = "idle" | "loading" | "connected" | "error";

export function CalendarView({
  events: baseEvents,
  tasks = [],
  onConnectGoogle,
  onRefreshGoogle,
  googleStatus = "idle",
  googleError = "",
}: {
  events: CalendarEvents;
  tasks?: Task[];
  onConnectGoogle?: () => void;
  onRefreshGoogle?: () => void;
  googleStatus?: GoogleStatus;
  googleError?: string;
}) {
  // Merge task-derived events (any non-archived task with a date) into the
  // calendar as a third source, "task" (rendered green).
  const events = useMemo<CalendarEvents>(() => {
    const map: CalendarEvents = {};
    for (const [k, v] of Object.entries(baseEvents)) map[k] = [...v];
    for (const t of tasks) {
      if (!t.date || t.archived) continue;
      (map[t.date] ||= []).push({ title: t.title, time: "", src: "task" });
    }
    // Sort each day by time (events with no time — e.g. tasks — sort last).
    for (const key of Object.keys(map)) {
      map[key]!.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
    }
    return map;
  }, [baseEvents, tasks]);

  const [mode, setMode] = useState<"month" | "week" | "agenda">("month");
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  // Agenda is a single-day view with its own cursor; arrows step one day.
  const [dayCursor, setDayCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const moveDay = (dir: 1 | -1) => setDayCursor((d) => { const nd = new Date(d); nd.setDate(d.getDate() + dir); return nd; });
  // Build from LOCAL date parts — toISOString() is UTC, which highlights
  // tomorrow in the evening for time zones behind UTC.
  const todayIso = isoDate(now.getFullYear(), now.getMonth(), now.getDate());
  const dayIso = isoDate(dayCursor.getFullYear(), dayCursor.getMonth(), dayCursor.getDate());
  const dayLabel = dayCursor.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const dayEvents = events[dayIso] || [];

  const first = new Date(cursor.y, cursor.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const daysPrev = new Date(cursor.y, cursor.m, 0).getDate();

  const cells: Cell[] = [];
  for (let i = 0; i < startDow; i++) cells.push({ out: true, d: daysPrev - startDow + 1 + i });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ out: false, d });
  while (cells.length % 7 !== 0) cells.push({ out: true, d: cells.length - (startDow + daysInMonth) + 1 });

  const evFor = (c: Cell) => (c.out ? [] : events[isoDate(cursor.y, cursor.m, c.d)] || []);
  const move = (dir: 1 | -1) => setCursor((c) => { let m = c.m + dir, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });

  // Week view anchors on today's day-of-month when viewing the current
  // month, otherwise the first week row of the displayed month.
  const isCurrentMonth = cursor.y === now.getFullYear() && cursor.m === now.getMonth();
  const anchorDay = isCurrentMonth ? now.getDate() : 1;
  const weekRowIndex = cells.findIndex((c) => !c.out && c.d === anchorDay);
  const weekStart = Math.floor(Math.max(weekRowIndex, 0) / 7) * 7;
  const weekCells = cells.slice(weekStart, weekStart + 7);

  return (
    <>
      <div className="view-head">
        <span className="eyebrow"><span className="slash">/</span>Schedule</span>
        <h1 className="view-title">Calendar</h1>
      </div>

      <>
          <div className="cal-toolbar">
            <div className="cal-nav">
              <button onClick={() => (mode === "agenda" ? moveDay(-1) : move(-1))} aria-label={mode === "agenda" ? "Previous day" : "Previous month"} type="button"><Icons.ChevL size={16} /></button>
              <button onClick={() => (mode === "agenda" ? moveDay(1) : move(1))} aria-label={mode === "agenda" ? "Next day" : "Next month"} type="button"><Icons.ChevR size={16} /></button>
            </div>
            <div className="cal-month">
              {mode === "agenda"
                ? <>{dayLabel}{dayIso === todayIso ? <span className="cal-today-tag"> · Today</span> : ""}</>
                : `${MONTHS[cursor.m]} ${cursor.y}`}
            </div>
            <div className="seg" style={{ borderColor: "var(--border-strong)" }}>
              {(["month", "week", "agenda"] as const).map((mo) => (
                <button key={mo} type="button" className={mode === mo ? "on" : ""} style={mode !== mo ? { color: "var(--text-3)" } : undefined} onClick={() => setMode(mo)}>{mo}</button>
              ))}
            </div>
            <div className="legend">
              <span className="li"><span className="sw google" />Google</span>
              <span className="li"><span className="sw task" />Tasks</span>
              {googleStatus === "connected" ? (
                <>
                  <span className="cal-gcal-ok">Google connected</span>
                  <button className="btn btn-ghost btn-sm" onClick={onRefreshGoogle} type="button">Refresh</button>
                </>
              ) : googleStatus === "loading" ? (
                <button className="btn btn-ghost btn-sm" disabled type="button">Connecting…</button>
              ) : (
                <button className="btn btn-red btn-sm" onClick={onConnectGoogle} type="button">
                  <Icons.Plus size={13} />{googleStatus === "error" ? "Reconnect Google" : "Connect Google"}
                </button>
              )}
              {googleStatus === "error" && <span className="cal-gcal-err">Couldn’t connect</span>}
            </div>
          </div>

          {googleStatus === "error" && (
            <div className="cal-gcal-banner error">{googleError || "Couldn’t connect to Google Calendar."}</div>
          )}
          {googleStatus === "connected" && Object.keys(baseEvents).length === 0 && (
            <div className="cal-gcal-banner info">Connected, but no Google events were found for this period. Make sure you signed in with the account your calendars are shared into.</div>
          )}

          {mode === "agenda" ? (
            <div className="tasklist">
              {dayEvents.length === 0 && <div className="list-empty">Nothing scheduled for this day.</div>}
              {dayEvents.map((e, i) => (
                <div key={i} className="task-row" style={{ gridTemplateColumns: "auto 1fr auto", cursor: "default" }}>
                  <div className="t-date-cell" style={{ display: "block", minWidth: 64 }}>{e.time ? fmtTime(e.time) : (e.src === "task" ? "Task" : "All day")}</div>
                  <div className="t-title">{e.title}</div>
                  <span className="chip"><span className="dot" style={{ background: e.src === "google" ? "var(--accent)" : e.src === "outlook" ? "#2f6fd0" : "#2ecc71" }} />{e.src === "google" ? "Google" : e.src === "outlook" ? "Work" : "Task"}</span>
                </div>
              ))}
            </div>
          ) : mode === "week" ? (
            <div className="cal-week">
              <div className="cw-head">
                <div className="cw-timecol-head" />
                {weekCells.map((c, i) => {
                  const isToday = !c.out && isoDate(cursor.y, cursor.m, c.d) === todayIso;
                  return (
                    <div key={i} className={"cw-dayhead" + (c.out ? " out" : "") + (isToday ? " today" : "")}>
                      {DOW[i]}<span>{c.d}</span>
                    </div>
                  );
                })}
              </div>
              <div className="cw-allday">
                <div className="cw-allday-label">all-day</div>
                {weekCells.map((c, i) => {
                  const evs = evFor(c).filter((e) => !e.time);
                  return (
                    <div key={i} className="cw-allday-cell">
                      {evs.map((e, j) => (
                        <div key={j} className={"cal-ev " + e.src} title={e.title}>{e.title}</div>
                      ))}
                    </div>
                  );
                })}
              </div>
              <div className="cw-scroll">
                {WEEK_HOURS.map((h) => (
                  <div key={h} className="cw-row">
                    <div className="cw-time">{fmtHour(h)}</div>
                    {weekCells.map((c, i) => {
                      const evs = evFor(c).filter((e) => e.time && Number(e.time.split(":")[0]) === h);
                      return (
                        <div key={i} className="cw-cell">
                          {evs.map((e, j) => (
                            <div key={j} className={"cal-ev " + e.src} title={`${fmtTime(e.time)} ${e.title}`.trim()}>
                              <span className="cal-ev-time">{fmtTime(e.time)}</span>{e.title}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="cal-grid">
              {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
              {cells.map((c, i) => {
                const evs = evFor(c);
                const isToday = !c.out && isoDate(cursor.y, cursor.m, c.d) === todayIso;
                const cap = 3;
                return (
                  <div key={i} className={"cal-cell" + (c.out ? " out" : "") + (isToday ? " today" : "")}>
                    <div className="dnum">{c.d}</div>
                    {evs.slice(0, cap).map((e, j) => (
                      <div key={j} className={"cal-ev " + e.src} title={`${fmtTime(e.time)} ${e.title}`.trim()}>
                        {e.time && <span className="cal-ev-time">{fmtTime(e.time)}</span>}{e.title}
                      </div>
                    ))}
                    {evs.length > cap && <div className="cal-more">+{evs.length - cap} more</div>}
                  </div>
                );
              })}
            </div>
          )}
        </>
    </>
  );
}
