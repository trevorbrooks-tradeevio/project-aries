"use client";

import Link from "next/link";
import { AuthGate } from "../_components/AuthGate";

/* ───────────────────────────────────────────────────────────
   ARIES — Releases / Deploy log
   Light-themed page, gated by Google sign-in (Firebase Auth).
   Route: /releases

   Hand-maintained changelog keyed to git history + Vercel deploys.
   Add a new entry at the TOP of RELEASES each time we ship.
─────────────────────────────────────────────────────────── */

type Release = {
  version: string;
  date: string; // YYYY-MM-DD
  commit: string; // short hash
  title: string;
  current?: boolean;
  changes: string[];
};

const RELEASES: Release[] = [
  {
    version: "v0.3.0",
    date: "2026-07-19",
    commit: "c794259",
    title: "Phase 2 — Cloud sync + accounts",
    current: true,
    changes: [
      "Google sign-in gate (Firebase Auth) replaces the client-side password gate on the dashboard and roadmap",
      "Cloud sync: tasks, notes, and theme now persist to Firestore per user, so data follows you across devices",
      "localStorage kept as an offline cache, so the app still works with no connection",
      "Owner-only Firestore security rules — each user can only read/write their own data",
      "Sign-out button added to the dashboard top bar",
    ],
  },
  {
    version: "v0.2.0",
    date: "2026-07-15",
    commit: "ad793a4",
    title: "Roadmap page + brand tokens",
    changes: [
      "Added the /roadmap route with the phased build Gantt",
      "Added a Roadmap link to the dashboard sidebar",
      "Reintroduced Tailwind for the roadmap's brand color tokens",
    ],
  },
  {
    version: "v0.1.1",
    date: "2026-07-15",
    commit: "40fae0c",
    title: "Temporary password gate",
    changes: [
      "Added a client-side password gate as a short-term privacy screen (since replaced by Google sign-in in v0.3.0)",
    ],
  },
  {
    version: "v0.1.0",
    date: "2026-07-15",
    commit: "7dbeb01",
    title: "Initial release",
    changes: [
      "Standalone Aries dashboard extracted from the Tradeevio monorepo",
      "List, Notes, Calendar, and Goals views",
      "Installable PWA scaffold (manifest, icons, service worker)",
    ],
  },
];

function ReleasesPage() {
  return (
    <main className="min-h-screen bg-cream text-charcoal">
      <div className="mx-auto max-w-[900px] px-6 py-16">
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
          Releases
        </h1>
        <p className="mb-10 max-w-2xl font-[family-name:var(--font-body)] text-[15px] font-light leading-relaxed text-charcoal/60">
          Deploy history for the personal dashboard: what shipped, when, and the
          commit behind it. Newest first.
        </p>

        <div className="space-y-4">
          {RELEASES.map((r) => (
            <div
              key={r.commit}
              className="border border-charcoal/10 bg-white p-6 shadow-sm md:p-8"
            >
              <div className="mb-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                <span className="font-[family-name:var(--font-heading)] text-[22px] font-extrabold tracking-[-0.01em] text-charcoal">
                  {r.version}
                </span>
                {r.current && (
                  <span className="rounded-[3px] bg-signal-red px-2 py-0.5 font-[family-name:var(--font-heading)] text-[10px] font-bold uppercase tracking-[0.12em] text-white">
                    Current
                  </span>
                )}
                <span className="font-[family-name:var(--font-body)] text-[13px] font-light text-charcoal/50">
                  {r.date}
                </span>
                <span className="font-mono text-[12px] text-charcoal/40">
                  {r.commit}
                </span>
              </div>
              <div className="mb-3 font-[family-name:var(--font-heading)] text-[15px] font-bold uppercase tracking-[0.04em] text-charcoal/80">
                {r.title}
              </div>
              <ul className="space-y-1.5">
                {r.changes.map((c, i) => (
                  <li
                    key={i}
                    className="flex gap-2 font-[family-name:var(--font-body)] text-[14px] font-light leading-relaxed text-charcoal/70"
                  >
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-signal-red/70" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 font-[family-name:var(--font-body)] text-[12px] font-light text-charcoal/40">
          Note: this is a hand-maintained changelog, updated with each deploy —
          not a live feed from Vercel.
        </p>
      </div>
    </main>
  );
}

/* Route wraps the releases page in the same Google sign-in gate as the rest
   of the app. */
export default function ReleasesRoute() {
  return (
    <AuthGate>
      <ReleasesPage />
    </AuthGate>
  );
}
