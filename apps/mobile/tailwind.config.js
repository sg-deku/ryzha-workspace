/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2563eb",
        "primary-foreground": "#ffffff",
        background: "#f8fafc",
        card: "#ffffff",
        border: "#e2e8f0",
        muted: "#94a3b8",
        destructive: "#ef4444",
        success: "#22c55e",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
}
