import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function RootPage() {
  const session = await getSession()
  if (!session?.user?.isSuperAdmin) redirect("/login")
  redirect("/dashboard")
}
