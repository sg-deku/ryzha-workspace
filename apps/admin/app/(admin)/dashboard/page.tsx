import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Building2, Users, Zap, Activity, Clock, Ban } from "lucide-react"
import { formatNumber } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const [
    totalOrgs,
    activeOrgs,
    pendingOrgs,
    suspendedOrgs,
    totalUsers,
    apiCallsAgg,
    aiTokensAgg,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: "ACTIVE" } }),
    prisma.organization.count({ where: { status: "PENDING" } }),
    prisma.organization.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count(),
    prisma.usageMetrics.aggregate({ _sum: { apiCalls: true } }),
    prisma.usageMetrics.aggregate({ _sum: { aiTokensUsed: true } }),
  ])

  const kpis = [
    { title: "Total Tenants", value: totalOrgs, icon: Building2, description: `${activeOrgs} active` },
    { title: "Pending Approval", value: pendingOrgs, icon: Clock, description: "Awaiting review" },
    { title: "Suspended", value: suspendedOrgs, icon: Ban, description: "Currently suspended" },
    { title: "Total Users", value: totalUsers, icon: Users, description: "Across all tenants" },
    { title: "Total API Calls", value: apiCallsAgg._sum.apiCalls ?? 0, icon: Activity, description: "All time" },
    { title: "Total AI Tokens", value: aiTokensAgg._sum.aiTokensUsed ?? 0, icon: Zap, description: "All time" },
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
