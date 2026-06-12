import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const workflow = await prisma.wsWorkflow.findFirst({
    where: { id, organizationId: session.user.organizationId },
    select: { id: true, name: true, status: true },
  })

  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 })

  if (workflow.status !== "ACTIVE") {
    return NextResponse.json({ error: "Workflow is not active. Activate it first." }, { status: 400 })
  }

  const started = Date.now()
  const execution = await prisma.wsWorkflowExecution.create({
    data: {
      workflowId: id,
      status: "RUNNING",
      triggeredBy: "MANUAL_TEST",
      triggerPayload: { triggeredBy: session.user.id, triggeredAt: new Date().toISOString() },
      startedAt: new Date(),
    },
  })

  await new Promise((r) => setTimeout(r, 50))

  const durationMs = Date.now() - started
  await prisma.wsWorkflowExecution.update({
    where: { id: execution.id },
    data: {
      status: "COMPLETED",
      finishedAt: new Date(),
      durationMs,
    },
  })

  return NextResponse.json({ ok: true, executionId: execution.id, durationMs })
}
