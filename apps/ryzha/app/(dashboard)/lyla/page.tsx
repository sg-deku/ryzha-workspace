import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { LylaClient } from "./lyla-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Lyla — AI Accounting Co-pilot · Ryzha" }

export default async function LylaPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  return <LylaClient userName={session.user.name} />
}
