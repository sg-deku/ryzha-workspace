"use client"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "./theme-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        themes={["light", "dark", "system", "theme-warm-earth", "theme-new-authority", "theme-deep-amethyst", "theme-radioactive"]}
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
