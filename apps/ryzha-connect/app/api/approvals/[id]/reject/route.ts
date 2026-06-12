import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const { id: approvalId } = await params

  const approval = await prisma.financialEventApproval.findFirst({
    where: { id: approvalId, organizationId, status: "PENDING" },
    include: { financialEvent: true },
  })

  if (!approval) {
    return NextResponse.json({ error: "Approval not found or already resolved" }, { status: 404 })
  }

  const body = await req.json().catch(() => ({}))
  const note: string | undefined = body.note

  await Promise.all([
    prisma.financialEventApproval.update({
      where: { id: approvalId },
      data: {
        status: "REJECTED",
        decidedAt: new Date(),
        decisionNote: note ?? null,
      },
    }),
    prisma.financialEvent.update({
      where: { id: approval.financialEvent.id },
      data: { status: "FAILED" },
    }),
  ])

  return NextResponse.json({ ok: true })
}
