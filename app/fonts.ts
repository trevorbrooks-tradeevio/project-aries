import { Barlow, Barlow_Condensed } from "next/font/google";

// Same families the Tradeevio site uses, so Aries stays on-brand as a
// standalone app. Exposed as CSS variables consumed by globals.css.
export const barlow = Barlow({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-barlow",
  display: "swap",
});

export const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
  display: "swap",
});
