"use client";

/* Shared mobile bottom nav for the sub-pages (roadmap, releases). The four
   primary tabs link back to the dashboard and open the matching view via the
   URL hash (DashApp reads `#view` on load / hashchange). "More" opens the
   Roadmap/Releases menu, same as the dashboard's bottom nav. Hidden on desktop
   via CSS. */

import Link from "next/link";
import { useState } from "react";
import { Icons } from "./Icons";

const TABS = [
  { hash: "list", label: "List", icon: "List" as const },
  { hash: "notes", label: "Notes", icon: "Notes" as const },
  { hash: "calendar", label: "Calendar", icon: "Calendar" as const },
  { hash: "goals", label: "Goals", icon: "Goal" as const },
];

export function MobileNav() {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="mobilenav">
      {TABS.map((t) => {
        const C = Icons[t.icon];
        return (
          <Link key={t.hash} href={`/#${t.hash}`}>
            <C size={22} />
            {t.label}
          </Link>
        );
      })}
      <div className="mobilenav-more">
        <button
          type="button"
          className="mn-btn"
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
            <div className="mobilenav-backdrop" onClick={() => setMoreOpen(false)} />
            <div className="mobilenav-menu" role="menu">
              <Link href="/roadmap" role="menuitem" onClick={() => setMoreOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="6" cy="19" r="2" />
                  <circle cx="18" cy="5" r="2" />
                  <path d="M12 19h4a2 2 0 0 0 2-2V7M12 5H8a2 2 0 0 0-2 2v10" />
                </svg>
                Roadmap
              </Link>
              <Link href="/releases" role="menuitem" onClick={() => setMoreOpen(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 2 2 7l10 5 10-5-10-5Z" />
                  <path d="m2 17 10 5 10-5" />
                  <path d="m2 12 10 5 10-5" />
                </svg>
                Releases
              </Link>
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
