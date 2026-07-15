# Project Aries

A personal productivity dashboard — numbered task list, notes, calendar, and goals — built as an installable Progressive Web App with Next.js.

This repo was extracted from the Tradeevio monorepo so Aries can live and ship on its own. The build roadmap (the phased plan and Gantt) stays on the main Tradeevio site.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000. Data persists to `localStorage` under the `aries:` prefix — there is no backend yet (that's roadmap Phase 2).

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run typecheck` — TypeScript, no emit

## Structure

```
app/
  layout.tsx          root layout: fonts, PWA metadata, SW registration
  page.tsx            the dashboard (app root)
  fonts.ts            Barlow / Barlow Condensed (next/font)
  globals.css         page reset + brand font-var mapping
  dashboard.css       all dashboard styling, scoped under .dash
  _components/        DashApp + List/Notes/Calendar/Goals views, Icons, RichText
  _lib/               types, seed data, localStorage state hook
  _components/PWARegister.tsx   registers the service worker (prod only)
public/
  manifest.webmanifest
  sw.js               minimal service worker (app-shell cache)
  icons/              192, 512, maskable 512, apple-touch 180
```

## PWA status

The groundwork is in place and the app is installable:

- Web manifest with name, colors, display `standalone`, and icons
- Icon set (regular + maskable + apple-touch)
- Theme-color, viewport, and Apple web-app metadata in the root layout
- A minimal service worker (`public/sw.js`) registered in production only

**What's deliberately left for later** (roadmap Phase 1 "PWA install + offline" / Phase 2 "sync"): the service worker does app-shell caching only. It does not yet fully cache the dashboard for guaranteed offline use or handle data sync. When you get there, either extend `sw.js` with real precaching or swap in [Serwist](https://serwist.pages.dev/) / Workbox. Registration is gated to `NODE_ENV === "production"` so it won't interfere with dev hot-reload.

## Notes

- The app is marked `noindex` — it's personal, not public.
- Icons are simple generated placeholders; replace with final brand art when ready.
