import { getServerSession } from "next-auth"
import { redirect, notFound } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDate, formatNumber } from "@/lib/utils"
import { LicenseEditor } from "./license-editor"
import { UsageChart } from "./usage-chart"
import { TenantActions } from "../tenant-actions"

export const dynamic = "force-dynamic"

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const org = await prisma.organization.findUnique({
    where: { id },
    include: {
      users: {
        include: {
          user: { select: { id: true, name: true, email: true, status: true, createdAt: true } },
          role: true,
        },
      },
      license: { include: { plan: true } },
      usageMetrics: { orderBy: { date: "asc" }, take: 30 },
    },
  })

  if (!org) notFound()

  const plans = await prisma.subscriptionPlan.findMany({ where: { isActive: true } })

  const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    ACTIVE: "success",
    PENDING: "warning",
    SUSPENDED: "destructive",
    REJECTED: "secondary",
  }

  return (
    <>
      <Header title={org.name} />
      <div className="flex-1 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{org.name}</h2>
            <Badge variant={statusVariant[org.status] ?? "secondary"}>{org.status}</Badge>
            <span className="text-sm text-muted-foreground">/{org.slug}</span>
          </div>
          <TenantActions orgId={org.id} currentStatus={org.status} />
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users ({org.users.length})</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Created</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{formatDate(org.createdAt)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{org.license?.plan?.name ?? org.plan}</p>
                </CardContent>
              </Card>
              {org.approvedAt && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-semibold">{formatDate(org.approvedAt)}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <LicenseEditor orgId={org.id} orgStatus={org.status} license={org.license as any} plans={plans} />
          </TabsContent>

          <TabsContent value="users" className="pt-4">
            <div className="rounded-lg border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {org.users.map(({ user, role }) => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">{role.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.status === "ACTIVE" ? "success" : "secondary"}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))}
                  {org.users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                        No users in this organization.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="usage" className="pt-4">
            <UsageChart data={org.usageMetrics.map((m) => ({
              date: formatDate(m.date),
              apiCalls: m.apiCalls,
              aiTokens: m.aiTokensUsed,
            }))} />

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total API Calls</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(org.usageMetrics.reduce((s, m) => s + m.apiCalls, 0))}
                  </p>
                  {org.license && (
                    <p className="text-xs text-muted-foreground">Limit: {formatNumber(org.license.maxApiCalls)}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total AI Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {formatNumber(org.usageMetrics.reduce((s, m) => s + m.aiTokensUsed, 0))}
                  </p>
                  {org.license && (
                    <p className="text-xs text-muted-foreground">Limit: {formatNumber(org.license.maxAiTokens)}</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Max Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{org.users.length}</p>
                  {org.license && (
                    <p className="text-xs text-muted-foreground">Limit: {org.license.maxUsers}</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
