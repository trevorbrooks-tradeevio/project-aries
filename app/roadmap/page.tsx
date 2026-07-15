"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PasswordGate } from "../_components/PasswordGate";

/* ───────────────────────────────────────────────────────────
   ARIES — Personal Dashboard Roadmap (Gantt)
   Light-themed, password-gated page within the Tradeevio site.
   Route: /roadmap

   NOTE: The password check below runs in the browser and is a
   light privacy gate, not real security. For true protection,
   move auth server-side (see the build plan, Phase 2).
─────────────────────────────────────────────────────────── */

const PASSWORD = "trevorbrooks0322"; // first + last name + 0322, case-insensitive

const TOTAL_WEEKS = 14;

type Task = {
  label: string;
  start: number; // 1-based week
  span: number; // number of weeks
  color: string;
};

type Phase = {
  key: string;
  name: string;
  window: string;
  accent: string;
  tasks: Task[];
};

const PHASES: Phase[] = [
  {
    key: "p1",
    name: "Phase 1 — Usable core",
    window: "Weeks 1–3",
    accent: "#c0392b",
    tasks: [
      { label: "Design + brand setup", start: 1, span: 1, color: "#c0392b" },
      { label: "List view (numbered, drag + filters)", start: 1, span: 2, color: "#c0392b" },
      { label: "Notes + Quotes", start: 2, span: 1, color: "#c0392b" },
      { label: "PWA install + offline", start: 3, span: 1, color: "#c0392b" },
    ],
  },
  {
    key: "p2",
    name: "Phase 2 — Accounts + sync",
    window: "Weeks 4–6",
    accent: "#3E1E1E",
    tasks: [
      { label: "Supabase setup + schema", start: 4, span: 1, color: "#3E1E1E" },
      { label: "Login + 2FA (single-user lock)", start: 4, span: 2, color: "#3E1E1E" },
      { label: "Cloud sync across devices", start: 5, span: 2, color: "#3E1E1E" },
    ],
  },
  {
    key: "p3",
    name: "Phase 3 — Calendar integration",
    window: "Weeks 7–10",
    accent: "#96281b",
    tasks: [
      { label: "Google + Microsoft app registration", start: 7, span: 1, color: "#96281b" },
      { label: "Google OAuth + read events", start: 7, span: 2, color: "#96281b" },
      { label: "Outlook OAuth + read events", start: 8, span: 2, color: "#96281b" },
      { label: "Unified calendar view", start: 9, span: 2, color: "#96281b" },
    ],
  },
  {
    key: "p4",
    name: "Phase 4 — Budgeting tool",
    window: "Weeks 11–12",
    accent: "#5a2a2a",
    tasks: [
      { label: "Shared category schema (work + personal)", start: 11, span: 1, color: "#5a2a2a" },
      { label: "Income + expense entry", start: 11, span: 2, color: "#5a2a2a" },
      { label: "Work / Personal / Both views", start: 12, span: 1, color: "#5a2a2a" },
      { label: "Budget vs actual view", start: 12, span: 1, color: "#5a2a2a" },
      { label: "Summary dashboard", start: 12, span: 1, color: "#5a2a2a" },
    ],
  },
  {
    key: "p5",
    name: "Phase 5 — Global search",
    window: "Weeks 13–14",
    accent: "#2a1414",
    tasks: [
      { label: "Cross-entity search index (tasks, notes, goals)", start: 13, span: 1, color: "#2a1414" },
      { label: "Search-to-focus deep linking", start: 13, span: 1, color: "#2a1414" },
      { label: "Command palette + keyboard shortcut", start: 14, span: 1, color: "#2a1414" },
    ],
  },
];

function pct(n: number) {
  return `${(n / TOTAL_WEEKS) * 100}%`;
}

/* ─── Gantt ─────────────────────────────────────────────── */
function Gantt() {
  const weeks = useMemo(
    () => Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1),
    []
  );

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        {/* Week header */}
        <div className="flex items-end">
          <div className="w-56 shrink-0" />
          <div className="relative flex-1">
            <div className="grid" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 1fr))` }}>
              {weeks.map((w) => (
                <div
                  key={w}
                  className="border-l border-charcoal/10 px-1 pb-2 text-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal/50"
                >
                  W{w}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phases */}
        {PHASES.map((phase) => (
          <div key={phase.key} className="mb-2">
            {/* Phase header row */}
            <div className="flex items-center border-t border-charcoal/10 bg-charcoal/[0.03]">
              <div className="w-56 shrink-0 px-3 py-2">
                <div
                  className="font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.04em]"
                  style={{ color: phase.accent }}
                >
                  {phase.name}
                </div>
                <div className="font-[family-name:var(--font-body)] text-[11px] font-light text-charcoal/50">
                  {phase.window}
                </div>
              </div>
              <div className="flex-1" />
            </div>

            {/* Task rows */}
            {phase.tasks.map((t, i) => (
              <div key={i} className="flex items-center">
                <div className="w-56 shrink-0 px-3 py-2 font-[family-name:var(--font-body)] text-[13px] font-light leading-tight text-charcoal/80">
                  {t.label}
                </div>
                <div className="relative flex-1 py-2">
                  {/* gridlines */}
                  <div className="pointer-events-none absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${TOTAL_WEEKS}, minmax(0, 1fr))` }}>
                    {weeks.map((w) => (
                      <div key={w} className="border-l border-charcoal/[0.06]" />
                    ))}
                  </div>
                  {/* bar */}
                  <div
                    className="relative h-6 rounded-[3px] shadow-sm"
                    style={{
                      marginLeft: pct(t.start - 1),
                      width: pct(t.span),
                      backgroundColor: t.color,
                    }}
                  >
                    <span className="flex h-full items-center px-2 font-[family-name:var(--font-body)] text-[11px] font-medium text-white/90 whitespace-nowrap overflow-hidden">
                      {t.span}w
                    </span>
                    {/* completion milestone */}
                    <span
                      className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 rounded-[1px]"
                      style={{ right: "-6px", backgroundColor: "#39d353" }}
                      title="Phase milestone"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-charcoal/10 pt-4">
          {PHASES.map((p) => (
            <div key={p.key} className="flex items-center gap-2">
              <span
                className="h-3 w-4 rounded-[2px]"
                style={{ backgroundColor: p.accent }}
              />
              <span className="font-[family-name:var(--font-body)] text-[12px] font-light text-charcoal/70">
                {p.name}
              </span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rotate-45 rounded-[1px]" style={{ backgroundColor: "#39d353" }} />
            <span className="font-[family-name:var(--font-body)] text-[12px] font-light text-charcoal/70">
              Milestone
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Password gate ─────────────────────────────────────── */
function Gate({ onUnlock }: { onUnlock: () => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim().toLowerCase() === PASSWORD) {
      onUnlock();
    } else {
      setError(true);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-charcoal px-6">
      <form onSubmit={submit} className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <span className="flex h-12 w-12 items-center justify-center border border-white/15 text-signal-red">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="1" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
        </div>
        <label className="mb-2 block text-center font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">
          Enter password
        </label>
        <input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          autoFocus
          aria-label="Password"
          className="mb-3 w-full border border-white/15 bg-off-black px-3 py-3 text-center font-[family-name:var(--font-body)] text-[15px] tracking-[0.2em] text-white outline-none transition-colors focus:border-signal-red"
        />
        {error && (
          <p className="mb-3 text-center font-[family-name:var(--font-body)] text-[12px] text-signal-red">
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          className="w-full bg-signal-red px-4 py-3 font-[family-name:var(--font-heading)] text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-colors hover:bg-signal-red-dark"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────── */
function RoadmapPage() {
  // TEMP: gate disabled so the roadmap shows without a password.
  // Set this back to useState(false) to re-enable the password screen.
  const [unlocked, setUnlocked] = useState(true);

  if (!unlocked) {
    return <Gate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <main className="min-h-screen bg-cream text-charcoal">
      {(
        <div className="mx-auto max-w-[1100px] px-6 py-16">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.16em] text-charcoal/50 transition-colors hover:text-signal-red"
          >
            ← Back to dashboard
          </Link>
          <div className="mb-2 font-[family-name:var(--font-heading)] text-[11px] font-bold uppercase tracking-[0.2em] text-signal-red">
            / Aries — Personal Dashboard
          </div>
          <h1 className="mb-3 font-[family-name:var(--font-heading)] text-[40px] font-extrabold uppercase leading-[0.95] tracking-[-0.02em] text-charcoal md:text-[56px]">
            Build Roadmap
          </h1>
          <p className="mb-10 max-w-2xl font-[family-name:var(--font-body)] text-[15px] font-light leading-relaxed text-charcoal/60">
            A phased plan for the personal dashboard: a numbered drag-and-drop
            task list, notes, editable goals, a unified Google and Outlook
            calendar, a budgeting tool, and global search, delivered as an
            installable app. Timeline is in weeks and is indicative, not fixed.
          </p>

          <div className="border border-charcoal/10 bg-white p-6 shadow-sm md:p-8">
            <Gantt />
          </div>

          <p className="mt-6 font-[family-name:var(--font-body)] text-[12px] font-light text-charcoal/40">
            Note: this page is protected by a browser-side password, which is a
            light privacy gate rather than real security.
          </p>
        </div>
      )}
    </main>
  );
}

/* Route wraps the roadmap in the same app-level password gate as the rest of
   the site (unlock persists across pages via localStorage). */
export default function RoadmapRoute() {
  return (
    <PasswordGate>
      <RoadmapPage />
    </PasswordGate>
  );
}
