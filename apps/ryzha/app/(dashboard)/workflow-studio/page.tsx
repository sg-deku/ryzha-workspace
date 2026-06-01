import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import WorkflowStudioPage from "./page-client"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  return <WorkflowStudioPage />
}
