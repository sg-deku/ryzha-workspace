import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workflows = await prisma.wsWorkflow.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      executions: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, status: true, startedAt: true, finishedAt: true, durationMs: true },
      },
      _count: { select: { nodes: true, executions: true } },
    },
    orderBy: { updatedAt: "desc" },
  })

  return NextResponse.json({ workflows })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, description } = body

  const workflow = await prisma.wsWorkflow.create({
    data: {
      organizationId: session.user.organizationId,
      name: name || "Untitled Workflow",
      description: description || "",
    },
  })

  return NextResponse.json({ workflow }, { status: 201 })
}
