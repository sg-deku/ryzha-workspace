"use client"

import * as React from "react"
import {
  Zap, Clock, Play, CheckCircle2, XCircle, Loader2, RefreshCw,
  AlertCircle, Calendar, Radio, ArrowRight, Bot,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentLastRun {
  agentKey: string
  lastRunAt: string | null
  lastStatus: "ok" | "error" | "never"
  lastError: string | null
  decisionCount: number
}

interface AgentDef {
  key: string
  name: string
  description: string
  triggerType: "event" | "daily" | "monthly" | "manual"
  triggerLabel: string
  events?: string[]
  section: string
  color: string
}

const AGENTS: AgentDef[] = [
  {
    key: "gl-coding",
    name: "GL Coding Agent",
    description: "Assigns a General Ledger account code to every ingested event using AI classification.",
    triggerType: "event",
    triggerLabel: "On event ingestion",
    events: ["PAYMENT_RECEIVED", "INVOICE_PAID", "EXPENSE_CREATED"],
    section: "Core Pipeline",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  },
  {
    key: "revenue",
    name: "Revenue Agent",
    description: "Applies ASC 606 / IFRS 15 recognition policy and pushes a journal entry to the connected ERP.",
    triggerType: "event",
    triggerLabel: "After GL coding",
    events: ["PAYMENT_RECEIVED", "INVOICE_PAID"],
    section: "Core Pipeline",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  {
    key: "cash",
    name: "Cash Agent",
    description: "Reconciles bank feed against card transactions and QB cash accounts.",
    triggerType: "daily",
    triggerLabel: "Daily at 02:00 UTC",
    section: "Reconciliation",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
  {
    key: "ap",
    name: "AP Agent",
    description: "3-way match on bills vs purchase orders vs accounts payable. Auto-approves within policy.",
    triggerType: "event",
    triggerLabel: "On BILL_CREATED",
    events: ["BILL_CREATED", "EXPENSE_CREATED"],
    section: "Reconciliation",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  },
  {
    key: "payroll",
    name: "Payroll Agent",
    description: "Reconciles payroll runs against QB payroll expense and department budgets.",
    triggerType: "event",
    triggerLabel: "On PAYROLL_PROCESSED",
    events: ["PAYROLL_PROCESSED"],
    section: "Reconciliation",
    color: "bg-pink-100 text-pink-700 dark:bg-pink-950/30 dark:text-pink-400",
  },
  {
    key: "headcount",
    name: "Headcount Agent",
    description: "Validates headcount records against payroll cost and department P&L budgets.",
    triggerType: "daily",
    triggerLabel: "Daily at 02:00 UTC",
    section: "Reconciliation",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  },
  {
    key: "pipeline",
    name: "Pipeline Agent",
    description: "Reconciles CRM bookings (Salesforce/HubSpot) against billing subscriptions and actual invoiced revenue.",
    triggerType: "daily",
    triggerLabel: "Daily at 02:00 UTC",
    section: "Reconciliation",
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400",
  },
  {
    key: "commission",
    name: "Commission Agent",
    description: "Calculates commission accruals per sales rep and posts to their cost centre.",
    triggerType: "event",
    triggerLabel: "After Revenue Agent",
    events: ["PAYMENT_RECEIVED", "INVOICE_PAID"],
    section: "Reconciliation",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  },
  {
    key: "fx",
    name: "FX Agent",
    description: "Revalues foreign currency positions using daily FX rates and posts revaluation journal entries.",
    triggerType: "daily",
    triggerLabel: "Daily at 02:00 UTC",
    section: "Reconciliation",
    color: "bg-teal-100 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
  },
  {
    key: "anomaly",
    name: "Anomaly Agent",
    description: "Cross-system pattern analysis — flags statistical outliers and unusual events across all connected platforms.",
    triggerType: "event",
    triggerLabel: "On every sync",
    section: "Intelligence",
    color: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  },
  {
    key: "collections",
    name: "Collections Agent",
    description: "Scores AR aging buckets and drafts dunning sequences for overdue invoices.",
    triggerType: "daily",
    triggerLabel: "Daily at 02:00 UTC",
    section: "Intelligence",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  },
  {
    key: "fpna",
    name: "FP&A Agent",
    description: "Builds a 13-week rolling cash forecast, burn rate, runway, and budget variance analysis.",
    triggerType: "daily",
    triggerLabel: "Daily at 02:00 UTC",
    section: "Intelligence",
    color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  },
  {
    key: "close",
    name: "Close Agent",
    description: "Executes the month-end close checklist: prepayments, accruals, depreciation, FX revaluation, intercompany eliminations.",
    triggerType: "monthly",
    triggerLabel: "1st of each month at 00:01 UTC",
    section: "Month-End",
    color: "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
  },
  {
    key: "compliance",
    name: "Compliance Agent",
    description: "Validates revenue recognition against the configured policy and checks for accounting standard adherence.",
    triggerType: "monthly",
    triggerLabel: "1st of each month at 00:01 UTC",
    section: "Month-End",
    color: "bg-stone-100 text-stone-700 dark:bg-stone-950/30 dark:text-stone-400",
  },
  {
    key: "board-report",
    name: "Board Report Agent",
    description: "Drafts the monthly financial commentary with variance explanations, risk flags, and forward scenarios.",
    triggerType: "manual",
    triggerLabel: "Manual only",
    section: "Month-End",
    color: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/30 dark:text-fuchsia-400",
  },
]

const SECTIONS = Array.from(new Set(AGENTS.map((a) => a.section)))

const TRIGGER_CFG = {
  event:   { icon: Radio,    label: "Event-driven", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400" },
  daily:   { icon: Calendar, label: "Scheduled daily", dot: "bg-blue-500", text: "text-blue-700 dark:text-blue-400" },
  monthly: { icon: Clock,    label: "Scheduled monthly", dot: "bg-violet-500", text: "text-violet-700 dark:text-violet-400" },
  manual:  { icon: Play,     label: "Manual only", dot: "bg-muted-foreground", text: "text-muted-foreground" },
}

function TriggerBadge({ type }: { type: AgentDef["triggerType"] }) {
  const cfg = TRIGGER_CFG[type]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted ${cfg.text}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

function StatusDot({ status }: { status: "ok" | "error" | "never" }) {
  const map = {
    ok:    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />,
    error: <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />,
    never: <span className="h-2 w-2 rounded-full bg-muted-foreground/30 shrink-0" />,
  }
  return map[status]
}

function fmt(iso: string | null): string {
  if (!iso) return "Never run"
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function AgentCard({
  agent,
  run,
}: {
  agent: AgentDef
  run: AgentLastRun | undefined
}) {
  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<string | null>(null)
  const [resultOk, setResultOk] = React.useState(true)

  async function trigger() {
    setRunning(true)
    setResult(null)
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agent.key }),
      })
      const json = await res.json()
      if (!res.ok) { setResultOk(false); setResult(json.error ?? "Failed") }
      else { setResultOk(true); setResult("Completed successfully") }
    } catch { setResultOk(false); setResult("Network error") }
    finally { setRunning(false) }
  }

  const status = run?.lastStatus ?? "never"
  const lastRan = run?.lastRunAt ?? null

  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col gap-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${agent.color}`}>
            <Bot className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">{agent.name}</p>
            <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{agent.description}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TriggerBadge type={agent.triggerType} />
        {agent.events && (
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            {agent.events.join(" · ")}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <span className="text-[11px] text-muted-foreground">
            {status === "error"
              ? <span className="text-red-500">Failed · {fmt(lastRan)}</span>
              : status === "ok"
              ? <span>OK · {fmt(lastRan)}</span>
              : <span>Never run</span>
            }
          </span>
          {run && run.decisionCount > 0 && (
            <span className="text-[10px] text-muted-foreground/50">· {run.decisionCount} decisions</span>
          )}
        </div>

        <button
          onClick={trigger}
          disabled={running}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors disabled:opacity-60"
        >
          {running
            ? <Loader2 className="h-3 w-3 animate-spin" />
            : <Play className="h-3 w-3" />
          }
          {running ? "Running…" : "Run now"}
        </button>
      </div>

      {result && (
        <p className={`text-[11px] font-medium ${resultOk ? "text-emerald-600" : "text-red-500"}`}>
          {resultOk ? <CheckCircle2 className="inline h-3 w-3 mr-1" /> : <XCircle className="inline h-3 w-3 mr-1" />}
          {result}
        </p>
      )}
    </div>
  )
}

export default function AgentsPage() {
  const [agentRuns, setAgentRuns] = React.useState<AgentLastRun[]>([])
  const [loading, setLoading] = React.useState(true)
  const [refreshing, setRefreshing] = React.useState(false)

  async function loadRuns(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/agents/status")
      if (res.ok) setAgentRuns(await res.json())
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  React.useEffect(() => { loadRuns() }, [])

  const runMap = Object.fromEntries(agentRuns.map((r) => [r.agentKey, r]))

  const eventCount = AGENTS.filter((a) => a.triggerType === "event").length
  const scheduledCount = AGENTS.filter((a) => a.triggerType !== "event" && a.triggerType !== "manual").length
  const okCount = agentRuns.filter((r) => r.lastStatus === "ok").length
  const errorCount = agentRuns.filter((r) => r.lastStatus === "error").length

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-semibold tracking-tight">Agents</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Trigger agents manually or monitor their automated runs. Event-driven agents fire automatically on connected platform activity.
          </p>
        </div>
        <button
          onClick={() => loadRuns(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border hover:bg-muted transition-colors disabled:opacity-60 shrink-0"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Agents", value: AGENTS.length },
          { label: "Event-Driven", value: eventCount, sub: "fire on ingest" },
          { label: "Scheduled", value: scheduledCount, sub: "daily / monthly" },
          { label: "Ran OK", value: loading ? "—" : okCount, sub: errorCount > 0 ? `${errorCount} errored` : "all healthy", highlight: errorCount > 0 },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card px-5 py-4 space-y-1">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.highlight ? "text-red-500" : ""}`}>{s.value}</p>
            {s.sub && <p className="text-[11px] text-muted-foreground">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40 px-5 py-4 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
          <span className="font-semibold">Event-driven agents</span> run automatically when events are ingested from connected platforms.{" "}
          <span className="font-semibold">Scheduled agents</span> run on the daily and monthly cron. Use "Run now" to trigger any agent on demand.
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/50" />
        </div>
      ) : (
        <div className="space-y-8">
          {SECTIONS.map((section) => {
            const agents = AGENTS.filter((a) => a.section === section)
            return (
              <div key={section} className="space-y-3">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">{section}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {agents.map((agent) => (
                    <AgentCard key={agent.key} agent={agent} run={runMap[agent.key]} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
