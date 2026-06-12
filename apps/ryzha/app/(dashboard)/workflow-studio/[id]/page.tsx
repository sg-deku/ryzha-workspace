import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { WorkflowCanvas } from "../components/workflow-canvas"

export const dynamic = "force-dynamic"

export default async function Page({ params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  return <WorkflowCanvas workflowId={params.id} />
}
