import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PageShell } from "@/components/ui/page-shell"

export const dynamic = "force-dynamic"

export default async function TransactionsPage() {
  const session = await getSession()
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

  const pending = transactions.filter(t => !t.workflowStatus || t.workflowStatus === "running")
  const errored = transactions.filter(t => t.workflowStatus === "error")

  const totalReconciled = totals._sum.amount ?? 0
  const totalRecognized = totals._sum.recognizedRevenue ?? 0
  const totalDeferred = totals._sum.deferredRevenue ?? 0

  return (
    <PageShell
      title="Transactions"
      subtitle="All transactions processed through the AI agent pipeline."
      kpis={[
        { label: "Reconciled", value: totals._count.id },
        { label: "Total Revenue", value: `$${totalReconciled.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: "In Progress", value: pending.length },
        { label: "Failed", value: errored.length },
      ]}
    >
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
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transactions yet. Trigger a Stripe workflow from Workflow Studio to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-3 pr-4 font-medium">External ID</th>
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
                      <td className="py-3 pr-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {(tx as any).transactionNumber || "—"}
                      </td>
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
                        {tx.recognizedRevenue != null
                          ? `$${tx.recognizedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono text-orange-600">
                        {tx.deferredRevenue != null && tx.deferredRevenue > 0
                          ? `$${tx.deferredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={tx.auditStatus === "verified" ? "default" : tx.auditStatus === "failed" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
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
    </PageShell>
  )
}
