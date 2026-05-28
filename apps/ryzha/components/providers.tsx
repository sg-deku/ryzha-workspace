"use client"
import { ThemeProvider } from "./theme-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="theme-amethyst"
      enableSystem
      disableTransitionOnChange
      themes={["light", "dark", "system", "theme-amethyst", "theme-forge", "theme-vertex", "theme-quantum", "theme-void", "theme-oasis", "theme-azure", "theme-dune", "theme-blush"]}
    >
      {children}
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  )
}
