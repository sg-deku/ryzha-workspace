import Link from "next/link"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDate, formatNumber } from "@/lib/utils"
import { TenantActions } from "./tenant-actions"

export const dynamic = "force-dynamic"

export default async function TenantsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const tenants = await prisma.organization.findMany({
    include: {
      users: true,
      license: { include: { plan: true } },
      usageMetrics: {
        where: { date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const statusVariant: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
    ACTIVE: "success",
    PENDING: "warning",
    SUSPENDED: "destructive",
    REJECTED: "secondary",
  }

  return (
    <>
      <Header title="Tenants" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{tenants.length} total organizations</p>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Organization</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Users</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">API Calls (30d)</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">AI Tokens (30d)</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((org) => {
                const apiCalls = org.usageMetrics.reduce((s, m) => s + m.apiCalls, 0)
                const aiTokens = org.usageMetrics.reduce((s, m) => s + m.aiTokensUsed, 0)
                return (
                  <tr key={org.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/tenants/${org.id}`} className="font-medium hover:underline">
                        {org.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{org.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[org.status] ?? "secondary"}>{org.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {org.license?.plan?.name ?? org.plan}
                    </td>
                    <td className="px-4 py-3 text-right">{org.users.length}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(apiCalls)}</td>
                    <td className="px-4 py-3 text-right">{formatNumber(aiTokens)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(org.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <TenantActions orgId={org.id} currentStatus={org.status} />
                    </td>
                  </tr>
                )
              })}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                    No organizations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
