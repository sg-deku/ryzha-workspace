"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Pause, Clock, CheckCircle, XCircle, Zap, Workflow } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  ACTIVE: { label: "Active", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PAUSED: { label: "Paused", className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
}

const EXEC_ICON: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
  FAILED: <XCircle className="h-3.5 w-3.5 text-red-500" />,
  RUNNING: <Clock className="h-3.5 w-3.5 text-blue-500 animate-pulse" />,
}

export function WorkflowsListPage() {
  const router = useRouter()
  const [workflows, setWorkflows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetch("/api/workflow-studio/workflows")
      .then((r) => r.json())
      .then((d) => setWorkflows(d.workflows ?? []))
      .finally(() => setLoading(false))
  }, [])

  const createWorkflow = async () => {
    setCreating(true)
    try {
      const res = await fetch("/api/workflow-studio/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Untitled Workflow" }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push(`/workflow-studio/${data.workflow.id}`)
      } else {
        toast.error(data.error || "Failed to create workflow")
      }
    } catch {
      toast.error("Failed to create workflow")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Studio</h1>
          <p className="text-muted-foreground mt-1">Design, automate, and monitor integration workflows between Ryzha and your connected systems.</p>
        </div>
        <Button onClick={createWorkflow} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          New Workflow
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-xl border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed bg-muted/20 gap-4">
          <div className="p-4 rounded-full bg-primary/10">
            <Workflow className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-lg">No workflows yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first workflow to start automating integrations.</p>
          </div>
          <Button onClick={createWorkflow} disabled={creating}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((wf) => {
            const lastExec = wf.executions?.[0]
            const badge = STATUS_BADGE[wf.status] ?? STATUS_BADGE.DRAFT
            return (
              <button
                key={wf.id}
                onClick={() => router.push(`/workflow-studio/${wf.id}`)}
                className="text-left rounded-xl border bg-card hover:shadow-md hover:border-primary/40 transition-all p-5 flex flex-col gap-3 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <span className={cn("text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", badge.className)}>
                    {badge.label}
                  </span>
                </div>

                <div>
                  <p className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">{wf.name}</p>
                  {wf.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{wf.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 mt-auto pt-2 border-t text-xs text-muted-foreground">
                  <span>{wf._count?.nodes ?? 0} nodes</span>
                  <span>·</span>
                  <span>{wf._count?.executions ?? 0} runs</span>
                  {lastExec && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        {EXEC_ICON[lastExec.status]}
                        {formatDistanceToNow(new Date(lastExec.startedAt), { addSuffix: true })}
                      </span>
                    </>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
