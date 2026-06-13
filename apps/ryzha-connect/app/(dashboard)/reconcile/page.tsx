"use client"

import * as React from "react"
import Link from "next/link"
import { formatRelative, formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  CheckCircle2, AlertCircle, GitMerge, ArrowRight, RefreshCw,
  Loader2, GitBranch, AlertTriangle, ExternalLink, Zap,
} from "lucide-react"
import { toast } from "sonner"

interface SyncLog {
  id: string
  direction: string
  entityType: string
  status: string
  durationMs: number | null
  errorMessage: string | null
  createdAt: string
  integrationConnection: { provider: string }
}

interface ReconcileException {
  id: string
  source: string
  eventType: string
  status: string
  amount: number | null
  currency: string
  externalId: string
  createdAt: string
  updatedAt: string
  reason: string
  description: string | null
}

interface AgentException {
  id: string
  agentName: string
  decisionType: string
  confidence: number
  reasoning: string
  createdAt: string
  financialEventId: string | null
  event: {
    id: string
    source: string
    eventType: string
    amount: number | null
    currency: string
    status: string
  } | null
}

interface ReconcileData {
  postedCount: number
  failedCount: number
  connections: { id: string; provider: string; status: string }[]
  syncLogs: SyncLog[]
  sourceMap: Record<string, Record<string, number>>
  exceptions: ReconcileException[]
  agentExceptions: AgentException[]
}

const SYNC_LOG_BADGE: Record<string, string> = {
  SUCCESS: "badge-success",
  FAILED:  "badge-error",
  RETRYING:"badge-warning",
  PENDING: "badge-neutral",
}

const EXCEPTION_STATUS_BADGE: Record<string, string> = {
  FAILED:           "badge-error",
  PENDING_APPROVAL: "badge-warning",
  INGESTED:         "badge-info",
}

function SyncLogStatusBadge({ status }: { status: string }) {
  const cls = SYNC_LOG_BADGE[status] ?? "badge-neutral"
  return <span className={cls}>{status}</span>
}

export default function ReconcilePage() {
  const [data, setData] = React.useState<ReconcileData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<"overview" | "exceptions" | "agent-flags">("overview")

  async function load(showToast = false) {
    if (showToast) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await fetch("/api/reconcile")
      if (!res.ok) throw new Error("Failed to load")
      setData(await res.json())
      if (showToast) toast.success("Reconciliation data refreshed")
    } catch {
      if (showToast) toast.error("Failed to refresh")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  React.useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
      </div>
    )
  }

  if (!data) return null

  const hasIssues = data.failedCount > 0
  const reconciledTotal = Object.values(data.sourceMap).reduce((sum, statuses) => sum + Object.values(statuses).reduce((a, b) => a + b, 0), 0)
  const reconciledPosted = Object.values(data.sourceMap).reduce((sum, statuses) => sum + (statuses["POSTED"] ?? 0), 0)
  const overallPct = reconciledTotal > 0 ? Math.round((reconciledPosted / reconciledTotal) * 100) : 100
  const totalExceptions = data.exceptions.length + data.agentExceptions.length

  return (
    <div className="space-y-7">
      <PageHeader
        title="Reconcile"
        description="Cross-platform truth alignment — every event from every source tracked against your accounting system."
        right={
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="btn-secondary disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard
          label="Posted to Books"
          value={data.postedCount}
          sub="Events successfully reconciled"
          trend="up"
        />
        <StatCard
          label="Reconciliation Gaps"
          value={data.failedCount}
          sub={hasIssues ? "Events failed — require attention" : "No unreconciled events"}
          trend={hasIssues ? "down" : "up"}
        />
        <StatCard
          label="Active Connections"
          value={data.connections.length}
          sub="Platforms syncing data"
        />
        <StatCard
          label="Exceptions Queue"
          value={totalExceptions}
          sub={totalExceptions > 0 ? "Require human review" : "All clear"}
          trend={totalExceptions > 0 ? "down" : "up"}
        />
      </div>

      {reconciledTotal > 0 && (
        <div className="card-inset p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold">Overall Reconciliation Health</p>
              <span className={`text-sm font-bold num ${overallPct === 100 ? "num-pos" : overallPct > 80 ? "text-amber-600" : "num-neg"}`}>
                {overallPct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-emerald-500 transition-all duration-700 rounded-full" style={{ width: `${overallPct}%` }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1 border-b pb-0">
        {(["overview", "exceptions", "agent-flags"] as const).map((tab) => {
          const labels: Record<string, string> = {
            overview: "Overview",
            exceptions: `Exceptions${data.exceptions.length > 0 ? ` (${data.exceptions.length})` : ""}`,
            "agent-flags": `Low-Confidence AI Decisions${data.agentExceptions.length > 0 ? ` (${data.agentExceptions.length})` : ""}`,
          }
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card-default overflow-hidden">
            <div className="px-5 py-4 border-b">
              <p className="text-sm font-semibold">Reconciliation by Platform</p>
              <p className="text-xs text-muted-foreground mt-0.5">Event status breakdown per connected source</p>
            </div>
            <div className="divide-y">
              {Object.keys(data.sourceMap).length === 0 ? (
                <EmptyState
                  icon={GitBranch}
                  title="No events ingested yet"
                  description="Connect a platform and run the sync to see reconciliation status."
                  action={{ label: "Connect platform", href: "/connect" }}
                />
              ) : (
                Object.entries(data.sourceMap).map(([source, statuses]) => {
                  const total = Object.values(statuses).reduce((a, b) => a + b, 0)
                  const posted = statuses["POSTED"] ?? 0
                  const failed = statuses["FAILED"] ?? 0
                  const inFlight = total - posted - failed
                  const pct = total > 0 ? Math.round((posted / total) * 100) : 0

                  return (
                    <div key={source} className="px-5 py-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="badge-neutral text-[10px] uppercase tracking-wide font-bold">{source}</span>
                          <span className="text-sm font-semibold">{pct}% reconciled</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{total} total</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                        <div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                        {failed > 0 && (
                          <div className="h-full bg-red-500 transition-all" style={{ width: `${Math.round((failed / total) * 100)}%` }} />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="num-pos">{posted} posted</span>
                        {inFlight > 0 && <span className="text-muted-foreground">{inFlight} in-flight</span>}
                        {failed > 0 && <span className="num-neg">{failed} failed</span>}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="card-default overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <p className="text-sm font-semibold">Sync Activity Log</p>
                <p className="text-xs text-muted-foreground mt-0.5">Most recent push/pull operations</p>
              </div>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {data.syncLogs.length === 0 ? (
                <EmptyState
                  icon={RefreshCw}
                  title="No sync activity yet"
                  description="Sync activity will appear here once agents have run."
                />
              ) : (
                data.syncLogs.map((log) => (
                  <div key={log.id} className="px-5 py-3 flex items-start gap-3 table-row-hover">
                    <div className="shrink-0 mt-1">
                      <ArrowRight
                        className={`h-3.5 w-3.5 ${log.direction === "PUSH" ? "text-primary" : "text-muted-foreground rotate-180"}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium">{log.direction} {log.entityType}</span>
                        <SyncLogStatusBadge status={log.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {log.integrationConnection.provider} · {formatRelative(new Date(log.createdAt))}
                        {log.durationMs != null && ` · ${log.durationMs}ms`}
                      </p>
                      {log.errorMessage && (
                        <p className="text-[11px] text-red-500 truncate">{log.errorMessage}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "exceptions" && (
        <div className="card-default overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-sm font-semibold">Reconciliation Exceptions</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Events that failed, are stuck, or require human review
              </p>
            </div>
          </div>
          {data.exceptions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="No exceptions"
              description="All events are processing normally. No manual review required."
            />
          ) : (
            <div className="divide-y">
              {data.exceptions.map((ex) => {
                const badgeCls = EXCEPTION_STATUS_BADGE[ex.status] ?? "badge-neutral"
                return (
                  <div key={ex.id} className="px-5 py-4 flex items-start gap-4 table-row-hover">
                    <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${ex.status === "FAILED" ? "text-red-500" : "text-amber-500"}`} />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={badgeCls}>{ex.status}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{ex.source}</span>
                        <span className="text-xs text-muted-foreground">{ex.eventType.replace(/_/g, " ")}</span>
                      </div>
                      <p className="text-sm font-medium">
                        {ex.description ?? ex.externalId}
                        {ex.amount != null && (
                          <span className="ml-2 text-muted-foreground">
                            {formatCurrency(ex.amount, ex.currency)}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">{ex.reason}</p>
                      <p className="text-[11px] text-muted-foreground/70">
                        Updated {formatRelative(new Date(ex.updatedAt))}
                      </p>
                    </div>
                    <Link
                      href={`/staging/${ex.id}`}
                      className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Review <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "agent-flags" && (
        <div className="card-default overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-500" />
            <div>
              <p className="text-sm font-semibold">Low-Confidence AI Decisions</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Decisions made by agents with confidence below 60% — may need human validation
              </p>
            </div>
          </div>
          {data.agentExceptions.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="All decisions high-confidence"
              description="No AI decisions flagged for review in the last 7 days."
            />
          ) : (
            <div className="divide-y">
              {data.agentExceptions.map((ae) => (
                <div key={ae.id} className="px-5 py-4 flex items-start gap-4 table-row-hover">
                  <div className="shrink-0 mt-0.5 flex items-center justify-center h-7 w-7 rounded-full bg-violet-100 dark:bg-violet-950/30">
                    <Zap className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="badge-purple">{ae.agentName} Agent</span>
                      <span className="badge-neutral">{ae.decisionType}</span>
                      <span className={`text-xs font-semibold ${ae.confidence < 0.4 ? "text-red-500" : "text-amber-600"}`}>
                        {Math.round(ae.confidence * 100)}% confidence
                      </span>
                    </div>
                    {ae.event && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">{ae.event.source}</span> ·{" "}
                        {ae.event.eventType.replace(/_/g, " ")}
                        {ae.event.amount != null && ` · ${formatCurrency(ae.event.amount, ae.event.currency)}`}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground leading-relaxed">{ae.reasoning}</p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {formatRelative(new Date(ae.createdAt))}
                    </p>
                  </div>
                  {ae.financialEventId && (
                    <Link
                      href={`/staging/${ae.financialEventId}`}
                      className="shrink-0 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
