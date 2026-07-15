"use client";

/* App shell — sidebar (desktop, via media query) / bottom-nav (phone), top
   bar with theme toggle, and view switching. The original prototype
   also had a manual Phone/Desktop frame toggle for reviewing both layouts in
   a fixed-size card — that was dev-only chrome (see the source README), so
   it's dropped here in favor of real responsive breakpoints in dashboard.css.

   Global search across tasks/notes/goals is deferred to roadmap Phase 5 — the
   original implementation lives in git history if you need it back. */

import { useEffect, useRef, useState } from "react";
import { Icons, type IconName } from "./Icons";
import { ListView } from "./ListView";
import { NotesView } from "./NotesView";
import { CalendarView } from "./CalendarView";
import { GoalsView } from "./GoalsView";
import { SEED_DATA } from "../_lib/data";
import { useLocalState } from "../_lib/storage";
import type { Task, Note, View } from "../_lib/types";

function formatTodayLabel(d: Date) {
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const month = d.toLocaleDateString("en-US", { month: "short" });
  const day = String(d.getDate()).padStart(2, "0");
  return `${weekday} · ${month} ${day}, ${d.getFullYear()}`;
}

const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: "list", label: "List", icon: "List" },
  { id: "notes", label: "Notes", icon: "Notes" },
  { id: "calendar", label: "Calendar", icon: "Calendar" },
  { id: "goals", label: "Goals", icon: "Goal" },
];

function BrandMini({ big, onDark }: { big?: boolean; onDark?: boolean }) {
  return (
    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: big ? 24 : 17, textTransform: "uppercase", letterSpacing: "0.03em", color: onDark ? "#fff" : "var(--text)" }}>
      {SEED_DATA.user.name}
    </span>
  );
}

export function DashApp() {
  const [theme, setTheme] = useLocalState<"dark" | "light">("theme", "light");
  const [view, setView] = useState<View>("list");
  const [tasks, setTasks] = useLocalState<Task[]>("tasks", SEED_DATA.tasks);
  const [notes, setNotes] = useLocalState<Note[]>("notes", SEED_DATA.notes);

  const [todayLabel, setTodayLabel] = useState("");
  useEffect(() => { setTodayLabel(formatTodayLabel(new Date())); }, []);

  // Header scroll-hide/reveal: the header slides up out of view on scroll-down
  // and eases back in on scroll-up. Content scrolls inside `.content` (the app
  // shell is viewport-bounded), so we listen there rather than on window.
  const contentRef = useRef<HTMLDivElement>(null);
  const topbarRef = useRef<HTMLDivElement>(null);
  const lastY = useRef(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [topbarH, setTopbarH] = useState(0);

  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;
    const measure = () => setTopbarH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = el.scrollTop;
      if (y > lastY.current && y > 40) setHeaderHidden(true);
      else if (y < lastY.current) setHeaderHidden(false);
      lastY.current = y <= 0 ? 0 : y;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [view]);

  // Reveal the header whenever the view changes (each view scrolls from top).
  useEffect(() => { setHeaderHidden(false); lastY.current = 0; }, [view]);

  return (
    <div className="dash" data-theme={theme}>
      <div className="app" id="appFrame">
        {/* Sidebar (desktop) */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <BrandMini big onDark />
          </div>
          <nav className="sidebar-nav">
            {NAV.map((n) => {
              const C = Icons[n.icon];
              return (
                <button key={n.id} type="button" className={"nav-item" + (view === n.id ? " active" : "")} onClick={() => setView(n.id)}>
                  <C size={20} />{n.label}
                </button>
              );
            })}
          </nav>
          <div className="sidebar-foot">
            <div className="avatar">{SEED_DATA.user.initials}</div>
            <div className="who">
              <div className="n">{SEED_DATA.user.name}</div>
              <div className="r">{SEED_DATA.user.role}</div>
            </div>
            <button className="icon-btn" aria-label="Settings" type="button"><Icons.Gear size={18} /></button>
          </div>
        </aside>

        {/* Main */}
        <div className="main">
          <div className="topbar" ref={topbarRef} style={{ marginTop: headerHidden ? -topbarH : 0 }}>
            <div className="brand-mini"><BrandMini /></div>
            <span className="date">{todayLabel}</span>
            <div className="theme-toggle">
              <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} aria-label="Light theme" type="button"><Icons.Sun size={15} /></button>
              <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} aria-label="Dark theme" type="button"><Icons.Moon size={15} /></button>
            </div>
          </div>

          <div className="content" ref={contentRef}>
            {view === "list" && <ListView tasks={tasks} setTasks={setTasks} quote={SEED_DATA.quote} reminders={SEED_DATA.reminders} />}
            {view === "notes" && <NotesView notes={notes} setNotes={setNotes} />}
            {view === "calendar" && <CalendarView events={SEED_DATA.events} />}
            {view === "goals" && <GoalsView />}
          </div>

          {/* Bottom nav (phone) */}
          <nav className="bottom-nav">
            {NAV.map((n) => {
              const C = Icons[n.icon];
              return (
                <button key={n.id} type="button" className={"bnav-item" + (view === n.id ? " active" : "")} onClick={() => setView(n.id)}>
                  <C size={22} />{n.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
