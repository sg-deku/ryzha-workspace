import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isSuperAdmin) redirect("/login")

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      actorId: true,
      details: true,
      createdAt: true,
    },
  })

  const actorIds = [...new Set(logs.map((l) => l.actorId).filter(Boolean) as string[])]
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true, email: true },
      })
    : []
  const actorMap = Object.fromEntries(actors.map((a) => [a.id, a]))

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE") || action.includes("INVITE")) return <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">{action}</Badge>
    if (action.includes("UPDATE")) return <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">{action}</Badge>
    if (action.includes("DELETE") || action.includes("REMOVE") || action.includes("PURGE")) return <Badge variant="destructive">{action}</Badge>
    if (action.includes("SUSPEND")) return <Badge variant="warning" className="bg-orange-500/10 text-orange-500 border-orange-500/20">{action}</Badge>
    return <Badge variant="outline">{action}</Badge>
  }

  return (
    <>
      <Header title="Audit Logs" />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Showing the latest {logs.length} audit logs</p>
        </div>

        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Entity</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const actor = log.actorId ? actorMap[log.actorId] : null
                const detailsStr = log.details ? JSON.stringify(log.details) : ""
                
                return (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(log.createdAt)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-xs">{log.entityType}</p>
                      <p className="text-xs text-muted-foreground font-mono">{log.entityId}</p>
                    </td>
                    <td className="px-4 py-3">
                      {actor ? (
                        <>
                          <p className="text-xs font-medium">{actor.name || "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{actor.email}</p>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground font-mono">{log.actorId || "System"}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground break-words max-w-[300px]">
                      {detailsStr.length > 100 ? (
                        <span title={detailsStr}>{detailsStr.substring(0, 100)}...</span>
                      ) : (
                        detailsStr
                      )}
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No audit logs found.
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
