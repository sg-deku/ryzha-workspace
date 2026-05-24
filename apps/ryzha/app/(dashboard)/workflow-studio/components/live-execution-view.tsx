"use client"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Square, CheckCircle2, AlertCircle, Clock, TrendingUp, ShieldCheck, BarChart3, Workflow, Circle } from "lucide-react"
import { toast } from "sonner"

const AGENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  Orchestrator: { label: "Workflow Manager",     icon: Workflow,    color: "text-primary bg-primary/10 border-primary/20" },
  "R2R":        { label: "Revenue Recording",    icon: TrendingUp,  color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/40" },
  "O&M":        { label: "Revenue Policy",       icon: BarChart3,   color: "text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/40 dark:border-violet-800/40" },
  Auditor:      { label: "Audit & Verification", icon: ShieldCheck, color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/40" },
  "FP&A":       { label: "Financial Forecast",   icon: TrendingUp,  color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/40" },
}

function parseAgent(log: string): { agent: string; message: string } {
  const match = log.match(/^\[([^\]]+)\]\s*(.*)$/)
  if (match) return { agent: match[1], message: match[2] }
  return { agent: "System", message: log }
}

function isSuccess(msg: string) {
  const l = msg.toLowerCase()
  return l.includes("completed") || l.includes("verified") || l.includes("updated") || l.includes("matched") || l.includes("recorded") || l.includes("applied") || l.includes("done") || l.includes("recalculated") || l.includes("connected")
}
function isError(msg: string) {
  return msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("reject")
}

function agentMeta(agent: string) {
  return AGENT_META[agent] ?? { label: agent, icon: Circle, color: "text-muted-foreground bg-muted border-border" }
}

export function LiveExecutionView({ executionId }: { executionId: string | null }) {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!executionId) return
    setLogs([`[System] Processing started for execution ${executionId}`])
    setStatus("running")

    let intervalId: NodeJS.Timeout

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/workflow-studio/logs?executionId=${executionId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.logs && data.logs.length > 0) {
            setLogs([`[System] Processing started for execution ${executionId}`, ...data.logs])
          }
          if (data.status === "completed" || data.status === "error") {
            setStatus(data.status)
            clearInterval(intervalId)
          }
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
          }
        }
      } catch {}
    }

    intervalId = setInterval(fetchLogs, 1000)
    fetchLogs()
    return () => clearInterval(intervalId)
  }, [executionId])

  const handleStop = async () => {
    if (!executionId) return
    try {
      const res = await fetch("/api/workflow-studio/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executionId }),
      })
      if (res.ok) { toast.success("Workflow stopped"); setStatus("error") }
      else toast.error("Failed to stop workflow")
    } catch { toast.error("Failed to stop workflow") }
  }

  const parsed = logs.map(parseAgent)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle>Processing Activity</CardTitle>
          <CardDescription>
            {executionId ? "Live status of your automated workflow" : "No active workflow. Trigger one below to begin."}
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          {status === "running" && (
            <Badge variant="secondary" className="gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Running
            </Badge>
          )}
          {status === "completed" && <Badge className="bg-emerald-500 hover:bg-emerald-500">All steps complete</Badge>}
          {status === "error" && <Badge variant="destructive">Stopped</Badge>}
          <Button variant="outline" size="sm" disabled={status !== "running" || !executionId} onClick={handleStop} className="gap-1.5">
            <Square className="h-3.5 w-3.5" /> Stop
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 || !executionId ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
            <Workflow className="h-8 w-8 opacity-30" />
            <p className="text-sm">Waiting for a workflow to begin...</p>
          </div>
        ) : (
          <div ref={scrollRef} className="max-h-[420px] overflow-y-auto pr-2">
            <div className="space-y-0">
              {parsed.map((entry, i) => {
                const meta = agentMeta(entry.agent)
                const Icon = meta.icon
                const success = isSuccess(entry.message)
                const error = isError(entry.message)
                const isRunning = status === "running" && i === parsed.length - 1
                const isLast = i === parsed.length - 1
                return (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${meta.color}`}>
                        {isRunning
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Icon className="h-3.5 w-3.5" />
                        }
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border my-1 min-h-[12px]" />}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold">{meta.label}</span>
                        {success && !isRunning && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                        {error && <AlertCircle className="h-3 w-3 text-destructive" />}
                        {!success && !error && !isRunning && <Clock className="h-3 w-3 text-muted-foreground" />}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
