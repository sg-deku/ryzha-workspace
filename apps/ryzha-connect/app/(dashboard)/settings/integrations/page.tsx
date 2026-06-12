import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatRelative } from "@/lib/utils"
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  RefreshCw,
  Trash2,
  BookOpen,
} from "lucide-react"

async function getData(organizationId: string) {
  const connections = await prisma.integrationConnection.findMany({
    where: { organizationId },
    include: {
      syncLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      coaMappings: {
        where: { isActive: true },
        select: { id: true },
      },
    },
    orderBy: { createdAt: "asc" },
  })

  return { connections }
}

type StatusKey = "ACTIVE" | "EXPIRED" | "DISCONNECTED" | "ERROR"

function ConnectionStatusBadge({ status }: { status: string }) {
  const map: Record<string, { icon: React.ElementType; cls: string }> = {
    ACTIVE: { icon: CheckCircle2, cls: "text-emerald-600" },
    EXPIRED: { icon: Clock, cls: "text-yellow-600" },
    DISCONNECTED: { icon: XCircle, cls: "text-muted-foreground" },
    ERROR: { icon: AlertCircle, cls: "text-red-500" },
  }
  const { icon: Icon, cls } = map[status] ?? map.ERROR
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${cls}`}>
      <Icon className="h-4 w-4" />
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}

export default async function SettingsIntegrationsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const { connections } = await getData(session.user.organizationId)

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">Integration Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Manage OAuth connections, sync schedules, and Chart of Accounts mappings.
        </p>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <p className="font-semibold">No integrations configured</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Connect your first platform from the{" "}
            <a href="/connect" className="text-primary hover:underline">
              Connections page
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {connections.map((conn) => {
            const lastSync = conn.syncLogs[0]
            const coaCount = conn.coaMappings.length

            return (
              <div
                key={conn.id}
                className="rounded-xl border bg-card p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">
                        {conn.displayName ?? conn.provider.replace(/_/g, " ")}
                      </h3>
                      <ConnectionStatusBadge status={conn.status} />
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      Provider: {conn.provider}
                      {conn.realmId && ` · Realm: ${conn.realmId}`}
                      {conn.tenantId && ` · Tenant: ${conn.tenantId}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <form action={`/api/connect/${conn.provider.toLowerCase()}/sync`} method="POST">
                      <input type="hidden" name="connectionId" value={conn.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted transition-colors"
                      >
                        <RefreshCw className="h-3 w-3" /> Sync now
                      </button>
                    </form>
                    <form action={`/api/connect/${conn.provider.toLowerCase()}/disconnect`} method="POST">
                      <input type="hidden" name="connectionId" value={conn.id} />
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Disconnect
                      </button>
                    </form>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Last synced</p>
                    <p className="text-sm font-medium mt-0.5">
                      {conn.lastSyncAt ? formatRelative(conn.lastSyncAt) : "Never"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Token expires</p>
                    <p className="text-sm font-medium mt-0.5">
                      {conn.expiresAt
                        ? new Date(conn.expiresAt) < new Date()
                          ? <span className="text-red-500">Expired</span>
                          : formatRelative(conn.expiresAt)
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last operation</p>
                    <p className="text-sm font-medium mt-0.5">
                      {lastSync ? (
                        <span className={lastSync.status === "FAILED" ? "text-red-500" : ""}>
                          {lastSync.status} · {lastSync.direction}
                        </span>
                      ) : (
                        "-"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3 w-3" /> COA Mappings
                    </p>
                    <p className="text-sm font-medium mt-0.5">
                      {coaCount > 0 ? (
                        <a
                          href={`/settings/coa?connectionId=${conn.id}`}
                          className="text-primary hover:underline"
                        >
                          {coaCount} accounts
                        </a>
                      ) : (
                        <a
                          href={`/api/connect/${conn.provider.toLowerCase()}/sync-coa?connectionId=${conn.id}`}
                          className="text-muted-foreground hover:text-foreground text-xs border rounded px-2 py-0.5 transition-colors"
                        >
                          Sync COA
                        </a>
                      )}
                    </p>
                  </div>
                </div>

                {conn.errorMessage && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 px-4 py-2.5 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600 dark:text-red-400">{conn.errorMessage}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
