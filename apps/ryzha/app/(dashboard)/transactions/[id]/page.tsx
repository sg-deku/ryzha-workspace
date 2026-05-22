import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function TransactionPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return notFound()

  const transaction = await prisma.transaction.findUnique({
    where: { id: params.id, organizationId: session.user.organizationId }
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
        <Badge variant={transaction.workflowStatus === "completed" ? "default" : transaction.workflowStatus === "error" ? "destructive" : "secondary"}>
          {transaction.workflowStatus}
        </Badge>
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
          <CardTitle>Agent Logs</CardTitle>
          <CardDescription>Step-by-step reasoning from the AI agents</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length > 0 ? (
            <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-md whitespace-pre-wrap max-h-96 overflow-y-auto">
              {logs.map((l, i) => (
                <div key={i}>[{l.agent}] {l.message}</div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No logs available for this transaction.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}