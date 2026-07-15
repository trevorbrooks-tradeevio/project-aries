/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Tradeevio brand tokens — needed by the roadmap page, which was pulled
      // from the main site as-is and styled with these color utilities.
      colors: {
        charcoal: "#111111",
        "off-black": "#1a1a1a",
        "signal-red": "#c0392b",
        "signal-red-dark": "#96281b",
        cream: "#f4efe8",
      },
    },
  },
  plugins: [],
};
