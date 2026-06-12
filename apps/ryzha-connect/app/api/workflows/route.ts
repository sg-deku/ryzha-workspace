import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const [workflows, recentExecutions] = await Promise.all([
    prisma.wsWorkflow.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { executions: true } } },
    }),
    prisma.wsWorkflowExecution.findMany({
      where: { workflow: { organizationId } },
      orderBy: { startedAt: "desc" },
      take: 10,
      include: { workflow: { select: { name: true } } },
    }),
  ])

  return NextResponse.json({ workflows, recentExecutions })
}
