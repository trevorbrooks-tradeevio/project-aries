"use client";

/* App shell — sidebar (desktop, via media query) / bottom-nav (phone), top
   bar with theme toggle, and view switching. The original prototype
   also had a manual Phone/Desktop frame toggle for reviewing both layouts in
   a fixed-size card — that was dev-only chrome (see the source README), so
   it's dropped here in favor of real responsive breakpoints in dashboard.css.

   Global search across tasks/notes/goals is deferred to roadmap Phase 5 — the
   original implementation lives in git history if you need it back. */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Icons, type IconName } from "./Icons";
import { ListView } from "./ListView";
import { NotesView } from "./NotesView";
import { CalendarView } from "./CalendarView";
import { GoalsView } from "./GoalsView";
import { SEED_DATA } from "../_lib/data";
import { useCloudState as useLocalState } from "../_lib/cloudState";
import { useAuth } from "../_lib/auth";
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

function BacklogIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />
    </svg>
  );
}

function RoadmapIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="19" r="2" />
      <circle cx="18" cy="5" r="2" />
      <path d="M8 19h6a4 4 0 0 0 0-8H10a4 4 0 0 1 0-8h6" />
    </svg>
  );
}

function StyleGuideIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Palette */}
      <path d="M12 22a10 10 0 1 1 10-10c0 2.21-1.79 3.5-4 3.5h-1.5a2.5 2.5 0 0 0-2 4c.5.67.06 2.5-2.5 2.5Z" />
      <circle cx="7.5" cy="11.5" r="1" />
      <circle cx="11" cy="7.5" r="1" />
      <circle cx="15.5" cy="9.5" r="1" />
    </svg>
  );
}

function BrandMini({ big, onSidebar }: { big?: boolean; onSidebar?: boolean }) {
  // The sidebar surface flips between light (light theme) and dark (dark
  // theme), so brand text on it uses --sidebar-fg rather than a fixed color.
  return (
    <span style={{ fontFamily: "var(--font-heading)", fontWeight: 800, fontSize: big ? 24 : 17, textTransform: "uppercase", letterSpacing: "0.03em", color: onSidebar ? "var(--sidebar-fg, #fff)" : "var(--text)" }}>
      {SEED_DATA.user.name}
    </span>
  );
}

export function DashApp() {
  const [theme, setTheme] = useLocalState<"dark" | "light">("theme", "light");
  const { signOut } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useLocalState<boolean>("sidebarHidden", false);
  const [view, setView] = useState<View>("list");

  // Open the view named in the URL hash (e.g. "/#calendar"), used by the
  // sub-page mobile nav to jump back to a specific dashboard view.
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "list" || h === "backlog" || h === "notes" || h === "calendar" || h === "goals") {
        setView(h);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
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
    <div className={"dash" + (sidebarHidden ? " sidebar-hidden" : "")} data-theme={theme}>
      <div className="app" id="appFrame">
        {/* Sidebar (desktop) */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <BrandMini big onSidebar />
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
            <button type="button" className={"nav-item" + (view === "backlog" ? " active" : "")} onClick={() => setView("backlog")}>
              <BacklogIcon size={20} />Backlog
            </button>
            <Link href="/roadmap" className="nav-item">
              <RoadmapIcon size={20} />Roadmap
            </Link>
            <Link href="/releases" className="nav-item">
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                <path d="m2 17 10 5 10-5" />
                <path d="m2 12 10 5 10-5" />
              </svg>
              Releases
            </Link>
            <Link href="/style-guide" className="nav-item">
              <StyleGuideIcon size={20} />
              Style Guide
            </Link>
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
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarHidden((h) => !h)}
              aria-label={sidebarHidden ? "Show menu" : "Hide menu"}
              title={sidebarHidden ? "Show menu" : "Hide menu"}
              type="button"
            >
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <line x1="9" y1="4" x2="9" y2="20" />
              </svg>
            </button>
            <div className="brand-mini"><BrandMini /></div>
            <span className="date">{todayLabel}</span>
            <div className="topbar-actions">
              <div className="theme-toggle">
                <button className={theme === "light" ? "on" : ""} onClick={() => setTheme("light")} aria-label="Light theme" type="button"><Icons.Sun size={15} /></button>
                <button className={theme === "dark" ? "on" : ""} onClick={() => setTheme("dark")} aria-label="Dark theme" type="button"><Icons.Moon size={15} /></button>
              </div>
              <button className="icon-btn signout" aria-label="Sign out" title="Sign out" type="button" onClick={() => void signOut()}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="content" ref={contentRef}>
            {view === "list" && <ListView tasks={tasks} setTasks={setTasks} quote={SEED_DATA.quote} reminders={SEED_DATA.reminders} />}
            {view === "backlog" && <ListView tasks={tasks} setTasks={setTasks} mode="backlog" />}
            {view === "notes" && <NotesView notes={notes} setNotes={setNotes} />}
            {view === "calendar" && <CalendarView events={SEED_DATA.events} tasks={tasks} />}
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
            <div className="bnav-more">
              <button
                type="button"
                className={"bnav-item" + (moreOpen ? " active" : "")}
                aria-expanded={moreOpen}
                aria-label="More"
                onClick={() => setMoreOpen((o) => !o)}
              >
                <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
                More
              </button>
              {moreOpen && (
                <>
                  <div className="bnav-more-backdrop" onClick={() => setMoreOpen(false)} />
                  <div className="bnav-more-menu" role="menu">
                    <button
                      type="button"
                      className={"bnav-more-item" + (view === "backlog" ? " active" : "")}
                      role="menuitem"
                      onClick={() => { setView("backlog"); setMoreOpen(false); }}
                    >
                      <BacklogIcon size={18} />Backlog
                    </button>
                    <Link href="/roadmap" className="bnav-more-item" role="menuitem" onClick={() => setMoreOpen(false)}>
                      <RoadmapIcon size={18} />Roadmap
                    </Link>
                    <Link href="/releases" className="bnav-more-item" role="menuitem" onClick={() => setMoreOpen(false)}>
                      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                        <path d="m2 17 10 5 10-5" />
                        <path d="m2 12 10 5 10-5" />
                      </svg>
                      Releases
                    </Link>
                    <Link href="/style-guide" className="bnav-more-item" role="menuitem" onClick={() => setMoreOpen(false)}>
                      <StyleGuideIcon size={18} />Style Guide
                    </Link>
                  </div>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
