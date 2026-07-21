/// <reference lib="webworker" />

/*
 * Serwist service-worker source. At build time, `@serwist/next` bundles this
 * file to `public/sw.js` and injects `self.__SW_MANIFEST` — the precache list
 * of the build's hashed assets (JS/CSS/app shell). That gives true offline
 * capability: the shell is cached at install, not just after a first visit.
 *
 * `defaultCache` provides sensible runtime-caching rules (Next data, static
 * assets, images, fonts, google-fonts). Dashboard data still comes from
 * localStorage (instant, offline) + Firestore (needs network to sync).
 */

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  // Serve the cached app shell for navigations that miss the network, so the
  // installed PWA opens offline. Auth/API-ish paths are excluded.
  fallbacks: {
    entries: [
      {
        url: "/",
        matcher: ({ request }) => request.destination === "document",
      },
    ],
  },
});

serwist.addEventListeners();
