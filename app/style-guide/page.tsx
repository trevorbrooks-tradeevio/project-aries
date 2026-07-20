"use client";

/* ───────────────────────────────────────────────────────────
   ARIES — Style Guide
   Living documentation of the Aries Design System (app/theme.css),
   organized by atomic design: Foundations → Atoms → Molecules →
   Organisms. Light beige page, gated by Google sign-in.
   Route: /style-guide
─────────────────────────────────────────────────────────── */

import Link from "next/link";
import { useState } from "react";
import { AuthGate } from "../_components/AuthGate";
import { MobileNav } from "../_components/MobileNav";
import "./styleguide.css";

const SURFACE_TOKENS = [
  { n: "bg", v: "#f7f3ec", token: "--aries-bg" },
  { n: "bg-2", v: "#f0eae0", token: "--aries-bg-2" },
  { n: "surface", v: "#ffffff", token: "--aries-surface" },
  { n: "surface-hover", v: "#faf6f0", token: "--aries-surface-hover" },
  { n: "sidebar", v: "#fbf9f4", token: "--aries-sidebar" },
];

const BRAND_TOKENS = [
  { n: "accent", v: "#c0392b", token: "--aries-accent" },
  { n: "accent-dark", v: "#96281b", token: "--aries-accent-dark" },
  { n: "accent-soft", v: "#f5ddd9", token: "--aries-accent-soft" },
  { n: "burgundy", v: "#3e1e1e", token: "--aries-burgundy" },
  { n: "success", v: "#2f9e58", token: "--aries-success" },
];

const INK_TOKENS = [
  { n: "ink", v: "#1c1917", token: "--aries-ink" },
  { n: "ink-2", v: "rgba(28,25,23,.62)", token: "--aries-ink-2" },
  { n: "ink-3", v: "rgba(28,25,23,.4)", token: "--aries-ink-3" },
];

const RADII = [
  { n: "sm · 8px", token: "--aries-radius-sm" },
  { n: "md · 12px", token: "--aries-radius-md" },
  { n: "lg · 16px", token: "--aries-radius-lg" },
  { n: "xl · 24px", token: "--aries-radius-xl" },
  { n: "pill", token: "--aries-radius-pill" },
];

const SHADOWS = [
  { n: "shadow-1", token: "--aries-shadow-1" },
  { n: "shadow-2", token: "--aries-shadow-2" },
  { n: "shadow-3", token: "--aries-shadow-3" },
];

const SPACES = [
  { n: "1 · 4px", w: 4 },
  { n: "2 · 8px", w: 8 },
  { n: "3 · 12px", w: 12 },
  { n: "4 · 16px", w: 16 },
  { n: "5 · 24px", w: 24 },
  { n: "6 · 32px", w: 32 },
  { n: "7 · 48px", w: 48 },
];

function GoogleG({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function Swatches({ items }: { items: { n: string; v: string; token: string }[] }) {
  return (
    <div className="swatches">
      {items.map((s) => (
        <div className="swatch" key={s.token}>
          <div className="chip" style={{ background: `var(${s.token})` }} />
          <div className="meta">
            <div className="n">{s.n}</div>
            <div className="v">{s.token}</div>
            <div className="v">{s.v}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StyleGuide() {
  const [toggleOn, setToggleOn] = useState(true);

  return (
    <div className="sg">
      <div className="wrap">
        <Link href="/" className="back">← Back to dashboard</Link>

        <div className="page-head">
          <h1>Aries Style Guide</h1>
          <p>
            The single source of truth for how Aries looks and feels. Warm beige
            surfaces, generous corner radii, and quiet shadows. Organized by
            atomic design — foundations feed atoms, atoms compose molecules,
            molecules assemble into organisms. All values live as tokens in{" "}
            <code>app/theme.css</code>; nothing downstream hardcodes a color or
            radius.
          </p>
        </div>

        {/* ═══ FOUNDATIONS ═══ */}
        <section>
          <p className="tier">Foundations</p>
          <h2>Design tokens</h2>
          <p className="desc">The raw values everything else is built from.</p>

          <div className="panel">
            <h3>Color — surfaces</h3>
            <Swatches items={SURFACE_TOKENS} />
          </div>
          <div className="panel">
            <h3>Color — brand</h3>
            <Swatches items={BRAND_TOKENS} />
          </div>
          <div className="panel">
            <h3>Color — ink</h3>
            <Swatches items={INK_TOKENS} />
          </div>

          <div className="panel">
            <h3>Typography</h3>
            <div className="type-sample">
              <span className="label">heading / 800</span>
              <span style={{ fontFamily: "var(--aries-font-heading)", fontWeight: 800, fontSize: 30, textTransform: "uppercase", letterSpacing: "0.03em" }}>Barlow Condensed</span>
            </div>
            <div className="type-sample">
              <span className="label">heading / 700</span>
              <span style={{ fontFamily: "var(--aries-font-heading)", fontWeight: 700, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.12em" }}>Section label · nav item</span>
            </div>
            <div className="type-sample">
              <span className="label">body / 600 · 15</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Buttons and emphasized copy use Barlow semibold.</span>
            </div>
            <div className="type-sample">
              <span className="label">body / 400 · 15</span>
              <span style={{ fontSize: 15 }}>Body copy is Barlow regular at 14–15px with relaxed line height.</span>
            </div>
            <div className="type-sample">
              <span className="label">caption · ink-3</span>
              <span style={{ fontSize: 12, color: "var(--aries-ink-3)" }}>Captions and footnotes sit at 12px in ink-3.</span>
            </div>
          </div>

          <div className="panel">
            <h3>Radius scale</h3>
            <div className="row">
              {RADII.map((r) => (
                <div className="demo-cell" key={r.token}>
                  <div className="radius-demo" style={{ borderRadius: `var(${r.token})` }} />
                  <span className="cap">{r.n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Elevation</h3>
            <div className="row">
              {SHADOWS.map((s) => (
                <div className="demo-cell" key={s.token}>
                  <div className="shadow-demo" style={{ boxShadow: `var(${s.token})` }} />
                  <span className="cap">{s.n}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Spacing — 4px base</h3>
            <div className="row" style={{ alignItems: "flex-end" }}>
              {SPACES.map((s) => (
                <div className="demo-cell" key={s.n}>
                  <div className="space-demo" style={{ width: s.w }} />
                  <span className="cap">{s.n}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ATOMS ═══ */}
        <section>
          <p className="tier">Atoms</p>
          <h2>Basic controls</h2>
          <p className="desc">The smallest reusable pieces — one token deep.</p>

          <div className="panel">
            <h3>Buttons</h3>
            <div className="row">
              <button type="button" className="btn btn-primary">Primary</button>
              <button type="button" className="btn btn-secondary">Secondary</button>
              <button type="button" className="btn btn-ghost">Ghost</button>
              <button type="button" className="btn btn-primary btn-pill">Pill</button>
              <button type="button" className="btn btn-primary" disabled>Disabled</button>
              <button type="button" className="btn btn-secondary"><GoogleG /> Continue with Google</button>
            </div>
          </div>

          <div className="panel">
            <h3>Inputs</h3>
            <div className="row">
              <input className="input" placeholder="Placeholder text" />
              <input className="input" defaultValue="Filled value" />
            </div>
          </div>

          <div className="panel">
            <h3>Tags · avatar · toggle</h3>
            <div className="row">
              <span className="tag tag-accent">Accent</span>
              <span className="tag tag-neutral">Neutral</span>
              <span className="tag tag-success">Success</span>
              <span className="avatar">TB</span>
              <button
                type="button"
                className={"toggle" + (toggleOn ? " on" : "")}
                aria-pressed={toggleOn}
                aria-label="Example toggle"
                onClick={() => setToggleOn((o) => !o)}
              >
                <span className="knob" />
              </button>
            </div>
          </div>
        </section>

        {/* ═══ MOLECULES ═══ */}
        <section>
          <p className="tier">Molecules</p>
          <h2>Composed patterns</h2>
          <p className="desc">Atoms grouped into small, purposeful units.</p>

          <div className="panel">
            <h3>Form field</h3>
            <div className="field">
              <label htmlFor="sg-email">Email address</label>
              <input id="sg-email" className="input" placeholder="you@example.com" />
              <span className="hint">We only use this to identify your workspace.</span>
            </div>
          </div>

          <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-head">
              <span className="t">Card header</span>
              <span className="tag tag-neutral">Meta</span>
            </div>
            <div style={{ padding: "20px 24px", fontSize: 14, color: "var(--aries-ink-2)" }}>
              Card body content sits on the surface token with lg radius and a hairline border.
            </div>
          </div>

          <div className="panel">
            <h3>Sidebar nav items</h3>
            <div className="nav-demo">
              <button type="button" className="ni active">List</button>
              <button type="button" className="ni">Notes</button>
              <button type="button" className="ni">Calendar</button>
            </div>
          </div>

          <div className="panel">
            <h3>List row</h3>
            <div className="list-row">
              <span className="dot" />
              <span className="txt">Review the July forecast before Thursday</span>
              <span className="tag tag-accent">Today</span>
            </div>
          </div>
        </section>

        {/* ═══ ORGANISMS ═══ */}
        <section>
          <p className="tier">Organisms</p>
          <h2>Full components</h2>
          <p className="desc">
            Molecules assembled into complete, shippable UI. The sign-in card
            below is the live pattern used on the login page.
          </p>

          <div className="panel" style={{ background: "var(--aries-bg)", display: "flex", justifyContent: "center", padding: 40 }}>
            <div className="signin-demo">
              <div className="hd">Sign in</div>
              <div className="bd">
                <p>Sign in to load your dashboard.</p>
                <button type="button" className="btn btn-secondary" style={{ width: "100%" }}>
                  <GoogleG /> Continue with Google
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
      <MobileNav />
    </div>
  );
}

export default function StyleGuidePage() {
  return (
    <AuthGate>
      <StyleGuide />
    </AuthGate>
  );
}
