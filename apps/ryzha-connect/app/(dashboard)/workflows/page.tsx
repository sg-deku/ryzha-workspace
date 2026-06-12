"use client"

import * as React from "react"
import { toast } from "sonner"
import { formatRelative } from "@/lib/utils"
import { Workflow, Play, CheckCircle2, XCircle, Clock, ExternalLink, Loader2, RefreshCw } from "lucide-react"

interface WorkflowItem {
  id: string
  name: string
  description: string | null
  status: string
  updatedAt: string
  _count: { executions: number }
}

interface Execution {
  id: string
  status: string
  triggeredBy: string
  startedAt: string
  durationMs: number | null
  workflow: { name: string }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "COMPLETED") return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
  if (status === "FAILED")    return <XCircle className="h-4 w-4 text-red-500" />
  if (status === "RUNNING")   return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
  return <Clock className="h-4 w-4 text-muted-foreground" />
}

function WorkflowCard({
  wf,
  onRun,
}: {
  wf: WorkflowItem
  onRun: (id: string) => Promise<void>
}) {
  const [running, setRunning] = React.useState(false)

  async function handleRun() {
    setRunning(true)
    await onRun(wf.id)
    setRunning(false)
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold truncate">{wf.name}</p>
          {wf.description && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{wf.description}</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
          wf.status === "ACTIVE"
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}>
          {wf.status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{wf._count.executions} runs</span>
        <span>Updated {formatRelative(new Date(wf.updatedAt))}</span>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          disabled={running || wf.status !== "ACTIVE"}
          onClick={handleRun}
          className="flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          {running ? "Running..." : "Run now"}
        </button>
        <a
          href={`/workflow-studio/${wf.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline"
        >
          Edit in Studio →
        </a>
      </div>
    </div>
  )
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = React.useState<WorkflowItem[]>([])
  const [executions, setExecutions] = React.useState<Execution[]>([])
  const [loading, setLoading] = React.useState(true)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/workflows")
      if (res.ok) {
        const data = await res.json()
        setWorkflows(data.workflows ?? [])
        setExecutions(data.recentExecutions ?? [])
      }
    } catch {
      toast.error("Failed to load workflows")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  async function runWorkflow(id: string) {
    try {
      const res = await fetch(`/api/workflows/${id}/run`, { method: "POST" })
      const json = await res.json()
      if (res.ok) {
        toast.success(`Workflow completed in ${json.durationMs}ms`)
        load()
      } else {
        toast.error(json.error ?? "Failed to run workflow")
      }
    } catch {
      toast.error("Network error - could not run workflow")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflows</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Automated agentic workflows that process financial events across your connected platforms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-2 hover:bg-muted transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
          <a
            href="http://localhost:3000/workflow-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors"
          >
            Open Workflow Studio <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-20 gap-4 text-center">
          <Workflow className="h-10 w-10 text-muted-foreground/40" />
          <div>
            <p className="font-semibold">No workflows yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Build workflows in the Workflow Studio to automate financial event processing, approvals, and notifications.
            </p>
          </div>
          <a
            href="http://localhost:3000/workflow-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            Open Workflow Studio →
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workflows.map((wf) => (
            <WorkflowCard key={wf.id} wf={wf} onRun={runWorkflow} />
          ))}
        </div>
      )}

      {executions.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="p-5 border-b">
            <h3 className="font-semibold">Recent Executions</h3>
          </div>
          <div className="divide-y">
            {executions.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <StatusIcon status={ex.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ex.workflow.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {ex.triggeredBy} · {formatRelative(new Date(ex.startedAt))}
                      {ex.durationMs != null && ` · ${(ex.durationMs / 1000).toFixed(1)}s`}
                    </p>
                  </div>
                </div>
                <span className={`text-xs font-medium shrink-0 ${
                  ex.status === "COMPLETED" ? "text-emerald-600" :
                  ex.status === "FAILED"    ? "text-red-500"     :
                  ex.status === "RUNNING"   ? "text-yellow-600"  :
                  "text-muted-foreground"
                }`}>
                  {ex.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
