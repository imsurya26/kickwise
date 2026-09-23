import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Google RGB brand palette
        "google-blue":   "#4285f4",
        "google-red":    "#ea4335",
        "google-yellow": "#fbbc04",
        "google-green":  "#34a853",
        // Surface tokens
        "kw-bg":         "var(--kw-bg)",
        "kw-surface":    "var(--kw-surface)",
        "kw-surface-2":  "var(--kw-surface-2)",
        "kw-border":     "var(--kw-border)",
        "kw-muted":      "var(--kw-muted)",
        "kw-text":       "var(--kw-text)",
        "kw-subtext":    "var(--kw-subtext)",
        "kw-accent":     "var(--kw-accent)",
      },
      fontFamily: {
        sans: ["'Faculty Glyphic'", "system-ui", "sans-serif"],
        heading: ["'Press Start 2P'", "cursive", "monospace"],
        swanky: ["'Press Start 2P'", "cursive", "monospace"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(66,133,244,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(66,133,244,0.05) 1px, transparent 1px)",
        "google-rgb":
          "linear-gradient(90deg, #4285f4 0%, #ea4335 30%, #fbbc04 60%, #34a853 100%)",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      boxShadow: {
        "google-sm": "0 1px 3px rgba(60,64,67,0.12), 0 1px 2px rgba(60,64,67,0.08)",
        "google-md": "0 4px 12px rgba(60,64,67,0.14), 0 2px 4px rgba(60,64,67,0.08)",
        "google-lg": "0 10px 30px rgba(60,64,67,0.18), 0 4px 8px rgba(60,64,67,0.10)",
        "blue-glow": "0 0 20px rgba(66,133,244,0.25), 0 4px 12px rgba(66,133,244,0.15)",
      },
      animation: {
        "spin-slow":        "spinSlow 4s linear infinite",
        "fade-in":          "fadeIn 0.5s ease-out",
        "slide-up":         "slideUp 0.4s ease-out",
        "rgb-shimmer":      "rgbShimmer 6s ease infinite",
        "pulse-blue":       "pulseBlue 2s ease-in-out infinite",
        "marquee":          "marquee var(--duration) linear infinite",
        "marquee-vertical": "marqueeVertical var(--duration) linear infinite",
        "aurora":           "aurora 60s linear infinite",
      },
      keyframes: {
        aurora: {
          from: {
            backgroundPosition: "50% 50%, 50% 50%",
          },
          to: {
            backgroundPosition: "350% 50%, 350% 50%",
          },
        },
        spinSlow: {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        rgbShimmer: {
          "0%":   { backgroundPosition: "0% 50%" },
          "50%":  { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        pulseBlue: {
          "0%, 100%": { boxShadow: "0 0 8px rgba(66,133,244,0.25)" },
          "50%":       { boxShadow: "0 0 24px rgba(66,133,244,0.55)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to:   { transform: "translateX(calc(-100% - var(--gap)))" },
        },
        marqueeVertical: {
          from: { transform: "translateY(0)" },
          to:   { transform: "translateY(calc(-100% - var(--gap)))" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
