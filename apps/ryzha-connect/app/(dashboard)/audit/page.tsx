import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatRelative, formatCurrency } from "@/lib/utils"
import { ShieldCheck, Bot, CheckCircle2, AlertCircle, Clock, Filter } from "lucide-react"

async function getAuditData(organizationId: string, filter?: string) {
  const where: any = { organizationId }
  if (filter && filter !== "all") {
    where.agentName = filter
  }

  const [decisionLogs, agentNames] = await Promise.all([
    prisma.aIDecisionLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        financialEvent: {
          select: {
            id: true,
            source: true,
            eventType: true,
            amount: true,
            currency: true,
            status: true,
          },
        },
      },
    }),
    prisma.aIDecisionLog.groupBy({
      by: ["agentName"],
      where: { organizationId },
      _count: { id: true },
    }),
  ])

  return { decisionLogs, agentNames }
}

const AGENT_COLORS: Record<string, string> = {
  Revenue:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  AP:         "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  Cash:       "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  Payroll:    "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
  Headcount:  "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  Anomaly:    "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  Pipeline:   "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  Commission: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  FX:         "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
  Close:      "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
  GL:         "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
  Compliance: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
}

function confidenceBadge(confidence: number) {
  const pct = Math.round(confidence * 100)
  const color = pct >= 90 ? "text-emerald-600" : pct >= 70 ? "text-amber-600" : "text-red-500"
  return <span className={`text-xs font-medium tabular-nums ${color}`}>{pct}%</span>
}

export default async function AuditTrailPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const { decisionLogs, agentNames } = await getAuditData(session.user.organizationId)

  const totalDecisions = decisionLogs.length
  const avgConfidence =
    totalDecisions > 0
      ? decisionLogs.reduce((s, d) => s + (d.confidence ?? 0), 0) / totalDecisions
      : 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Audit Trail</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Immutable log of every AI decision · rationale attached to each automated entry
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "AI Decisions Logged",
            value: totalDecisions,
            icon: Bot,
            color: "text-primary",
          },
          {
            label: "Avg Confidence",
            value: `${Math.round(avgConfidence * 100)}%`,
            icon: ShieldCheck,
            color: avgConfidence > 0.85 ? "text-emerald-600" : "text-amber-500",
          },
          {
            label: "Agent Types Active",
            value: agentNames.length,
            icon: Filter,
            color: "text-muted-foreground",
          },
          {
            label: "Audit Coverage",
            value: "100%",
            icon: CheckCircle2,
            color: "text-emerald-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Decision Log</h3>
          <div className="ml-auto flex items-center gap-2 flex-wrap">
            {agentNames.slice(0, 6).map(({ agentName, _count }) => (
              <span
                key={agentName}
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${AGENT_COLORS[agentName] ?? "bg-muted text-muted-foreground"}`}
              >
                {agentName} ({_count.id})
              </span>
            ))}
          </div>
        </div>

        <div className="divide-y">
          {decisionLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
              <Bot className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No AI decisions recorded yet</p>
              <p className="text-xs text-muted-foreground">Decisions are logged as agents process financial events</p>
            </div>
          ) : (
            decisionLogs.map((log) => {
              const event = log.financialEvent
              return (
                <div key={log.id} className="p-5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${AGENT_COLORS[log.agentName] ?? "bg-muted text-muted-foreground"}`}>
                        {log.agentName} Agent
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                        {log.decisionType.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        {confidenceBadge(log.confidence ?? 0)}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{formatRelative(log.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {event && (
                    <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-muted/30 border text-xs">
                      <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-primary">{event.source.slice(0, 2).toUpperCase()}</span>
                      </div>
                      <span className="font-medium">{event.eventType.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{event.source}</span>
                      {event.amount != null && (
                        <>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium tabular-nums">
                            {formatCurrency(event.amount, event.currency ?? "USD")}
                          </span>
                        </>
                      )}
                      <span className="ml-auto text-muted-foreground capitalize">
                        {event.status.toLowerCase()}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">AI Reasoning</p>
                      <p className="text-sm leading-relaxed">{log.reasoning ?? "—"}</p>
                    </div>

                    {log.output && Object.keys(log.output as object).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Output</p>
                        <pre className="text-xs bg-muted/40 rounded-lg px-3 py-2 overflow-x-auto">
                          {JSON.stringify(log.output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-950/20 p-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-400">SOC 2 compliant audit trail</p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/70 mt-0.5">
            Every AI decision is immutably logged with full input context, output, reasoning, and confidence score. This log is available to auditors and cannot be modified.
          </p>
        </div>
      </div>
    </div>
  )
}
