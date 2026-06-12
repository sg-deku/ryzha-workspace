import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect, notFound } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Bot,
  ArrowRight,
  FileText,
} from "lucide-react"

interface EventDetail {
  id: string
  organizationId: string
  source: string
  eventType: string
  externalId: string
  status: string
  amount: number | null
  currency: string
  normalisedData: unknown
  rawPayload: unknown
  createdAt: Date
  updatedAt: Date
  aiDecisionLogs: {
    id: string
    agentName: string
    decisionType: string
    confidence: number | null
    reasoning: string | null
    output: unknown
    createdAt: Date
  }[]
  approvalRequests: {
    id: string
    status: string
    requestedBy: string
    requestedAt: Date
    decidedAt: Date | null
  }[]
  syncLogs: {
    id: string
    direction: string
    entityType: string
    status: string
    durationMs: number | null
    errorMessage: string | null
    createdAt: Date
    integrationConnection: { provider: string }
  }[]
}

async function getEventDetail(id: string, organizationId: string): Promise<EventDetail | null> {
  const event = await (prisma.financialEvent as any).findFirst({
    where: { id, organizationId },
    include: {
      aiDecisionLogs: { orderBy: { createdAt: "desc" } },
      syncLogs: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { integrationConnection: { select: { provider: true } } },
      },
      approvalRequests: { orderBy: { requestedAt: "desc" }, take: 5 },
    },
  })
  return event as EventDetail | null
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    INGESTED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    PROCESSING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    PENDING_APPROVAL: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    APPROVED: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    PUSHING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    POSTED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    FAILED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    SKIPPED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? ""}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

function SectionCard({ title, icon: Icon, children }: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center gap-2 p-5 border-b">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 border-b last:border-0 px-5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium break-all">{value ?? <span className="text-muted-foreground/50">-</span>}</div>
    </div>
  )
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id } = await params
  const event = await getEventDetail(id, session.user.organizationId)

  if (!event) notFound()

  const normalised = (event.normalisedData ?? {}) as Record<string, unknown>
  const rawPayload = (event.rawPayload ?? {}) as Record<string, unknown>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link
          href="/staging"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Staging Queue
        </Link>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{event.eventType.replace(/_/g, " ")}</h2>
          <p className="text-muted-foreground text-sm mt-1 font-mono">{event.id}</p>
        </div>
        <StatusBadge status={event.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Event Details" icon={FileText}>
          <Field label="Source" value={<code className="text-xs bg-muted px-2 py-0.5 rounded">{event.source}</code>} />
          <Field label="Event Type" value={event.eventType} />
          <Field label="External ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{event.externalId}</code>} />
          <Field
            label="Amount"
            value={event.amount != null ? (
              <span className="text-lg font-bold tabular-nums">
                {formatCurrency(event.amount, event.currency)}
              </span>
            ) : null}
          />
          <Field label="Currency" value={event.currency} />
          <Field label="Created" value={new Date(event.createdAt).toLocaleString()} />
          <Field label="Updated" value={new Date(event.updatedAt).toLocaleString()} />
        </SectionCard>

        <SectionCard title="Normalised Data" icon={CheckCircle2}>
          {Object.keys(normalised).length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No normalised data</p>
          ) : (
            Object.entries(normalised).map(([k, v]) => (
              <Field key={k} label={k} value={String(v ?? "-")} />
            ))
          )}
        </SectionCard>
      </div>

      {event.aiDecisionLogs.length > 0 && (
        <SectionCard title="AI Agent Decisions" icon={Bot}>
          <div className="divide-y">
            {event.aiDecisionLogs.map((log) => (
              <div key={log.id} className="px-5 py-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                      {log.agentName}
                    </span>
                    <span className="text-xs text-muted-foreground">{log.decisionType}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.confidence != null && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(log.confidence * 100)}% confidence
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {log.reasoning && (
                  <p className="text-sm text-foreground/80">{log.reasoning}</p>
                )}
                {log.output != null && (
                  <pre className="text-xs bg-muted rounded-lg p-3 overflow-x-auto max-h-40">
                    {JSON.stringify(log.output as Record<string, unknown>, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {event.approvalRequests.length > 0 && (
        <SectionCard title="Approval History" icon={CheckCircle2}>
          <div className="divide-y">
            {event.approvalRequests.map((approval) => (
              <div key={approval.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {approval.status === "APPROVED" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : approval.status === "REJECTED" ? (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-yellow-500 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{approval.status}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested by {approval.requestedBy}
                      {approval.decidedAt ? ` · Decided ${new Date(approval.decidedAt).toLocaleDateString()}` : ""}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(approval.requestedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {event.syncLogs.length > 0 && (
        <SectionCard title="Sync Activity" icon={ArrowRight}>
          <div className="divide-y">
            {event.syncLogs.map((log) => (
              <div key={log.id} className="px-5 py-3 flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <ArrowRight
                    className={`h-3.5 w-3.5 ${log.direction === "PUSH" ? "text-primary" : "text-muted-foreground rotate-180"}`}
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{log.direction} {log.entityType}</span>
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {log.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.integrationConnection.provider} · {new Date(log.createdAt).toLocaleString()}
                    {log.durationMs != null && ` · ${log.durationMs}ms`}
                  </p>
                  {log.errorMessage && (
                    <p className="text-xs text-red-500">{log.errorMessage}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {Object.keys(rawPayload).length > 0 && (
        <SectionCard title="Raw Payload" icon={AlertCircle}>
          <div className="p-5">
            <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto max-h-80 text-foreground/70">
              {JSON.stringify(rawPayload, null, 2)}
            </pre>
          </div>
        </SectionCard>
      )}
    </div>
  )
}
