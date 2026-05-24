import { getSession } from "@/lib/session"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TransactionRerunButton } from "./rerun-button"
import { CheckCircle2, AlertCircle, Clock, TrendingUp, ShieldCheck, BarChart3, Workflow } from "lucide-react"

const AGENT_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  Orchestrator:  { label: "Workflow Manager",       icon: Workflow,      color: "text-primary bg-primary/10" },
  "R2R":         { label: "Revenue Recording",      icon: TrendingUp,    color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/40" },
  "O&M":         { label: "Revenue Policy",         icon: BarChart3,     color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-950/40" },
  Auditor:       { label: "Audit & Verification",   icon: ShieldCheck,   color: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40" },
  "FP&A":        { label: "Financial Forecast",     icon: TrendingUp,    color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40" },
}

function agentMeta(agent: string) {
  return AGENT_META[agent] ?? { label: agent, icon: CheckCircle2, color: "text-muted-foreground bg-muted" }
}

function isSuccess(msg: string) {
  const lower = msg.toLowerCase()
  return lower.includes("completed") || lower.includes("verified") || lower.includes("updated") || lower.includes("matched") || lower.includes("recorded") || lower.includes("applied") || lower.includes("done") || lower.includes("recalculated")
}
function isError(msg: string) {
  return msg.toLowerCase().includes("fail") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("reject")
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

  let logs: any[] = []
  if (Array.isArray(transaction.agentLogs)) {
    logs = transaction.agentLogs
  } else if (typeof transaction.agentLogs === "string") {
    try { logs = JSON.parse(transaction.agentLogs) } catch (e) {}
  }

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
          {logs.length > 0 ? (
            <div className="relative space-y-0">
              {logs.map((l: any, i: number) => {
                const meta = agentMeta(l.agent)
                const Icon = meta.icon
                const success = isSuccess(l.message)
                const error = isError(l.message)
                const isLast = i === logs.length - 1
                return (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {!isLast && <div className="w-px flex-1 bg-border my-1" />}
                    </div>
                    <div className={`pb-5 flex-1 min-w-0 ${isLast ? "" : ""}`}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-foreground">{meta.label}</span>
                        {success && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                        {error && <AlertCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />}
                        {!success && !error && <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{l.message}</p>
                    </div>
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
