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

export function CalendarView({ events: baseEvents, tasks = [] }: { events: CalendarEvents; tasks?: Task[] }) {
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

  const [connected, setConnected] = useState(true);
  const [mode, setMode] = useState<"month" | "week" | "agenda">("month");
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const todayIso = new Date().toISOString().slice(0, 10);

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

  // agenda: flatten events for the month, sorted
  const agenda = Object.entries(events)
    .filter(([k]) => k.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}`))
    .sort(([a], [b]) => a.localeCompare(b));

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

      {!connected ? (
        <div className="cal-empty">
          <div className="ce-title">No calendars connected</div>
          <div className="ce-sub">Connect your accounts to see Google and Outlook events side by side in one unified month view. Events are read-only.</div>
          <div className="ce-btns">
            <button className="btn btn-red" onClick={() => setConnected(true)} type="button"><Icons.Plus size={15} />Connect Google</button>
            <button className="btn btn-red" onClick={() => setConnected(true)} type="button"><Icons.Plus size={15} />Connect Work</button>
          </div>
        </div>
      ) : (
        <>
          <div className="cal-toolbar">
            <div className="cal-nav">
              <button onClick={() => move(-1)} aria-label="Previous month" type="button"><Icons.ChevL size={16} /></button>
              <button onClick={() => move(1)} aria-label="Next month" type="button"><Icons.ChevR size={16} /></button>
            </div>
            <div className="cal-month">{MONTHS[cursor.m]} {cursor.y}</div>
            <div className="seg" style={{ borderColor: "var(--border-strong)" }}>
              {(["month", "week", "agenda"] as const).map((mo) => (
                <button key={mo} type="button" className={mode === mo ? "on" : ""} style={mode !== mo ? { color: "var(--text-3)" } : undefined} onClick={() => setMode(mo)}>{mo}</button>
              ))}
            </div>
            <div className="legend">
              <span className="li"><span className="sw google" />Google</span>
              <span className="li"><span className="sw outlook" />Work</span>
              <span className="li"><span className="sw task" />Tasks</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setConnected(false)} type="button">Manage</button>
            </div>
          </div>

          {mode === "agenda" ? (
            <div className="tasklist">
              {agenda.length === 0 && <div className="list-empty">No events this month.</div>}
              {agenda.map(([date, evs]) =>
                evs.map((e, i) => (
                  <div key={date + i} className="task-row" style={{ gridTemplateColumns: "auto 1fr auto", cursor: "default" }}>
                    <div className="t-date-cell" style={{ display: "block", minWidth: 92 }}>{new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                    <div className="t-title">{e.title}</div>
                    <span className="chip"><span className="dot" style={{ background: e.src === "google" ? "var(--accent)" : e.src === "outlook" ? "#2f6fd0" : "#2ecc71" }} />{e.time || (e.src === "task" ? "Task" : "")}</span>
                  </div>
                ))
              )}
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
      )}
    </>
  );
}
