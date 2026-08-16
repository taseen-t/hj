import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Green scale built around the brand mark's #aacc76 (kept as 400).
        // 600 is the primary action colour and clears 4.5:1 with white text.
        brand: {
          50: "#f4faec",
          100: "#e6f3d4",
          200: "#d2e9b2",
          300: "#bbdc8d",
          400: "#aacc76",
          500: "#7ba845",
          600: "#547f2b",
          700: "#446724",
          800: "#37521e",
          900: "#2e441b",
          950: "#16240c",
        },
      },
      fontFamily: {
        sans: ["var(--font-open-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16,24,40,.1), 0 1px 2px rgba(16,24,40,.06)",
        lift: "0 10px 30px -12px rgba(22,36,12,.25)",
      },
    },
  },
  plugins: [],
};

export default config;
