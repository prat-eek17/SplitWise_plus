import type { Config } from "tailwindcss";

// ---------------------------------------------------------------------------
// SplitWise+ Design Tokens
// Ink-black base, single violet brand accent, and a strict money-semantic
// pair (emerald = owed to you, rose = you owe). Everything else stays quiet
// so the balance numbers and the "settlement flow" bars carry the drama.
// ---------------------------------------------------------------------------
const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0A0B10",
          soft: "#0E1016",
        },
        surface: {
          DEFAULT: "#14161D",
          raised: "#1B1E27",
          border: "#262A35",
        },
        ink: {
          DEFAULT: "#F3F4F7",
          muted: "#8B90A0",
          faint: "#565A68",
        },
        brand: {
          DEFAULT: "#7C6CFF",
          soft: "#7C6CFF1A",
          strong: "#9284FF",
        },
        owed: {
          DEFAULT: "#34D399",
          soft: "#34D3991A",
        },
        owe: {
          DEFAULT: "#FB7185",
          soft: "#FB71851A",
        },
        pending: {
          DEFAULT: "#FBBF24",
          soft: "#FBBF241A",
        },
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        xl2: "1.75rem",
        xl3: "2.25rem",
      },
      boxShadow: {
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 20px 40px -20px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(124,108,255,0.25), 0 8px 30px -8px rgba(124,108,255,0.45)",
      },
      backdropBlur: {
        glass: "20px",
      },
      keyframes: {
        "flow-bar": {
          "0%": { backgroundPosition: "0% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
      },
      animation: {
        "flow-bar": "flow-bar 2.4s linear infinite",
        "pop-in": "pop-in 0.28s cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
