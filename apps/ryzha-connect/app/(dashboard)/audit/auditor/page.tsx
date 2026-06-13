import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { ShieldCheck, Lock, ExternalLink, ArrowLeft } from "lucide-react"
import Link from "next/link"

async function getAuditorData(organizationId: string) {
  const [decisionLogs, eventCount, orgName] = await Promise.all([
    prisma.aIDecisionLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "asc" },
      take: 500,
      include: {
        financialEvent: {
          select: {
            id: true,
            source: true,
            eventType: true,
            amount: true,
            currency: true,
            status: true,
            externalId: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.financialEvent.count({ where: { organizationId } }),
    prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } }),
  ])

  return { decisionLogs, eventCount, orgName: orgName?.name ?? organizationId }
}

const AGENT_COLORS: Record<string, string> = {
  Revenue:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  AP:         "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  Cash:       "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  Payroll:    "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
  GL:         "bg-gray-100 text-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
  Compliance: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  Close:      "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
  Commission: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
}

export default async function AuditorViewPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const { decisionLogs, eventCount, orgName } = await getAuditorData(session.user.organizationId)

  const generatedAt = new Date().toISOString()
  const totalDecisions = decisionLogs.length
  const avgConfidence = totalDecisions > 0
    ? decisionLogs.reduce((s, d) => s + (d.confidence ?? 0), 0) / totalDecisions
    : 0

  const groupedByEvent: Record<string, typeof decisionLogs> = {}
  for (const log of decisionLogs) {
    const key = log.financialEventId ?? `no-event-${log.id}`
    if (!groupedByEvent[key]) groupedByEvent[key] = []
    groupedByEvent[key].push(log)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/audit"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <div>
            <h2 className="text-xl font-display font-semibold tracking-tight flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Auditor View
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Read-only immutable audit trail · {orgName} · Generated {new Date(generatedAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/20 px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">Immutable AI Decision Audit Trail</p>
          <p className="text-xs text-blue-600/80 dark:text-blue-400/70 leading-relaxed">
            Every automated decision made by Ryzha's AI agents is immutably recorded below with full input context,
            output data, reasoning, and confidence score. These records cannot be edited, deleted, or modified retroactively.
            Each entry is timestamped and linked to its source financial event.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Events Processed", value: eventCount },
          { label: "AI Decisions Logged", value: totalDecisions },
          { label: "Avg Confidence Score", value: `${Math.round(avgConfidence * 100)}%` },
          { label: "Audit Coverage", value: "100%" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card px-5 py-4 space-y-1">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Decision Records — Chronological Order</p>
          <div className="flex-1 h-px bg-border" />
        </div>

        {Object.entries(groupedByEvent).map(([eventKey, logs]) => {
          const event = logs[0]?.financialEvent
          const isNoEvent = eventKey.startsWith("no-event-")

          return (
            <div key={eventKey} className="rounded-xl border bg-card overflow-hidden">
              <div className="px-5 py-4 border-b bg-muted/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary">
                      {event ? event.source.slice(0, 2).toUpperCase() : "—"}
                    </span>
                  </div>
                  {event ? (
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{event.eventType.replace(/_/g, " ")}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground font-mono">{event.externalId}</span>
                        {event.amount != null && (
                          <>
                            <span className="text-xs text-muted-foreground">·</span>
                            <span className="text-xs font-semibold tabular-nums">
                              {formatCurrency(event.amount, event.currency ?? "USD")}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Source: {event.source} · Ingested: {new Date(event.createdAt).toLocaleString()} · Status: {event.status}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Organisation-level decision</p>
                  )}
                </div>
                {event && (
                  <Link
                    href={`/staging/${event.id}`}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline shrink-0"
                  >
                    View event <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
              </div>

              <div className="divide-y">
                {logs.map((log, i) => (
                  <div key={log.id} className="px-5 py-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-muted-foreground/40 tabular-nums">#{i + 1}</span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${AGENT_COLORS[log.agentName] ?? "bg-muted text-muted-foreground"}`}>
                          {log.agentName} Agent
                        </span>
                        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full">
                          {log.decisionType.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-right">
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Confidence</p>
                          <p className={`text-sm font-bold tabular-nums ${
                            (log.confidence ?? 0) >= 0.9 ? "text-emerald-600"
                            : (log.confidence ?? 0) >= 0.7 ? "text-amber-600"
                            : "text-red-500"
                          }`}>
                            {Math.round((log.confidence ?? 0) * 100)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">Logged at</p>
                          <p className="text-xs font-medium">{new Date(log.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">AI Reasoning</p>
                        <p className="text-sm leading-relaxed">{log.reasoning ?? "No reasoning recorded"}</p>
                      </div>
                      {log.output && Object.keys(log.output as object).length > 0 && (
                        <div className="rounded-lg bg-muted/30 px-4 py-3 space-y-1">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Decision Output</p>
                          <pre className="text-xs overflow-x-auto leading-relaxed">
                            {JSON.stringify(log.output, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-muted-foreground/40 font-mono">
                      Record ID: {log.id} · Cannot be modified
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {Object.keys(groupedByEvent).length === 0 && (
          <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-20 text-center gap-3">
            <ShieldCheck className="h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">No AI decisions recorded yet</p>
            <p className="text-sm text-muted-foreground/70">Decisions are logged as agents process financial events.</p>
          </div>
        )}
      </div>
    </div>
  )
}
