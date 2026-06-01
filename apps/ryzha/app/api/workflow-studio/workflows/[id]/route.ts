import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const workflow = await prisma.wsWorkflow.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
    include: {
      nodes: {
        include: {
          trigger: { include: { connector: true } },
          action: { include: { connector: true } },
          connection: true,
        },
      },
      edges: true,
    },
  })

  if (!workflow) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({ workflow })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { name, description, status, nodes, edges } = body

  const existing = await prisma.wsWorkflow.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.$transaction(async (tx) => {
    await tx.wsWorkflow.update({
      where: { id: params.id },
      data: {
        name: name ?? existing.name,
        description: description ?? existing.description,
        status: status ?? existing.status,
        version: { increment: 1 },
      },
    })

    if (nodes !== undefined) {
      await tx.wsWorkflowEdge.deleteMany({ where: { workflowId: params.id } })
      await tx.wsWorkflowNode.deleteMany({ where: { workflowId: params.id } })

      if (nodes.length > 0) {
        await tx.wsWorkflowNode.createMany({
          data: nodes.map((n: any) => ({
            id: n.id,
            workflowId: params.id,
            triggerId: n.triggerId ?? null,
            actionId: n.actionId ?? null,
            connectionId: n.connectionId ?? null,
            nodeType: n.nodeType,
            label: n.label,
            config: n.config ?? {},
            positionX: n.positionX ?? 0,
            positionY: n.positionY ?? 0,
          })),
        })
      }

      if (edges && edges.length > 0) {
        await tx.wsWorkflowEdge.createMany({
          data: edges.map((e: any) => ({
            id: e.id,
            workflowId: params.id,
            sourceNodeId: e.sourceNodeId,
            targetNodeId: e.targetNodeId,
            sourceHandle: e.sourceHandle ?? "default",
            targetHandle: e.targetHandle ?? "default",
            label: e.label ?? null,
          })),
        })
      }
    }
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user?.organizationId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const existing = await prisma.wsWorkflow.findFirst({
    where: { id: params.id, organizationId: session.user.organizationId },
  })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.wsWorkflow.delete({ where: { id: params.id } })

  return NextResponse.json({ ok: true })
}
