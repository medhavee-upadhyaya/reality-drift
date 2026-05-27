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
      // ── Stitch color tokens — CSS variable driven (supports opacity modifiers) ──
      colors: {
        "background":                  "rgb(var(--color-background)          / <alpha-value>)",
        "surface":                     "rgb(var(--color-surface)             / <alpha-value>)",
        "surface-container-lowest":    "rgb(var(--color-sc-lowest)           / <alpha-value>)",
        "surface-container-low":       "rgb(var(--color-sc-low)              / <alpha-value>)",
        "surface-container":           "rgb(var(--color-sc)                  / <alpha-value>)",
        "surface-container-high":      "rgb(var(--color-sc-high)             / <alpha-value>)",
        "surface-container-highest":   "rgb(var(--color-sc-highest)          / <alpha-value>)",
        "surface-bright":              "rgb(var(--color-surface-bright)      / <alpha-value>)",
        "on-surface":                  "rgb(var(--color-on-surface)          / <alpha-value>)",
        "on-surface-variant":          "rgb(var(--color-on-surface-variant)  / <alpha-value>)",
        "primary":                     "rgb(var(--color-primary)             / <alpha-value>)",
        "primary-container":           "rgb(var(--color-primary-container)   / <alpha-value>)",
        "on-primary":                  "rgb(var(--color-on-primary)          / <alpha-value>)",
        "primary-fixed":               "rgb(var(--color-primary-fixed)       / <alpha-value>)",
        "tertiary":                    "rgb(var(--color-tertiary)            / <alpha-value>)",
        "tertiary-container":          "rgb(var(--color-tertiary-container)  / <alpha-value>)",
        "on-tertiary":                 "rgb(var(--color-on-tertiary)         / <alpha-value>)",
        "outline":                     "rgb(var(--color-outline)             / <alpha-value>)",
        "outline-variant":             "rgb(var(--color-outline-variant)     / <alpha-value>)",
        "inverse-on-surface":          "rgb(var(--color-inverse-on-surface)  / <alpha-value>)",
      },
      // ── Stitch typography ──
      fontFamily: {
        "display-lg":       ["Inter", "system-ui", "sans-serif"],
        "headline-md":      ["Inter", "system-ui", "sans-serif"],
        "body-base":        ["Inter", "system-ui", "sans-serif"],
        "data-label":       ['"JetBrains Mono"', "monospace"],
        "data-value":       ['"JetBrains Mono"', "monospace"],
        "caption":          ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-lg":       ["48px",  { lineHeight: "56px",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md":      ["24px",  { lineHeight: "32px",  letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-sm":      ["20px",  { lineHeight: "28px",  fontWeight: "600" }],
        "body-base":        ["14px",  { lineHeight: "20px",  fontWeight: "400" }],
        "data-label":       ["12px",  { lineHeight: "16px",  letterSpacing: "0.05em",  fontWeight: "500" }],
        "data-value":       ["13px",  { lineHeight: "18px",  fontWeight: "400" }],
        "caption":          ["11px",  { lineHeight: "14px",  fontWeight: "500" }],
      },
      // ── Stitch spacing ──
      spacing: {
        "margin-desktop": "24px",
        "gutter":         "16px",
        "xs":             "8px",
        "sm":             "12px",
        "md":             "20px",
        "lg":             "32px",
        "xl":             "48px",
        "base":           "4px",
      },
      // ── Stitch border radius ──
      borderRadius: {
        DEFAULT: "0.125rem",
        lg:      "0.25rem",
        xl:      "0.5rem",
        "2xl":   "0.75rem",
      },
    },
  },
  plugins: [],
};

export default config;
