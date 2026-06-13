"use client"
import dynamic from "next/dynamic"

const SessionProvider = dynamic(
  () => import("next-auth/react").then((mod) => mod.SessionProvider),
  { ssr: false }
)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
