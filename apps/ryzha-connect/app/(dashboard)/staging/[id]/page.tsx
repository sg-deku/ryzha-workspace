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
  ExternalLink,
  Zap,
  BookOpen,
  CreditCard,
  ArrowUpRight,
  Circle,
  Minus,
} from "lucide-react"
import { ReprocessButton } from "@/components/events/reprocess-button"

async function getEventDetail(id: string, organizationId: string) {
  const [event, qbConn] = await Promise.all([
    (prisma.financialEvent as any).findFirst({
      where: { id, organizationId },
      include: {
        aiDecisionLogs: { orderBy: { createdAt: "asc" } },
        externalRefs: true,
        syncLogs: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { integrationConnection: { select: { provider: true } } },
        },
        approvalRequests: {
          orderBy: { requestedAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.integrationConnection.findUnique({
      where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
      select: { realmId: true },
    }),
  ])
  return { event, qbRealmId: qbConn?.realmId ?? null }
}

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  INGESTED:         { label: "Ingested",          color: "text-blue-600",    dot: "bg-blue-500" },
  PROCESSING:       { label: "Processing",         color: "text-amber-600",   dot: "bg-amber-500" },
  PENDING_APPROVAL: { label: "Pending Approval",   color: "text-orange-600",  dot: "bg-orange-500" },
  APPROVED:         { label: "Approved",           color: "text-sky-600",     dot: "bg-sky-500" },
  PUSHING:          { label: "Pushing to ERP",     color: "text-violet-600",  dot: "bg-violet-500" },
  POSTED:           { label: "Posted",             color: "text-emerald-600", dot: "bg-emerald-500" },
  FAILED:           { label: "Failed",             color: "text-red-600",     dot: "bg-red-500" },
  SKIPPED:          { label: "Skipped",            color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
}

const PIPELINE_STAGES = [
  {
    key: "ingest",
    label: "Ingested from source",
    agentNames: [] as string[],
    decisionTypes: [] as string[],
    icon: Zap,
    description: (ev: any) => `${ev.source} → Ryzha event stream`,
  },
  {
    key: "gl_coding",
    label: "GL Code assigned",
    agentNames: ["GLCoding", "GL Coding"],
    decisionTypes: ["GL_CODE"],
    icon: BookOpen,
    description: () => "Revenue account mapped by AI",
  },
  {
    key: "rev_rec",
    label: "Revenue recognised",
    agentNames: ["Revenue"],
    decisionTypes: ["REV_REC"],
    icon: CheckCircle2,
    description: () => "ASC 606 / IFRS 15 policy applied",
  },
  {
    key: "erp_push",
    label: "Journal entry forwarded to ERP",
    agentNames: [] as string[],
    decisionTypes: [] as string[],
    icon: ArrowUpRight,
    description: () => "Double-entry pushed to QuickBooks",
  },
]

function getStripeUrl(externalId: string, isSandbox = true): string {
  const base = isSandbox
    ? "https://dashboard.stripe.com/test"
    : "https://dashboard.stripe.com"
  if (externalId.startsWith("pi_")) return `${base}/payments/${externalId}`
  if (externalId.startsWith("in_")) return `${base}/invoices/${externalId}`
  if (externalId.startsWith("ch_")) return `${base}/payments/${externalId}`
  return `${base}/search?query=${externalId}`
}

function getQBUrl(externalId: string, realmId: string | null, isSandbox = true): string {
  const base = isSandbox ? "https://sandbox.qbo.intuit.com" : "https://app.qbo.intuit.com"
  const company = realmId ? `&companyId=${realmId}` : ""
  return `${base}/app/journal?txnId=${externalId}${company}`
}

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? { label: status, color: "text-muted-foreground", dot: "bg-muted-foreground/40" }
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${meta.color}`}>
      <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

function Field({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="py-2.5 flex items-start justify-between gap-4 border-b last:border-0">
      <p className="text-xs text-muted-foreground shrink-0 pt-0.5">{label}</p>
      <div className={`text-sm font-medium text-right break-all ${mono ? "font-mono text-xs" : ""}`}>
        {value ?? <span className="text-muted-foreground/40">—</span>}
      </div>
    </div>
  )
}

function StageDot({ state }: { state: "done" | "active" | "skipped" | "pending" }) {
  if (state === "done")    return <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0"><CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /></div>
  if (state === "skipped") return <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0"><Minus className="h-4 w-4 text-muted-foreground" /></div>
  if (state === "active")  return <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0"><Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" /></div>
  return <div className="h-8 w-8 rounded-full border-2 border-dashed border-border flex items-center justify-center shrink-0"><Circle className="h-3.5 w-3.5 text-muted-foreground/30" /></div>
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { id } = await params
  const { event, qbRealmId } = await getEventDetail(id, session.user.organizationId)
  if (!event) notFound()

  const normalised = (event.normalisedData ?? {}) as Record<string, unknown>
  const rawPayload  = (event.rawPayload ?? {}) as Record<string, unknown>

  const isStripe   = event.source?.toLowerCase() === "stripe"
  const isSandbox  = true

  const qbRef = (event.externalRefs ?? []).find(
    (r: any) => r.provider === "QUICKBOOKS" && r.entityType === "JOURNAL_ENTRY"
  )

  const decisionLogs: any[] = event.aiDecisionLogs ?? []

  function findLog(stage: typeof PIPELINE_STAGES[number]) {
    return decisionLogs.find(
      (l: any) =>
        stage.agentNames.includes(l.agentName) ||
        stage.decisionTypes.includes(l.decisionType)
    ) ?? null
  }

  const revLog   = decisionLogs.find((l: any) => l.decisionType === "REV_REC")
  const glLog    = decisionLogs.find((l: any) => l.decisionType === "GL_CODE")
  const revOutput = (revLog?.output ?? {}) as Record<string, unknown>
  const glOutput  = (glLog?.output ?? {}) as Record<string, unknown>

  const erpWasAttempted = revOutput.accountingProvider != null

  function stageState(stage: typeof PIPELINE_STAGES[number]): "done" | "active" | "skipped" | "pending" {
    if (stage.key === "ingest") return "done"
    if (stage.key === "erp_push") {
      if (qbRef) return "done"
      if (event.status === "POSTED" && !erpWasAttempted) return "skipped"
      if (event.status === "POSTED" && erpWasAttempted) return "active"
      return "pending"
    }
    const log = findLog(stage)
    if (log) return "done"
    if (event.status === "POSTED" || event.status === "FAILED") return "skipped"
    return "pending"
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/staging"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Staging Queue
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">
              {event.eventType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
            </h2>
            <StatusPill status={event.status} />
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {event.amount != null && (
              <span className="font-semibold text-foreground text-lg tabular-nums mr-2">
                {formatCurrency(event.amount, event.currency)}
              </span>
            )}
            <span className="font-mono text-xs">{event.id}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>Ingested {new Date(event.createdAt).toLocaleString()}</span>
          {event.updatedAt && event.updatedAt !== event.createdAt && (
            <><span>·</span><span>Updated {new Date(event.updatedAt).toLocaleString()}</span></>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3.5 border-b bg-muted/20 flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Agentic Processing Pipeline</p>
          <span className="ml-auto text-xs text-muted-foreground">{decisionLogs.length} agent decision{decisionLogs.length !== 1 ? "s" : ""} recorded</span>
        </div>
        <div className="p-5 space-y-0">
          {PIPELINE_STAGES.map((stage, i) => {
            const state   = stageState(stage)
            const log     = findLog(stage)
            const isLast  = i === PIPELINE_STAGES.length - 1
            const Icon    = stage.icon

            let detail: React.ReactNode = null
            if (stage.key === "ingest") {
              detail = (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Source</span>
                  <span className="font-mono font-medium">{event.source}</span>
                  <span className="text-muted-foreground">External ID</span>
                  <span className="font-mono">{event.externalId}</span>
                  <span className="text-muted-foreground">Ingested</span>
                  <span>{new Date(event.createdAt).toLocaleString()}</span>
                </div>
              )
            } else if (stage.key === "gl_coding" && glLog) {
              detail = (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                  <span className="text-muted-foreground">GL Account</span>
                  <span className="font-mono font-medium">{String(glOutput.glAccount ?? glOutput.accountCode ?? "—")}</span>
                  <span className="text-muted-foreground">Confidence</span>
                  <span>{glLog.confidence != null ? `${Math.round(glLog.confidence * 100)}%` : "—"}</span>
                  <span className="text-muted-foreground">Reasoning</span>
                  <span className="text-foreground/70 col-span-2 leading-relaxed pt-0.5">{glLog.reasoning}</span>
                </div>
              )
            } else if (stage.key === "rev_rec" && revLog) {
              detail = (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                  <span className="text-muted-foreground">Policy</span>
                  <span className="font-medium capitalize">{String(revOutput.revenuePolicy ?? revOutput.policy ?? "ratable")}</span>
                  <span className="text-muted-foreground">Recognised</span>
                  <span className="font-semibold text-emerald-600">{revOutput.recognised != null ? formatCurrency(revOutput.recognised as number, event.currency) : "—"}</span>
                  <span className="text-muted-foreground">Deferred</span>
                  <span>{revOutput.deferred != null ? formatCurrency(revOutput.deferred as number, event.currency) : "—"}</span>
                  <span className="text-muted-foreground">Reasoning</span>
                  <span className="text-foreground/70 col-span-2 leading-relaxed pt-0.5">{revLog.reasoning}</span>
                </div>
              )
            } else if (stage.key === "erp_push" && qbRef) {
              detail = (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
                  <span className="text-muted-foreground">ERP</span>
                  <span className="font-medium">QuickBooks Online</span>
                  <span className="text-muted-foreground">Journal Entry ID</span>
                  <span className="font-mono">{qbRef.externalId}</span>
                  <span className="text-muted-foreground">Pushed at</span>
                  <span>{new Date(qbRef.pushedAt).toLocaleString()}</span>
                </div>
              )
            }

            return (
              <div key={stage.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <StageDot state={state} />
                  {!isLast && <div className="w-px flex-1 bg-border my-1 min-h-[16px]" />}
                </div>
                <div className={`flex-1 pb-5 ${isLast ? "" : ""}`}>
                  <div className="flex items-center gap-2 mb-1 min-h-8">
                    <Icon className={`h-3.5 w-3.5 shrink-0 ${state === "done" ? "text-emerald-600" : state === "skipped" ? "text-muted-foreground" : "text-muted-foreground/40"}`} />
                    <p className={`text-sm font-semibold ${state === "pending" ? "text-muted-foreground/50" : ""}`}>
                      {stage.label}
                    </p>
                    {state === "skipped" && <span className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">skipped</span>}
                    {log?.createdAt && (
                      <span className="ml-auto text-[11px] text-muted-foreground shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {detail && (
                    <div className="ml-0 mt-2 rounded-lg bg-muted/30 border border-border/50 px-4 py-3">
                      {detail}
                    </div>
                  )}
                  {!detail && state === "pending" && (
                    <p className="text-xs text-muted-foreground/50 italic">{stage.description(event)}</p>
                  )}
                  {!detail && state === "done" && stage.key !== "ingest" && (
                    <p className="text-xs text-muted-foreground">{stage.description(event)}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Source Payment</p>
            </div>
            {isStripe && (
              <a
                href={getStripeUrl(event.externalId, isSandbox)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View in Stripe <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="px-5 divide-y">
            <Field label="Platform"    value={<span className="uppercase font-mono text-xs">{event.source}</span>} />
            <Field label="External ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{event.externalId}</code>} mono />
            <Field label="Amount"      value={<span className="font-semibold tabular-nums">{event.amount != null ? formatCurrency(event.amount, event.currency) : "—"}</span>} />
            <Field label="Currency"    value={event.currency} />
            {normalised.customerEmail != null && <Field label="Customer" value={String(normalised.customerEmail)} />}
            {normalised.customerId    != null && <Field label="Customer ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{String(normalised.customerId)}</code>} mono />}
            {normalised.invoiceNumber != null && <Field label="Invoice #" value={String(normalised.invoiceNumber)} />}
            {normalised.description   != null && <Field label="Description" value={String(normalised.description)} />}
            <Field label="Ingested"    value={new Date(event.createdAt).toLocaleString()} />
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-3.5 border-b bg-muted/20">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">ERP Journal Entry</p>
            </div>
            {qbRef && (
              <a
                href={qbRef.externalUrl ?? getQBUrl(qbRef.externalId, qbRealmId, isSandbox)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View in QuickBooks <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="px-5 divide-y">
            {qbRef ? (
              <>
                <Field label="Provider"         value="QuickBooks Online" />
                <Field label="Journal Entry ID" value={<code className="text-xs bg-muted px-1.5 py-0.5 rounded">{qbRef.externalId}</code>} mono />
                <Field label="Entity Type"      value={qbRef.entityType} />
                <Field label="Pushed at"        value={new Date(qbRef.pushedAt).toLocaleString()} />
                {revOutput.recognised != null && (
                  <>
                    <Field
                      label="DR  Cash / Bank"
                      value={<span className="tabular-nums font-semibold">{formatCurrency(event.amount, event.currency)}</span>}
                    />
                    <Field
                      label="CR  Revenue (recognised)"
                      value={<span className="tabular-nums text-emerald-600">{formatCurrency(revOutput.recognised as number, event.currency)}</span>}
                    />
                    {(revOutput.deferred as number) > 0 && (
                      <Field
                        label="CR  Deferred Revenue"
                        value={<span className="tabular-nums text-amber-600">{formatCurrency(revOutput.deferred as number, event.currency)}</span>}
                      />
                    )}
                  </>
                )}
              </>
            ) : (
              <div className="py-10 flex flex-col items-center justify-center gap-3 text-center">
                <div className={`h-9 w-9 rounded-full flex items-center justify-center ${erpWasAttempted ? "bg-amber-50 dark:bg-amber-950/30" : "bg-muted"}`}>
                  {erpWasAttempted
                    ? <AlertCircle className="h-4 w-4 text-amber-500" />
                    : <Clock className="h-4 w-4 text-muted-foreground" />
                  }
                </div>
                <p className="text-sm font-medium">
                  {erpWasAttempted
                    ? "GL accounts could not be resolved"
                    : event.status === "POSTED"
                    ? "No accounting system connected"
                    : event.status === "FAILED"
                    ? "Push to ERP failed"
                    : "Pending Revenue Agent run"
                  }
                </p>
                <p className="text-xs text-muted-foreground/60 max-w-xs">
                  {erpWasAttempted
                    ? "Revenue Agent ran but couldn't match cash/revenue accounts from the Chart of Accounts. Click Reprocess to retry with the current COA."
                    : event.status === "INGESTED"
                    ? "Run the Revenue Agent from Settings → Agents"
                    : "Connect QuickBooks to enable automatic journal entry push"
                  }
                </p>
                {(erpWasAttempted || event.status === "POSTED" || event.status === "FAILED") && (
                  <ReprocessButton eventId={event.id} />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {event.approvalRequests?.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b bg-muted/20">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-semibold">Approval History</p>
          </div>
          <div className="divide-y">
            {event.approvalRequests.map((approval: any) => (
              <div key={approval.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {approval.status === "APPROVED"
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    : approval.status === "REJECTED"
                    ? <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                    : <Clock className="h-4 w-4 text-amber-500 shrink-0" />}
                  <div>
                    <p className="text-sm font-medium">{approval.status.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested by {approval.requestedBy}
                      {approval.decidedAt ? ` · Decided ${new Date(approval.decidedAt).toLocaleString()}` : " · Pending"}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(approval.requestedAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <details className="rounded-xl border bg-card overflow-hidden group">
        <summary className="flex items-center gap-2 px-5 py-3.5 cursor-pointer select-none hover:bg-muted/20 transition-colors">
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm font-semibold">Raw Payload</p>
          <span className="ml-auto text-xs text-muted-foreground group-open:hidden">Show</span>
          <span className="ml-auto text-xs text-muted-foreground hidden group-open:inline">Hide</span>
        </summary>
        <div className="border-t p-5">
          <pre className="text-xs bg-muted rounded-lg p-4 overflow-x-auto max-h-80 text-foreground/70 leading-relaxed">
            {JSON.stringify(rawPayload, null, 2)}
          </pre>
        </div>
      </details>
    </div>
  )
}
