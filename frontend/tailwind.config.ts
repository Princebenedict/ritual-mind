import type {Config} from "tailwindcss";

/**
 * Ritual Mind design tokens. Light premium theme. Warm off white canvas, pure white
 * cards with soft warm shadows, thin hairline borders, near black editorial text, and a
 * single restrained muted teal accent. Semantic colors are deep and muted so they pass
 * WCAG AA as text and data on white. Token names are stable, so changing a value here
 * retints the entire product.
 */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {base: "#F5F3EF", raised: "#FFFFFF", sunken: "#EFEDE7"},
        surface: {DEFAULT: "#FBFAF8", strong: "#FFFFFF"},
        card: "#FFFFFF",
        line: {DEFAULT: "rgba(0,0,0,0.06)", bright: "rgba(0,0,0,0.12)"},
        ink: {DEFAULT: "#1A1A1A", muted: "#6B6B6B", dim: "#757575"},
        brand: "#256E60",
        good: "#1E7A5A",
        bad: "#B23B2E",
        info: "#2F6DA6",
        agent: "#6A57A0",
        data: "#2C7E8C",
        gold: "#8A6D22",
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
