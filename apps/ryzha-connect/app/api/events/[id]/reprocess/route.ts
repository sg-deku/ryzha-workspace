import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { runRevenueAgent } from "@/lib/agents/revenue-agent"

export const dynamic = "force-dynamic"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const { organizationId } = session.user

  const event = await prisma.financialEvent.findFirst({
    where: { id, organizationId },
    select: { id: true, status: true, eventType: true },
  })

  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

  await prisma.aIDecisionLog.deleteMany({
    where: {
      financialEventId: id,
      decisionType: { in: ["REV_REC", "GL_CODE"] },
    },
  })

  await prisma.externalReference.deleteMany({
    where: { financialEventId: id },
  })

  await prisma.financialEvent.update({
    where: { id },
    data: { status: "INGESTED", pushedAt: null },
  })

  const result = await runRevenueAgent(organizationId)

  return NextResponse.json({ ok: true, result })
}
