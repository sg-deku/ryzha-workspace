import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance } from "react-native"

export type ColorScheme = "light" | "dark" | "system"

export type AccentTheme = "default" | "warm-earth" | "new-authority" | "deep-amethyst" | "radioactive"

export interface ThemeColors {
  primary: string
  primaryLight: string
  background: string
  card: string
  border: string
  text: string
  textSecondary: string
  textMuted: string
  gradient: [string, string]
  isDark: boolean
}

export const ACCENT_THEMES: Record<AccentTheme, { name: string; primary: string; primaryLight: string; gradient: [string, string]; preview: string }> = {
  "default": {
    name: "Ryzha (Default)",
    primary: "#4F46E5",
    primaryLight: "#EEF2FF",
    gradient: ["#1E1B4B", "#4F46E5"],
    preview: "#4F46E5",
  },
  "warm-earth": {
    name: "Warm Earth",
    primary: "#C4863A",
    primaryLight: "#FEF3C7",
    gradient: ["#3D2B0E", "#C4863A"],
    preview: "#C4863A",
  },
  "new-authority": {
    name: "New Authority",
    primary: "#FF6B00",
    primaryLight: "#FFF1E6",
    gradient: ["#1A0A00", "#FF6B00"],
    preview: "#FF6B00",
  },
  "deep-amethyst": {
    name: "Deep Amethyst",
    primary: "#7C3AED",
    primaryLight: "#F5F3FF",
    gradient: ["#1E0B4B", "#7C3AED"],
    preview: "#7C3AED",
  },
  "radioactive": {
    name: "Radioactive",
    primary: "#22C55E",
    primaryLight: "#F0FDF4",
    gradient: ["#052E16", "#22C55E"],
    preview: "#22C55E",
  },
}

const LIGHT_COLORS = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  border: "#F1F5F9",
  text: "#0F172A",
  textSecondary: "#64748B",
  textMuted: "#94A3B8",
  isDark: false,
}

const DARK_COLORS = {
  background: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  isDark: true,
}

interface ThemeContextValue {
  colorScheme: ColorScheme
  accentTheme: AccentTheme
  colors: ThemeColors
  setColorScheme: (s: ColorScheme) => void
  setAccentTheme: (t: AccentTheme) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "system",
  accentTheme: "default",
  colors: { ...LIGHT_COLORS, primary: "#4F46E5", primaryLight: "#EEF2FF", gradient: ["#1E1B4B", "#4F46E5"] },
  setColorScheme: () => {},
  setAccentTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("system")
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>("default")

  useEffect(() => {
    AsyncStorage.multiGet(["ryzha_color_scheme", "ryzha_accent_theme"]).then(([[, cs], [, at]]) => {
      if (cs) setColorSchemeState(cs as ColorScheme)
      if (at) setAccentThemeState(at as AccentTheme)
    })
  }, [])

  const setColorScheme = (s: ColorScheme) => {
    setColorSchemeState(s)
    AsyncStorage.setItem("ryzha_color_scheme", s)
  }

  const setAccentTheme = (t: AccentTheme) => {
    setAccentThemeState(t)
    AsyncStorage.setItem("ryzha_accent_theme", t)
  }

  const systemScheme = Appearance.getColorScheme()
  const effectiveScheme = colorScheme === "system" ? (systemScheme ?? "light") : colorScheme
  const baseColors = effectiveScheme === "dark" ? DARK_COLORS : LIGHT_COLORS
  const accent = ACCENT_THEMES[accentTheme]

  const colors: ThemeColors = {
    ...baseColors,
    primary: accent.primary,
    primaryLight: accent.primaryLight,
    gradient: accent.gradient,
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, accentTheme, colors, setColorScheme, setAccentTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
