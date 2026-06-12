import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { WorkflowsListPage } from "./workflows-list"

export const dynamic = "force-dynamic"

export default async function Page() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  return <WorkflowsListPage />
}
