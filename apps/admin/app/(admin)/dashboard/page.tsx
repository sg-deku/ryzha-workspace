import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { Building2, Users, Zap, Activity, Clock, Ban } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const [
    orgCounts,
    totalUsers,
    apiCallsAgg,
    aiTokensAgg,
  ] = await Promise.all([
    prisma.organization.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.count({ where: { isSuperAdmin: false } }),
    prisma.usageMetrics.aggregate({ _sum: { apiCalls: true } }),
    prisma.aIUsageLog.aggregate({ _sum: { totalTokens: true } }),
  ])

  const countByStatus = Object.fromEntries(orgCounts.map((r) => [r.status, r._count._all]))
  const totalOrgs = orgCounts.reduce((s, r) => s + r._count._all, 0)

  const kpis = [
    { title: "Total Tenants", value: totalOrgs, icon: Building2, description: `${countByStatus["ACTIVE"] ?? 0} active` },
    { title: "Pending Approval", value: countByStatus["PENDING"] ?? 0, icon: Clock, description: "Awaiting review" },
    { title: "Suspended", value: countByStatus["SUSPENDED"] ?? 0, icon: Ban, description: "Currently suspended" },
    { title: "Total Users", value: totalUsers, icon: Users, description: "Across all tenants" },
    { title: "Total API Calls", value: apiCallsAgg._sum.apiCalls ?? 0, icon: Activity, description: "All time" },
    { title: "Total AI Tokens", value: aiTokensAgg._sum.totalTokens ?? 0, icon: Zap, description: "All time" },
  ]

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kpis.map(({ title, value, icon: Icon, description }) => (
            <Card key={title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatNumber(value)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
