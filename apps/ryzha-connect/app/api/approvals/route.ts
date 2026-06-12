import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const [pending, recent] = await Promise.all([
    prisma.financialEventApproval.findMany({
      where: { organizationId, status: "PENDING" },
      orderBy: [{ dueDate: "asc" }, { requestedAt: "asc" }],
      include: { financialEvent: true },
    }),
    prisma.financialEventApproval.findMany({
      where: {
        organizationId,
        status: { in: ["APPROVED", "REJECTED"] },
      },
      orderBy: { decidedAt: "desc" },
      take: 20,
      include: { financialEvent: true },
    }),
  ])

  return NextResponse.json({ pending, recent })
}
