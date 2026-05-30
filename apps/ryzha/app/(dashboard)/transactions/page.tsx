import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowRight, AlertTriangle, XCircle, CheckCircle2, Clock } from "lucide-react"
import { PageShell } from "@/components/ui/page-shell"

export const dynamic = "force-dynamic"

type Tx = Awaited<ReturnType<typeof prisma.transaction.findMany>>[number]

function getPipelineStatus(tx: Tx): {
  label: string
  rowClass: string
  badgeClass: string
  icon: React.ReactNode
} {
  const audit = tx.auditStatus
  const workflow = tx.workflowStatus

  if (audit === "flagged") {
    return {
      label: "Flagged · Stopped",
      rowClass: "bg-amber-50/60 dark:bg-amber-950/20 border-l-2 border-amber-400",
      badgeClass: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700",
      icon: <AlertTriangle className="h-3 w-3" />,
    }
  }
  if (audit === "rejected") {
    return {
      label: "Rejected · Stopped",
      rowClass: "bg-red-50/60 dark:bg-red-950/20 border-l-2 border-red-500",
      badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700",
      icon: <XCircle className="h-3 w-3" />,
    }
  }
  if (workflow === "error") {
    return {
      label: "Pipeline Error",
      rowClass: "bg-red-50/40 dark:bg-red-950/10 border-l-2 border-red-400",
      badgeClass: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-300 dark:border-red-700",
      icon: <XCircle className="h-3 w-3" />,
    }
  }
  if (workflow === "completed" && audit === "verified") {
    return {
      label: "Verified · Complete",
      rowClass: "hover:bg-muted/30",
      badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    }
  }
  if (workflow === "completed") {
    return {
      label: "Complete",
      rowClass: "hover:bg-muted/30",
      badgeClass: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border border-green-300 dark:border-green-700",
      icon: <CheckCircle2 className="h-3 w-3" />,
    }
  }
  if (workflow === "running") {
    return {
      label: "Processing...",
      rowClass: "hover:bg-muted/30",
      badgeClass: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-300 dark:border-blue-700",
      icon: <Clock className="h-3 w-3 animate-spin" />,
    }
  }
  return {
    label: "Pending",
    rowClass: "hover:bg-muted/30",
    badgeClass: "bg-muted text-muted-foreground border",
    icon: <Clock className="h-3 w-3" />,
  }
}

export default async function TransactionsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const orgId = session.user.organizationId

  const [transactions, completedTotals, flaggedAgg, errorCount, inProgressCount] = await Promise.all([
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
    prisma.transaction.aggregate({
      where: { organizationId: orgId, auditStatus: { in: ["flagged", "rejected"] } },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.transaction.count({
      where: { organizationId: orgId, workflowStatus: "error", auditStatus: { notIn: ["flagged", "rejected"] } },
    }),
    prisma.transaction.count({
      where: { organizationId: orgId, workflowStatus: { in: ["pending", "running"] } },
    }),
  ])

  const totalRecognized = completedTotals._sum.recognizedRevenue ?? 0
  const totalDeferred = completedTotals._sum.deferredRevenue ?? 0
  const flaggedCount = flaggedAgg._count.id
  const flaggedAmount = flaggedAgg._sum.amount ?? 0

  const needsAction = transactions.filter(
    t => t.auditStatus === "flagged" || t.auditStatus === "rejected" || t.workflowStatus === "error"
  )

  return (
    <PageShell
      title="Transactions"
      subtitle="All transactions processed through the AI agent pipeline."
      kpis={[
        {
          label: "Cleared",
          value: completedTotals._count.id,
        },
        {
          label: "Total Revenue",
          value: `$${(completedTotals._sum.amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        },
        {
          label: "Flagged",
          value: flaggedCount > 0 ? `${flaggedCount} · $${flaggedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "0",
        },
        {
          label: "Errors / In Progress",
          value: `${errorCount} / ${inProgressCount}`,
        },
      ]}
    >
      {needsAction.length > 0 && (
        <Card className="border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <CardTitle className="text-base text-amber-800 dark:text-amber-300">
                Needs Action — {needsAction.length} transaction{needsAction.length !== 1 ? "s" : ""} require review
              </CardTitle>
            </div>
            <CardDescription className="text-amber-700/70 dark:text-amber-400/70">
              Flagged or errored transactions are not recognized as revenue. Resolve before month-end close.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {needsAction.map(tx => {
                const ps = getPipelineStatus(tx)
                return (
                  <div key={tx.id} className="flex items-center justify-between rounded-md border border-amber-200 dark:border-amber-800 bg-white dark:bg-background px-4 py-2.5 gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ps.badgeClass}`}>
                        {ps.icon}
                        {ps.label}
                      </span>
                      <span className="text-sm font-medium truncate">{tx.customerEmail ?? "—"}</span>
                      <span className="text-xs text-muted-foreground truncate hidden md:block">{tx.description ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <span className="font-mono font-semibold text-sm">
                        ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <Link href={`/transactions/${tx.id}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Recognized: ${totalRecognized.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            &nbsp;·&nbsp;
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
                    <th className="pb-3 pr-4 font-medium">ID</th>
                    <th className="pb-3 pr-4 font-medium">Date</th>
                    <th className="pb-3 pr-4 font-medium">Customer</th>
                    <th className="pb-3 pr-4 font-medium">Description</th>
                    <th className="pb-3 pr-4 font-medium text-right">Amount</th>
                    <th className="pb-3 pr-4 font-medium text-right">Recognized</th>
                    <th className="pb-3 pr-4 font-medium text-right">Deferred</th>
                    <th className="pb-3 pr-4 font-medium">Pipeline</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {transactions.map(tx => {
                    const ps = getPipelineStatus(tx)
                    return (
                      <tr key={tx.id} className={`transition-colors ${ps.rowClass}`}>
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
                        <td className="py-3 pr-4 text-right font-mono text-green-600 dark:text-green-400">
                          {tx.recognizedRevenue != null
                            ? `$${tx.recognizedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4 text-right font-mono text-orange-600 dark:text-orange-400">
                          {tx.deferredRevenue != null && tx.deferredRevenue > 0
                            ? `$${tx.deferredRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${ps.badgeClass}`}>
                            {ps.icon}
                            {ps.label}
                          </span>
                        </td>
                        <td className="py-3">
                          <Link href={`/transactions/${tx.id}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}
