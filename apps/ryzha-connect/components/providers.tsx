"use client"
import AuthProvider from "./auth-provider"
import { ThemeProvider } from "./theme-provider"
import { Toaster } from "sonner"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
        {children}
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </AuthProvider>
  )
}
