import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { AriaClient } from "./aria-client"

export const dynamic = "force-dynamic"
export const metadata = { title: "Aria — AI Accounting Co-pilot · Ryzha" }

export default async function AriaPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  return <AriaClient userName={session.user.name} />
}
