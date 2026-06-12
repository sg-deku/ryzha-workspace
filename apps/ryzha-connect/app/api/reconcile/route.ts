import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const [postedCount, failedCount, connections, syncLogs, eventsBySource] = await Promise.all([
    prisma.financialEvent.count({ where: { organizationId, status: "POSTED" } }),
    prisma.financialEvent.count({ where: { organizationId, status: "FAILED" } }),
    prisma.integrationConnection.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: { syncLogs: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
    prisma.integrationSyncLog.findMany({
      where: { integrationConnection: { organizationId } },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { integrationConnection: true, financialEvent: true },
    }),
    prisma.financialEvent.groupBy({
      by: ["source", "status"],
      where: { organizationId },
      _count: { id: true },
    }),
  ])

  const sourceMap: Record<string, Record<string, number>> = {}
  for (const row of eventsBySource) {
    if (!sourceMap[row.source]) sourceMap[row.source] = {}
    sourceMap[row.source][row.status] = row._count.id
  }

  return NextResponse.json({ postedCount, failedCount, connections, syncLogs, sourceMap })
}
