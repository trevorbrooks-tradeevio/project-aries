import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Lint runs locally via `npm run lint`. Don't block production deploys on style.
    ignoreDuringBuilds: true,
  },
};

export default config;
