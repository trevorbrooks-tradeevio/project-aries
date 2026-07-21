import type { Metadata, Viewport } from "next";
import { barlow, barlowCondensed } from "./fonts";
import { PWARegister } from "./_components/PWARegister";
import "./globals.css";
import "./theme.css";

export const metadata: Metadata = {
  title: "Aries — Personal Dashboard",
  description:
    "Personal productivity dashboard — tasks, notes, calendar, and goals.",
  applicationName: "Aries",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aries",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  // Personal app — keep it out of search indexes.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  // Default to the light shell; DashApp keeps this <meta> in sync with the
  // user's in-app theme toggle so the mobile status bar always matches.
  themeColor: "#f7f3ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
