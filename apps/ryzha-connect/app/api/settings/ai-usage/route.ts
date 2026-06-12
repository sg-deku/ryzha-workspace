import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const last6MonthsStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [allTime, thisMonth, today, byFeature, byModel, byProvider, byMonthRaw, recentLogs] = await Promise.all([
    prisma.aIUsageLog.aggregate({
      where: { organizationId },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { id: true },
    }),
    prisma.aIUsageLog.aggregate({
      where: { organizationId, createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { id: true },
    }),
    prisma.aIUsageLog.aggregate({
      where: { organizationId, createdAt: { gte: startOfDay } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { id: true },
    }),
    prisma.aIUsageLog.groupBy({
      by: ["feature"],
      where: { organizationId, createdAt: { gte: startOfMonth } },
      _sum: { totalTokens: true, promptTokens: true, completionTokens: true },
      _count: { id: true },
      orderBy: { _sum: { totalTokens: "desc" } },
    }),
    prisma.aIUsageLog.groupBy({
      by: ["model"],
      where: { organizationId },
      _sum: { totalTokens: true },
      _count: { id: true },
      orderBy: { _sum: { totalTokens: "desc" } },
    }),
    prisma.aIUsageLog.groupBy({
      by: ["provider"],
      where: { organizationId },
      _sum: { totalTokens: true },
      _count: { id: true },
      orderBy: { _sum: { totalTokens: "desc" } },
    }),
    prisma.aIUsageLog.findMany({
      where: { organizationId, createdAt: { gte: last6MonthsStart } },
      select: { createdAt: true, totalTokens: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.aIUsageLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        feature: true,
        model: true,
        provider: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        createdAt: true,
      },
    }),
  ])

  const monthlyMap: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyMap[key] = 0
  }
  for (const row of byMonthRaw) {
    const d = new Date(row.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (key in monthlyMap) monthlyMap[key] += row.totalTokens
  }
  const monthlyTrend = Object.entries(monthlyMap).map(([month, tokens]) => ({ month, tokens }))

  return NextResponse.json({
    allTime: {
      totalTokens: allTime._sum.totalTokens ?? 0,
      promptTokens: allTime._sum.promptTokens ?? 0,
      completionTokens: allTime._sum.completionTokens ?? 0,
      calls: allTime._count.id,
    },
    thisMonth: {
      totalTokens: thisMonth._sum.totalTokens ?? 0,
      promptTokens: thisMonth._sum.promptTokens ?? 0,
      completionTokens: thisMonth._sum.completionTokens ?? 0,
      calls: thisMonth._count.id,
    },
    today: {
      totalTokens: today._sum.totalTokens ?? 0,
      promptTokens: today._sum.promptTokens ?? 0,
      completionTokens: today._sum.completionTokens ?? 0,
      calls: today._count.id,
    },
    byFeature: byFeature.map((f) => ({
      feature: f.feature,
      totalTokens: f._sum.totalTokens ?? 0,
      promptTokens: f._sum.promptTokens ?? 0,
      completionTokens: f._sum.completionTokens ?? 0,
      calls: f._count.id,
    })),
    byModel: byModel.map((m) => ({
      model: m.model,
      totalTokens: m._sum.totalTokens ?? 0,
      calls: m._count.id,
    })),
    byProvider: byProvider.map((p) => ({
      provider: p.provider,
      totalTokens: p._sum.totalTokens ?? 0,
      calls: p._count.id,
    })),
    monthlyTrend,
    recentLogs,
  })
}
