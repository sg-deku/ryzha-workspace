import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse, after } from "next/server"
import { writeAudit, getClientIp } from "@/lib/audit"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const run = await prisma.paymentRun.findUnique({
    where: { id, organizationId: session.user.organizationId },
    include: { items: { select: { id: true } } },
  })
  if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (run.status !== "DRAFT") return NextResponse.json({ error: "Only DRAFT runs can be approved" }, { status: 400 })
  if (run.items.length === 0) return NextResponse.json({ error: "Cannot approve an empty payment run" }, { status: 400 })

  const updated = await prisma.paymentRun.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedBy: session.user.name ?? session.user.email ?? session.user.id,
      approvedAt: new Date(),
    },
  })

  after(
    writeAudit({
      action: "APPROVE",
      entityType: "PaymentRun",
      entityId: id,
      actorId: session.user.id,
      actorEmail: session.user.email,
      organizationId: session.user.organizationId,
      before: { status: "DRAFT" },
      after: { status: "APPROVED", approvedBy: updated.approvedBy, approvedAt: updated.approvedAt },
      details: { runNumber: run.runNumber, name: run.name, itemCount: run.items.length },
      ipAddress: getClientIp(req),
    }).catch(console.error)
  )

  return NextResponse.json(updated)
}
