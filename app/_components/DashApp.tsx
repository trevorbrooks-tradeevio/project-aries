"use client";

/* App shell — sidebar (desktop, via media query) / bottom-nav (phone), top
   bar with theme toggle, and view switching. The original prototype
   also had a manual Phone/Desktop frame toggle for reviewing both layouts in
   a fixed-size card — that was dev-only chrome (see the source README), so
   it's dropped here in favor of real responsive breakpoints in dashboard.css.

   Global search across tasks/notes/goals is deferred to roadmap Phase 5 — the
   original implementation lives in git history if you need it back. */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Icons, type IconName } from "./Icons";
import { ListView } from "./ListView";
import { NotesView } from "./NotesView";
import { CalendarView } from "./CalendarView";
import { GoalsView } from "./GoalsView";
import { BudgetView } from "./BudgetView";
import { AccountView } from "./AccountView";
import { SEED_DATA } from "../_lib/data";
import { useCloudState as useLocalState } from "../_lib/cloudState";
import { DEFAULT_PROFILE, initialsFrom } from "../_lib/profile";
import { useAuth } from "../_lib/auth";
import { fetchGoogleCalendarEvents } from "../_lib/googleCalendar";
import type { Task, Note, Profile, View, CalendarEvents } from "../_lib/types";


const NAV: { id: View; label: string; icon: IconName }[] = [
  { id: "list", label: "Main", icon: "List" },
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

function BudgetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function DietIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 20a6 6 0 0 0 6-6c0-4-3-8-6-8s-6 4-6 8a6 6 0 0 0 6 6Z" />
      <path d="M12 6c0-2 1-3.5 3-4" />
    </svg>
  );
}

function Placeholder({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb: string }) {
  return (
    <>
      <div className="view-head">
        <span className="eyebrow"><span className="slash">/</span>{eyebrow}</span>
        <h1 className="view-title">{title}</h1>
      </div>
      <div className="placeholder-card">
        <div className="placeholder-badge">Coming soon</div>
        <p className="placeholder-blurb">{blurb}</p>
      </div>
    </>
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
  const { signOut, connectCalendar, calendarToken } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useLocalState<boolean>("sidebarHidden", false);
  const [view, setView] = useState<View>("list");

  // Open the view named in the URL hash (e.g. "/#calendar"), used by the
  // sub-page mobile nav to jump back to a specific dashboard view.
  useEffect(() => {
    const applyHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h === "list" || h === "backlog" || h === "notes" || h === "calendar" || h === "goals" || h === "budget" || h === "diet") {
        setView(h);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, []);
  const [tasks, setTasks] = useLocalState<Task[]>("tasks", SEED_DATA.tasks);
  const [notes, setNotes] = useLocalState<Note[]>("notes", SEED_DATA.notes);
  const [quote, setQuote] = useLocalState("quote", SEED_DATA.quote);
  const [reminders, setReminders] = useLocalState<string[]>("reminders", SEED_DATA.reminders);
  const [profile, setProfile] = useLocalState<Profile>("profile", DEFAULT_PROFILE);
  const [timezone, setTimezone] = useLocalState<string>("timezone", "");
  const [budgetSheetUrl, setBudgetSheetUrl] = useLocalState<string>("budgetSheetUrl", "");
  const [budgetTab, setBudgetTab] = useLocalState<string>("budgetTab", "July 2026");

  // Google Calendar (read-only, in-memory for the session — never persisted).
  const [googleEvents, setGoogleEvents] = useState<CalendarEvents>({});
  const [gcalStatus, setGcalStatus] = useState<"idle" | "loading" | "connected" | "error">("idle");
  const [gcalError, setGcalError] = useState("");

  const loadGoogle = useCallback(async (token: string) => {
    setGcalStatus("loading"); setGcalError("");
    try {
      setGoogleEvents(await fetchGoogleCalendarEvents(token));
      setGcalStatus("connected");
    } catch (e) {
      setGcalStatus("error");
      setGcalError(e instanceof Error ? e.message : "Failed to load calendar.");
    }
  }, []);

  // Fetch whenever we have a token (popup success or redirect return).
  useEffect(() => { if (calendarToken) void loadGoogle(calendarToken); }, [calendarToken, loadGoogle]);

  const connectGoogle = async () => {
    setGcalStatus("loading"); setGcalError("");
    try {
      await connectCalendar(); // token lands in context → effect above loads events
    } catch (e) {
      setGcalStatus("error");
      setGcalError(e instanceof Error ? e.message : "Couldn't connect to Google.");
    }
  };
  const refreshGoogle = () => { if (calendarToken) void loadGoogle(calendarToken); else void connectGoogle(); };

  // Keep the PWA/browser status-bar color in sync with the chosen theme so the
  // installed app's chrome matches the shell (light shell vs. dark shell).
  useEffect(() => {
    const shell = theme === "dark" ? "#0a0a0a" : "#f7f3ec";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", shell);
    // Match the page background behind the app so the iOS safe areas (status
    // bar + home indicator) never show a mismatched strip.
    document.body.style.backgroundColor = shell;
  }, [theme]);

  // Pin the app shell to the device's REAL visible height. On iOS standalone
  // PWAs, CSS 100dvh / -webkit-fill-available disagree with the actual viewport
  // (causing a bottom gap or overshoot); window.visualViewport.height is the
  // reliable number. Written to --app-h, which .dash consumes.
  useEffect(() => {
    const setAppHeight = () => {
      const h = window.visualViewport?.height ?? window.innerHeight;
      if (h) document.documentElement.style.setProperty("--app-h", `${Math.round(h)}px`);
    };
    setAppHeight();
    const vv = window.visualViewport;
    vv?.addEventListener("resize", setAppHeight);
    window.addEventListener("resize", setAppHeight);
    window.addEventListener("orientationchange", setAppHeight);
    return () => {
      vv?.removeEventListener("resize", setAppHeight);
      window.removeEventListener("resize", setAppHeight);
      window.removeEventListener("orientationchange", setAppHeight);
    };
  }, []);

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
    <div className={"dash" + (sidebarHidden ? " sidebar-hidden" : "") + (moreOpen ? " menu-open" : "")} data-theme={theme}>
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
            <button type="button" className={"nav-item" + (view === "budget" ? " active" : "")} onClick={() => setView("budget")}>
              <BudgetIcon size={20} />Budget
            </button>
            <button type="button" className={"nav-item" + (view === "diet" ? " active" : "")} onClick={() => setView("diet")}>
              <DietIcon size={20} />Diet
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
            <button
              type="button"
              className={"sidebar-acct" + (view === "account" ? " active" : "")}
              onClick={() => setView("account")}
              aria-label="Open account settings"
            >
              <div className="avatar">
                {profile.avatar ? <img className="avatar-img" src={profile.avatar} alt="" /> : initialsFrom(profile.name)}
              </div>
              <div className="who">
                <div className="n">{profile.name}</div>
                {profile.role && <div className="r">{profile.role}</div>}
              </div>
            </button>
            <button className={"icon-btn" + (view === "account" ? " active" : "")} aria-label="Account settings" type="button" onClick={() => setView("account")}><Icons.Gear size={18} /></button>
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
          </div>

          <div className="content" ref={contentRef}>
            {view === "list" && <ListView tasks={tasks} setTasks={setTasks} quote={quote} reminders={reminders} />}
            {view === "backlog" && <ListView tasks={tasks} setTasks={setTasks} mode="backlog" />}
            {view === "notes" && <NotesView notes={notes} setNotes={setNotes} />}
            {view === "calendar" && <CalendarView events={googleEvents} tasks={tasks} onConnectGoogle={connectGoogle} onRefreshGoogle={refreshGoogle} googleStatus={gcalStatus} googleError={gcalError} />}
            {view === "goals" && <GoalsView />}
            {view === "budget" && <BudgetView token={calendarToken} onConnectGoogle={connectGoogle} sheetUrl={budgetSheetUrl} setSheetUrl={setBudgetSheetUrl} tabName={budgetTab} setTabName={setBudgetTab} />}
            {view === "diet" && <Placeholder eyebrow="Health" title="Diet" blurb="Log meals, macros, and habits here. This section is a placeholder for now." />}
            {view === "account" && <AccountView profile={profile} setProfile={setProfile} quote={quote} setQuote={setQuote} reminders={reminders} setReminders={setReminders} timezone={timezone} setTimezone={setTimezone} theme={theme} setTheme={setTheme} onSignOut={() => void signOut()} />}
          </div>

        </div>
      </div>

      {/* Bottom nav (phone). Rendered as a direct child of .dash — OUTSIDE
          `.app` — so position:fixed (see dashboard.css) pins it to the true
          viewport bottom on iOS standalone, and the menu-open transform on
          `.app` never drags it off the bottom edge. */}
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
        </div>
      </nav>

      {/* Slide-in menu drawer (phone). Lives outside `.app` so the shell can
          scale back behind it: on open, the app recedes (see .menu-open) and
          the drawer pulls to the front from the right. Settings gear at the
          top, nav list in the middle, profile pinned to the bottom. */}
      <div className={"more-backdrop" + (moreOpen ? " show" : "")} onClick={() => setMoreOpen(false)} />
      <aside className={"more-drawer" + (moreOpen ? " open" : "")} role="dialog" aria-modal="true" aria-hidden={!moreOpen}>
        <div className="md-head">
          <span className="md-title">Menu</span>
          <div className="md-head-actions">
            <button className="md-icon" type="button" aria-label="Settings" onClick={() => { setView("account"); setMoreOpen(false); }}><Icons.Gear size={20} /></button>
            <button className="md-icon" type="button" aria-label="Close menu" onClick={() => setMoreOpen(false)}>
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        </div>
        <nav className="md-nav">
          <button type="button" className={"md-item" + (view === "backlog" ? " active" : "")} onClick={() => { setView("backlog"); setMoreOpen(false); }}><BacklogIcon size={20} />Backlog</button>
          <button type="button" className={"md-item" + (view === "budget" ? " active" : "")} onClick={() => { setView("budget"); setMoreOpen(false); }}><BudgetIcon size={20} />Budget</button>
          <button type="button" className={"md-item" + (view === "diet" ? " active" : "")} onClick={() => { setView("diet"); setMoreOpen(false); }}><DietIcon size={20} />Diet</button>
          <Link href="/roadmap" className="md-item" onClick={() => setMoreOpen(false)}><RoadmapIcon size={20} />Roadmap</Link>
          <Link href="/releases" className="md-item" onClick={() => setMoreOpen(false)}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2 2 7l10 5 10-5-10-5Z" />
              <path d="m2 17 10 5 10-5" />
              <path d="m2 12 10 5 10-5" />
            </svg>
            Releases
          </Link>
          <Link href="/style-guide" className="md-item" onClick={() => setMoreOpen(false)}><StyleGuideIcon size={20} />Style Guide</Link>
        </nav>
        <button className={"md-profile" + (view === "account" ? " active" : "")} type="button" onClick={() => { setView("account"); setMoreOpen(false); }}>
          <div className="avatar">
            {profile.avatar ? <img className="avatar-img" src={profile.avatar} alt="" /> : initialsFrom(profile.name)}
          </div>
          <div className="who">
            <div className="n">{profile.name}</div>
            {profile.role && <div className="r">{profile.role}</div>}
          </div>
          <span className="md-profile-gear"><Icons.Gear size={16} /></span>
        </button>
      </aside>
    </div>
  );
}
