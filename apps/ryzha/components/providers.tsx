"use client"
import { ThemeProvider } from "./theme-provider"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="theme-amethyst"
        enableSystem
        disableTransitionOnChange
        themes={["light", "dark", "system", "theme-amethyst", "theme-forge", "theme-vertex", "theme-quantum", "theme-void", "theme-oasis", "theme-azure", "theme-dune", "theme-blush"]}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
