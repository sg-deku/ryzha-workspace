import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency, formatRelative } from "@/lib/utils"
import { SyncButton } from "@/components/ui/sync-button"
import { StatCard } from "@/components/ui/stat-card"
import { PageHeader } from "@/components/ui/page-header"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Plug,
  InboxIcon,
  CheckSquare,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

async function getOverviewData(organizationId: string) {
  const [connections, eventCounts, pendingApprovals, recentEvents] = await Promise.all([
    prisma.integrationConnection.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.financialEvent.groupBy({
      by: ["status"],
      where: { organizationId },
      _count: { id: true },
    }),
    prisma.financialEventApproval.count({
      where: { organizationId, status: "PENDING" },
    }),
    prisma.financialEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  ])

  const statusMap = Object.fromEntries(eventCounts.map((e) => [e.status, e._count.id]))

  return {
    connections,
    statusMap,
    pendingApprovals,
    recentEvents,
    totalEvents: Object.values(statusMap).reduce((a, b) => a + b, 0),
    postedEvents: statusMap["POSTED"] ?? 0,
    failedEvents: statusMap["FAILED"] ?? 0,
    inQueueEvents: (statusMap["INGESTED"] ?? 0) + (statusMap["PROCESSING"] ?? 0) + (statusMap["PENDING_APPROVAL"] ?? 0),
  }
}

const STATUS_BADGE: Record<string, string> = {
  INGESTED:         "badge-info",
  PROCESSING:       "badge-warning",
  PENDING_APPROVAL: "badge-warning",
  APPROVED:         "badge-sky",
  PUSHING:          "badge-purple",
  POSTED:           "badge-success",
  FAILED:           "badge-error",
  SKIPPED:          "badge-neutral",
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? "badge-neutral"
  return <span className={cls}>{status.replace(/_/g, " ")}</span>
}

function ConnectionChip({ provider, status }: { provider: string; status: string }) {
  const isActive = status === "ACTIVE"
  return (
    <div className="flex items-center gap-2.5 rounded-lg border px-3 py-2.5 hover:bg-muted/30 transition-colors">
      <span className={`h-2 w-2 rounded-full shrink-0 ${isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
      <span className="text-sm font-medium truncate flex-1">{provider.replace(/_/g, " ")}</span>
      {!isActive && (
        <span className="text-[10px] text-muted-foreground capitalize shrink-0">{status.toLowerCase()}</span>
      )}
    </div>
  )
}

export default async function OverviewPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const data = await getOverviewData(session.user.organizationId)

  return (
    <div className="space-y-7">
      <PageHeader
        title="Overview"
        description="Real-time view across all connected platforms"
        right={<SyncButton />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Connections"
          value={data.connections.filter((c) => c.status === "ACTIVE").length}
          sub={`${data.connections.length} total configured`}
        />
        <StatCard
          label="Events in Queue"
          value={data.inQueueEvents}
          sub="Awaiting processing or approval"
        />
        <StatCard
          label="Pending Approvals"
          value={data.pendingApprovals}
          sub="Require human decision"
          trend={data.pendingApprovals > 0 ? "down" : "neutral"}
        />
        <StatCard
          label="Posted to Books"
          value={data.postedEvents}
          sub={`${data.failedEvents} failed`}
          trend="up"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-default overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <p className="text-sm font-semibold">Recent Financial Events</p>
            <a href="/staging" className="text-xs text-primary hover:underline">
              View all →
            </a>
          </div>
          <div className="divide-y">
            {data.recentEvents.length === 0 ? (
              <EmptyState
                icon={InboxIcon}
                title="No events yet"
                description="Connect a platform to start ingesting financial events."
                action={{ label: "Connect a platform", href: "/connect" }}
              />
            ) : (
              data.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between px-5 py-3.5 table-row-hover"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {event.source.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.eventType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.source} · {formatRelative(event.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {event.amount != null && (
                      <span className="num text-sm">
                        {formatCurrency(event.amount, event.currency)}
                      </span>
                    )}
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card-default overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <p className="text-sm font-semibold">Connected Platforms</p>
            <a href="/connect" className="text-xs text-primary hover:underline">
              Manage →
            </a>
          </div>
          <div className="p-4 space-y-2">
            {data.connections.length === 0 ? (
              <EmptyState
                icon={Plug}
                title="No platforms connected"
                action={{ label: "Add first connection", href: "/connect" }}
              />
            ) : (
              data.connections.map((conn) => (
                <ConnectionChip key={conn.id} provider={conn.provider} status={conn.status} />
              ))
            )}
          </div>
        </div>
      </div>

      {data.failedEvents > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {data.failedEvents} event{data.failedEvents !== 1 ? "s" : ""} failed to push
            </p>
            <p className="text-xs text-red-600/80 dark:text-red-400/70 mt-0.5">
              Review failed events in the staging queue to retry or resolve.{" "}
              <a href="/staging?status=FAILED" className="underline">
                View failed events →
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
