"use client"
import { ThemeProvider } from "./theme-provider"
// import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark", "system", "theme-warm-earth", "theme-new-authority", "theme-deep-amethyst", "theme-radioactive"]}
    >
      {children}
    </ThemeProvider>
  )
}
