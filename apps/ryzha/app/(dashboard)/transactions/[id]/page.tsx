import { getSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TransactionRerunButton } from "./rerun-button"
import { CheckCircle2, AlertCircle, Clock, TrendingUp, ShieldCheck, BarChart3, Workflow, Circle } from "lucide-react"

interface LogEntry {
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

function groupLogs(logs: LogEntry[]): AgentGroup[] {
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

export const dynamic = "force-dynamic"

export default async function TransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) return notFound()

  const transaction = await prisma.transaction.findUnique({
    where: { id, organizationId: session.user.organizationId }
  })

  if (!transaction) return notFound()

  let rawLogs: LogEntry[] = []
  if (Array.isArray(transaction.agentLogs)) {
    rawLogs = transaction.agentLogs as LogEntry[]
  } else if (typeof transaction.agentLogs === "string") {
    try { rawLogs = JSON.parse(transaction.agentLogs) } catch {}
  }

  const groups = groupLogs(rawLogs)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
          <p className="text-muted-foreground">{transaction.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={transaction.workflowStatus === "completed" ? "default" : transaction.workflowStatus === "error" ? "destructive" : "secondary"}>
            {transaction.workflowStatus}
          </Badge>
          <TransactionRerunButton transactionId={transaction.id} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Description</div>
              <div>{transaction.description || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Amount</div>
              <div className="font-bold text-2xl">${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {transaction.currency.toUpperCase()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Customer Email</div>
              <div>{transaction.customerEmail || "N/A"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Stripe Payment Intent ID</div>
              <div className="font-mono text-sm">{transaction.stripePaymentIntentId}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created At</div>
              <div>{new Date(transaction.createdAt).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Revenue Recognition Type</div>
              <div className="capitalize">{transaction.revenueRecognitionType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Recognized / Deferred Revenue</div>
              <div>${transaction.recognizedRevenue || 0} / ${transaction.deferredRevenue || 0}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Audit Status</div>
              <div>
                <Badge variant={transaction.auditStatus === "verified" ? "default" : "destructive"}>{transaction.auditStatus}</Badge>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Audit Hash</div>
              <div className="font-mono text-xs">{transaction.auditHash || "N/A"}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Steps</CardTitle>
          <CardDescription>How Ryzha processed this transaction</CardDescription>
        </CardHeader>
        <CardContent>
          {groups.length > 0 ? (
            <div className="space-y-1">
              {groups.map((group, gi) => {
                const meta = agentMeta(group.agent)
                const Icon = meta.icon
                const hasError = groupHasError(group)
                const isComplete = !hasError && groupIsComplete(group)
                const isLast = gi === groups.length - 1

                return (
                  <div key={gi}>
                    <div className={`rounded-xl border border-l-4 ${meta.accent} bg-card overflow-hidden`}>
                      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
                            <Icon className={`h-3.5 w-3.5 ${meta.iconText}`} />
                          </div>
                          <span className="text-sm font-semibold">{meta.label}</span>
                          <span className="text-xs text-muted-foreground/60">{formatTime(group.firstTs)}</span>
                        </div>
                        <div>
                          {hasError
                            ? <Badge variant="destructive" className="gap-1 text-xs"><AlertCircle className="h-3 w-3" />Failed</Badge>
                            : isComplete
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
          ) : (
            <p className="text-sm text-muted-foreground">No processing steps available for this transaction.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
