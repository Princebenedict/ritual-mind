import type {Config} from "tailwindcss";

/**
 * Ritual Mind design tokens. Two themes, one set of token names. Every color reads from a
 * CSS variable holding RGB channels, so "rgb(var(--x) / <alpha-value>)" lets Tailwind apply
 * opacity modifiers (bg-brand/[0.08]) and lets the whole product flip between the dark
 * (default) and light palettes just by toggling data-theme on <html>. Values live in
 * app/globals.css. Semantic colors are tuned to pass WCAG AA on each theme's surfaces.
 */
const withAlpha = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {base: withAlpha("--bg-base"), raised: withAlpha("--bg-raised"), sunken: withAlpha("--bg-sunken")},
        surface: {DEFAULT: withAlpha("--surface"), strong: withAlpha("--surface-strong")},
        card: withAlpha("--card"),
        line: {DEFAULT: "var(--line)", bright: "var(--line-bright)"},
        ink: {DEFAULT: withAlpha("--ink"), muted: withAlpha("--ink-muted"), dim: withAlpha("--ink-dim")},
        brand: withAlpha("--brand"),
        good: withAlpha("--good"),
        bad: withAlpha("--bad"),
        info: withAlpha("--info"),
        agent: withAlpha("--agent"),
        data: withAlpha("--data"),
        gold: withAlpha("--gold"),
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontWeight: {
        normal: "400",
        bold: "700",
      },
      maxWidth: {
        content: "1280px",
        wide: "1536px",
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        // Soft, warm, layered shadows for depth on the cream canvas.
        soft: "0 1px 2px rgba(40,35,30,0.04), 0 10px 30px -14px rgba(40,35,30,0.12)",
        "soft-lg": "0 4px 10px rgba(40,35,30,0.05), 0 28px 56px -24px rgba(40,35,30,0.18)",
        // Aliases so any surface still referencing the previous names gets the soft look.
        glass: "0 1px 2px rgba(40,35,30,0.04), 0 10px 30px -14px rgba(40,35,30,0.12)",
        "glass-lg": "0 4px 10px rgba(40,35,30,0.05), 0 28px 56px -24px rgba(40,35,30,0.18)",
        "glow-brand": "0 0 50px -18px rgba(37,110,96,0.25)",
        sheen: "inset 0 1px 0 0 rgba(255,255,255,0.6)",
      },
      keyframes: {
        "fade-up": {
          "0%": {opacity: "0", transform: "translateY(10px)"},
          "100%": {opacity: "1", transform: "translateY(0)"},
        },
        shimmer: {
          "0%": {backgroundPosition: "-200% 0"},
          "100%": {backgroundPosition: "200% 0"},
        },
        "pulse-ring": {
          "0%": {transform: "scale(0.9)", opacity: "0.5"},
          "70%": {transform: "scale(1.7)", opacity: "0"},
          "100%": {transform: "scale(1.7)", opacity: "0"},
        },
        float: {
          "0%, 100%": {transform: "translateY(0)"},
          "50%": {transform: "translateY(-8px)"},
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1)",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-ring": "pulse-ring 2.8s cubic-bezier(0.16,1,0.3,1) infinite",
        float: "float 7s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
