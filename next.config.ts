import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const config: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint runs locally via `npm run lint`. Don't block production deploys on style.
    ignoreDuringBuilds: true,
  },
  // Stamped at build time so the app can show which build is actually running
  // (helps confirm whether the installed PWA picked up a new deploy).
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

// Serwist generates public/sw.js (Workbox precache + runtime caching) from
// app/sw.ts at build time. Disabled in dev so it doesn't fight hot reload —
// which is also why PWARegister only registers the SW in production.
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
});

export default withSerwist(config);
