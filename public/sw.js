/*
 * Aries service worker — intentionally minimal.
 *
 * This is the PWA groundwork, not the finished offline story. It satisfies the
 * installability requirement (a fetch handler must exist) and gives the app a
 * fast "app-shell" cache. Full offline support for the dashboard data is
 * roadmap Phase 1 ("PWA install + offline") / Phase 2 (sync) — wire real
 * precaching and a data strategy there, or drop in Serwist/Workbox.
 *
 * Strategy today:
 *   - Navigations: network-first, fall back to cache (so the app still opens
 *     when offline once it has been visited).
 *   - Same-origin GET assets: stale-while-revalidate.
 *   - Everything else: passthrough.
 */

const VERSION = "aries-v1";
const APP_SHELL = `${VERSION}-shell`;

self.addEventListener("install", (event) => {
  // Activate this worker as soon as it's finished installing.
  self.skipWaiting();
  event.waitUntil(caches.open(APP_SHELL));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop caches from previous versions.
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // App navigations: network-first with cache fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(APP_SHELL);
          cache.put(request, fresh.clone());
          return fresh;
        } catch {
          const cached = await caches.match(request);
          return cached || caches.match("/");
        }
      })()
    );
    return;
  }

  // Static same-origin assets: stale-while-revalidate.
  event.respondWith(
    (async () => {
      const cache = await caches.open(APP_SHELL);
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
