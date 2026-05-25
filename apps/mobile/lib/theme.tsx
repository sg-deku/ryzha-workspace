import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance } from "react-native"

export type ColorScheme = "light" | "dark" | "system"

export type AccentTheme = "amethyst" | "forge" | "vertex" | "quantum" | "void" | "oasis" | "azure" | "dune" | "blush"

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
  "amethyst": {
    name: "Amethyst",
    primary: "#7C3AED",
    primaryLight: "#F5F3FF",
    gradient: ["#2E1065", "#7C3AED"],
    preview: "#7C3AED",
  },
  "forge": {
    name: "Forge",
    primary: "#EA580C",
    primaryLight: "#FFEDD5",
    gradient: ["#431407", "#EA580C"],
    preview: "#EA580C",
  },
  "vertex": {
    name: "Vertex",
    primary: "#10B981",
    primaryLight: "#D1FAE5",
    gradient: ["#022C22", "#10B981"],
    preview: "#10B981",
  },
  "quantum": {
    name: "Quantum",
    primary: "#8B5CF6",
    primaryLight: "#EDE9FE",
    gradient: ["#2E1065", "#8B5CF6"],
    preview: "#8B5CF6",
  },
  "void": {
    name: "Void",
    primary: "#E11D48",
    primaryLight: "#FFE4E6",
    gradient: ["#4C0519", "#E11D48"],
    preview: "#E11D48",
  },
  "oasis": {
    name: "Oasis",
    primary: "#558F6A",
    primaryLight: "#ECFDF5",
    gradient: ["#064E3B", "#558F6A"],
    preview: "#558F6A",
  },
  "azure": {
    name: "Azure",
    primary: "#3B82F6",
    primaryLight: "#DBEAFE",
    gradient: ["#1E3A8A", "#3B82F6"],
    preview: "#3B82F6",
  },
  "dune": {
    name: "Dune",
    primary: "#F16345",
    primaryLight: "#FFEDD5",
    gradient: ["#7C2D12", "#F16345"],
    preview: "#F16345",
  },
  "blush": {
    name: "Blush",
    primary: "#F43F5E",
    primaryLight: "#FFE4E6",
    gradient: ["#881337", "#F43F5E"],
    preview: "#F43F5E",
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
  accentTheme: "amethyst",
  colors: { ...LIGHT_COLORS, primary: "#7C3AED", primaryLight: "#F5F3FF", gradient: ["#2E1065", "#7C3AED"] },
  setColorScheme: () => {},
  setAccentTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("system")
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>("amethyst")

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
