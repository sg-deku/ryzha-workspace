"use client"
import dynamic from "next/dynamic"

const DynamicSessionProvider = dynamic(
  () => import("next-auth/react").then((mod) => mod.SessionProvider),
  { ssr: false }
)

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  return <DynamicSessionProvider refetchInterval={300}>{children}</DynamicSessionProvider>
}
