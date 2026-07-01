import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#1e293b",
        muted: "#64748b",
        border: "#e2e8f0",
        card: {
          DEFAULT: "#f8fafc",
          hover: "#f1f5f9",
        },
        primary: {
          DEFAULT: "#0891b2",
          hover: "#06b6d4",
        },
        accent: {
          DEFAULT: "#9333ea",
          hover: "#a855f7",
        },
        "user-bubble": "#0891b2",
        "assistant-bubble": "#f8fafc",
        "input-bg": "#f8fafc",
        "input-border": "#cbd5e1",
        "input-focus": "#0891b2",
        sidebar: {
          DEFAULT: "#f8fafc",
          hover: "#f1f5f9",
        },
        // Agent-themed tokens (unified palette)
        agent: {
          primary: "#0891b2",
          "primary-hover": "#06b6d4",
          "primary-light": "#cffafe",
          "primary-muted": "#0891b2",
        },
        // Pipeline status indicators
        pipeline: {
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
          info: "#0891b2",
          pending: "#94a3b8",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
