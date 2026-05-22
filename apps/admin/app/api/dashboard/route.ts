import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [
    totalOrgs,
    activeOrgs,
    pendingOrgs,
    suspendedOrgs,
    totalUsers,
    totalApiCalls,
    totalAiTokens,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { status: "PENDING" } }),
    prisma.organization.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count(),
    prisma.usageMetrics.aggregate({ _sum: { apiCalls: true } }),
    prisma.usageMetrics.aggregate({ _sum: { aiTokensUsed: true } }),
  ])

  return NextResponse.json({
    totalOrgs,
    activeOrgs,
    pendingOrgs,
    suspendedOrgs,
    totalUsers,
    totalApiCalls: totalApiCalls._sum.apiCalls ?? 0,
    totalAiTokens: totalAiTokens._sum.aiTokensUsed ?? 0,
  })
}
