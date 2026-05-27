"use client"
import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Square, CheckCircle2, AlertCircle, Clock, TrendingUp, ShieldCheck, BarChart3, Workflow, Circle } from "lucide-react"
import { toast } from "sonner"

interface RichLog {
  agent: string
  message: string
  timestamp: string
}

interface AgentGroup {
  agent: string
  messages: { message: string; timestamp: string }[]
  firstTs: string
}

const AGENT_META: Record<string, {
  label: string
  icon: React.ElementType
  accent: string
  iconBg: string
  iconText: string
}> = {
  Orchestrator: {
    label: "Workflow Manager",
    icon: Workflow,
    accent: "border-l-primary",
    iconBg: "bg-primary/10",
    iconText: "text-primary",
  },
  "R2R": {
    label: "Revenue Recording",
    icon: TrendingUp,
    accent: "border-l-blue-500",
    iconBg: "bg-blue-50 dark:bg-blue-950/40",
    iconText: "text-blue-600 dark:text-blue-400",
  },
  "O&M": {
    label: "Revenue Policy",
    icon: BarChart3,
    accent: "border-l-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-950/40",
    iconText: "text-violet-600 dark:text-violet-400",
  },
  Auditor: {
    label: "Audit & Verification",
    icon: ShieldCheck,
    accent: "border-l-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/40",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  "FP&A": {
    label: "Financial Forecast",
    icon: TrendingUp,
    accent: "border-l-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
}

function agentMeta(agent: string) {
  return AGENT_META[agent] ?? {
    label: agent,
    icon: Circle,
    accent: "border-l-border",
    iconBg: "bg-muted",
    iconText: "text-muted-foreground",
  }
}

function groupLogs(logs: RichLog[]): AgentGroup[] {
  const groups: AgentGroup[] = []
  for (const log of logs) {
    const existing = groups.find(g => g.agent === log.agent)
    if (existing) {
      existing.messages.push({ message: log.message, timestamp: log.timestamp })
    } else {
      groups.push({
        agent: log.agent,
        messages: [{ message: log.message, timestamp: log.timestamp }],
        firstTs: log.timestamp,
      })
    }
  }
  return groups
}

function formatTime(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  } catch {
    return ""
  }
}

function groupHasError(group: AgentGroup) {
  return group.messages.some(m =>
    m.message.toLowerCase().includes("fail") ||
    m.message.toLowerCase().includes("error") ||
    m.message.toLowerCase().includes("reject")
  )
}

function groupIsComplete(group: AgentGroup) {
  const last = group.messages[group.messages.length - 1]?.message.toLowerCase() ?? ""
  return last.includes("completed") || last.includes("verified") || last.includes("updated") ||
    last.includes("matched") || last.includes("recorded") || last.includes("applied") ||
    last.includes("done") || last.includes("recalculated") || last.includes("created") ||
    last.includes("connected")
}

export function LiveExecutionView({ executionId }: { executionId: string | null }) {
  const [logs, setLogs] = useState<RichLog[]>([])
  const [status, setStatus] = useState<"idle" | "running" | "completed" | "error">("idle")
  const workflowDone = status === "completed" || status === "error"
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!executionId) return
    setLogs([{ agent: "System", message: `Processing started for execution ${executionId}`, timestamp: new Date().toISOString() }])
    setStatus("running")

    let intervalId: NodeJS.Timeout

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/workflow-studio/logs?executionId=${executionId}`)
        if (res.ok) {
          const data = await res.json()
          if (data.logs && data.logs.length > 0) {
            setLogs([
              { agent: "System", message: `Processing started for execution ${executionId}`, timestamp: new Date().toISOString() },
              ...data.logs,
            ])
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

  const groups = groupLogs(logs)
  const lastGroup = groups[groups.length - 1]

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
          <div ref={scrollRef} className="max-h-[480px] overflow-y-auto pr-1">
            <div className="space-y-1">
              {groups.map((group, gi) => {
                const meta = agentMeta(group.agent)
                const Icon = meta.icon
                const hasError = groupHasError(group)
                const isComplete = !hasError && groupIsComplete(group)
                const isActiveGroup = status === "running" && group === lastGroup
                const isLast = gi === groups.length - 1

                return (
                  <div key={gi}>
                    <div className={`rounded-xl border border-l-4 ${meta.accent} bg-card overflow-hidden`}>
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
                            {isActiveGroup
                              ? <Loader2 className={`h-3.5 w-3.5 animate-spin ${meta.iconText}`} />
                              : <Icon className={`h-3.5 w-3.5 ${meta.iconText}`} />
                            }
                          </div>
                          <span className="text-sm font-semibold">{meta.label}</span>
                          <span className="text-xs text-muted-foreground/60">{formatTime(group.firstTs)}</span>
                        </div>
                        <div>
                          {isActiveGroup
                            ? <Badge variant="secondary" className="gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin" />Processing</Badge>
                            : hasError
                              ? <Badge variant="destructive" className="gap-1 text-xs"><AlertCircle className="h-3 w-3" />Failed</Badge>
                              : (isComplete || workflowDone)
                                ? <Badge className="gap-1 text-xs bg-emerald-500 hover:bg-emerald-500"><CheckCircle2 className="h-3 w-3" />Complete</Badge>
                                : <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" />Pending</Badge>
                          }
                        </div>
                      </div>
                      <div className="px-4 py-3 space-y-2">
                        {group.messages.map((m, mi) => (
                          <div key={mi} className="flex items-start gap-3">
                            <span className="text-[11px] text-muted-foreground/50 mt-0.5 tabular-nums shrink-0 pt-px">
                              {formatTime(m.timestamp)}
                            </span>
                            <p className="text-sm text-muted-foreground leading-relaxed">{m.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    {!isLast && (
                      <div className="flex justify-start pl-[22px] py-0.5">
                        <div className="w-px h-3 bg-border/60" />
                      </div>
                    )}
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
