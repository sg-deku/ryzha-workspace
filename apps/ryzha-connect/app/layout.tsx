import type { Metadata } from "next"
import { Inter, Sora } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })
const sora = Sora({ subsets: ["latin"], variable: "--font-sora", display: "swap", weight: ["400", "500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "Ryzha - Financial Architecture for Startups",
  description: "AI-native financial data infrastructure for hyper-growth companies",
  icons: { icon: "/favicon.ico" },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-muted/20 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
