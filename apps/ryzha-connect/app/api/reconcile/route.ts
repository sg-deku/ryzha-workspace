import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 3600 * 1000)

  const [postedCount, failedCount, connections, syncLogs, eventsBySource, exceptions, agentExceptions] = await Promise.all([
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
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        OR: [
          { status: "FAILED" },
          { status: "PENDING_APPROVAL", updatedAt: { lte: fortyEightHoursAgo } },
          { status: "INGESTED", createdAt: { lte: fortyEightHoursAgo } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        source: true,
        eventType: true,
        status: true,
        amount: true,
        currency: true,
        externalId: true,
        createdAt: true,
        updatedAt: true,
        normalisedData: true,
      },
    }),
    prisma.aIDecisionLog.findMany({
      where: {
        organizationId,
        confidence: { lt: 0.6 },
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        agentName: true,
        decisionType: true,
        confidence: true,
        reasoning: true,
        createdAt: true,
        financialEventId: true,
        financialEvent: {
          select: {
            id: true,
            source: true,
            eventType: true,
            amount: true,
            currency: true,
            status: true,
          },
        },
      },
    }),
  ])

  const sourceMap: Record<string, Record<string, number>> = {}
  for (const row of eventsBySource) {
    if (!sourceMap[row.source]) sourceMap[row.source] = {}
    sourceMap[row.source][row.status] = row._count.id
  }

  return NextResponse.json({
    postedCount,
    failedCount,
    connections,
    syncLogs,
    sourceMap,
    exceptions: exceptions.map((e) => ({
      id: e.id,
      source: e.source,
      eventType: e.eventType,
      status: e.status,
      amount: e.amount,
      currency: e.currency,
      externalId: e.externalId,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
      reason: e.status === "FAILED"
        ? "Event processing failed — reprocess or review"
        : e.status === "PENDING_APPROVAL"
        ? "Awaiting approval for more than 48 hours"
        : "Stuck in ingested state — agent has not processed",
      description: (e.normalisedData as any)?.description
        ?? (e.normalisedData as any)?.merchantName
        ?? (e.normalisedData as any)?.vendorName
        ?? null,
    })),
    agentExceptions: agentExceptions.map((d) => ({
      id: d.id,
      agentName: d.agentName,
      decisionType: d.decisionType,
      confidence: d.confidence,
      reasoning: d.reasoning,
      createdAt: d.createdAt,
      financialEventId: d.financialEventId,
      event: d.financialEvent,
    })),
  })
}
