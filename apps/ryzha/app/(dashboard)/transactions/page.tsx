import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { CheckCircle2, AlertCircle, Clock, ArrowRight } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const orgId = session.user.organizationId

  const [transactions, totals] = await Promise.all([
    prisma.transaction.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.transaction.aggregate({
      where: { organizationId: orgId, workflowStatus: "completed" },
      _sum: { amount: true, recognizedRevenue: true, deferredRevenue: true },
      _count: { id: true },
    }),
  ])

  const reconciled = transactions.filter(t => t.workflowStatus === "completed")
  const pending = transactions.filter(t => !t.workflowStatus || t.workflowStatus === "running")
  const errored = transactions.filter(t => t.workflowStatus === "error")

  const totalReconciled = totals._sum.amount ?? 0
  const totalRecognized = totals._sum.recognizedRevenue ?? 0
  const totalDeferred = totals._sum.deferredRevenue ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reconciled Transactions</h1>
        <p className="text-muted-foreground">All transactions processed through the AI agent pipeline</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">{totals._count.id}</div>
                <div className="text-sm text-muted-foreground">Reconciled</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">${totalReconciled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div className="text-sm text-muted-foreground">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">{pending.length}</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div>
                <div className="text-2xl font-bold">{errored.length}</div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Recognized: ${totalRecognized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} &nbsp;|&nbsp;
            Deferred: ${totalDeferred.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No transactions yet. Trigger a Stripe workflow from Workflow Studio to create one.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                    <th className="pb-3 pr-4 font-medium text-right">Recognized</th>
                    <th className="pb-3 pr-4 font-medium text-right">Deferred</th>
                    <th className="pb-3 pr-4 font-medium">Audit</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-4 text-muted-foreground whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 pr-4 max-w-[160px] truncate">
                        {tx.customerEmail ?? "—"}
                      </td>
                      <td className="py-3 pr-4 max-w-[200px] truncate text-muted-foreground">
                        {tx.description ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-medium">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-green-600">
                        {tx.recognizedRevenue != null ? `$${tx.recognizedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-orange-600">
                        {tx.deferredRevenue != null && tx.deferredRevenue > 0 ? `$${tx.deferredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={tx.auditStatus === "verified" ? "default" : tx.auditStatus === "failed" ? "destructive" : "secondary"} className="text-xs">
                          {tx.auditStatus}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={tx.workflowStatus === "completed" ? "default" : tx.workflowStatus === "error" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {tx.workflowStatus ?? "pending"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <Link href={`/transactions/${tx.id}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
