/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        "primary-dark": "#3730A3",
        "primary-light": "#6366F1",
        accent: "#7C3AED",
        "surface-dark": "#0F172A",
        "surface-mid": "#1E293B",
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        muted: "#94A3B8",
        destructive: "#EF4444",
        success: "#10B981",
        warning: "#F59E0B",
        info: "#3B82F6",
        "ink-primary": "#0F172A",
        "ink-secondary": "#475569",
        "ink-muted": "#94A3B8",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
}
