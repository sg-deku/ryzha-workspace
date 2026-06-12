import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { runWorkflow } from "@/lib/workflow-studio/runner"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { workflowId, triggerPayload } = body

  if (!workflowId) return NextResponse.json({ error: "workflowId required" }, { status: 400 })

  const workflow = await prisma.wsWorkflow.findFirst({
    where: { id: workflowId, organizationId: session.user.organizationId },
  })
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 })

  const executionId = await runWorkflow(workflowId, triggerPayload ?? {}, "MANUAL_TEST")

  return NextResponse.json({ executionId })
}
