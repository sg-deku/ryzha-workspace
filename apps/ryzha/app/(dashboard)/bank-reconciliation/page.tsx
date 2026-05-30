import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Suspense } from "react"
import { ListSearch } from "@/components/ui/list-search"
import { BankReconClient } from "./recon-client"

export const dynamic = "force-dynamic"

export default async function BankReconciliationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const { status } = await searchParams
  const organizationId = session.user.organizationId

  const [transactions, unmatchedCount, matchedCount, autoMatchedCount] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: {
        organizationId,
        ...(status ? { matchStatus: status } : {}),
      },
      include: {
        matchedPayment: { include: { invoice: { select: { invoiceNumber: true, clientName: true } } } },
        matchedVendorPayment: { include: { vendorInvoice: { select: { invoiceNumber: true } } } },
      },
      orderBy: { date: "desc" },
      take: 200,
    }),
    prisma.bankTransaction.count({ where: { organizationId, matchStatus: "unmatched" } }),
    prisma.bankTransaction.count({ where: { organizationId, matchStatus: "matched" } }),
    prisma.bankTransaction.count({ where: { organizationId, matchStatus: "auto_matched" } }),
  ])

  const totalUnmatched = await prisma.bankTransaction.aggregate({
    where: { organizationId, matchStatus: "unmatched" },
    _sum: { amount: true },
  })

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  const matchStatusBadge = (s: string) => {
    if (s === "matched") return <Badge className="bg-green-100 text-green-800 border border-green-300">Matched</Badge>
    if (s === "auto_matched") return <Badge className="bg-blue-100 text-blue-800 border border-blue-300">Auto Matched</Badge>
    return <Badge variant="secondary">Unmatched</Badge>
  }

  const totalReconciled = matchedCount + autoMatchedCount
  const total = unmatchedCount + totalReconciled
  const pct = total > 0 ? Math.round((totalReconciled / total) * 100) : 0

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h2>
        <p className="text-muted-foreground">Import bank statements and let AI match them to vendor payments and customer receipts.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unmatched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unmatchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalUnmatched._sum.amount ?? 0)} unreconciled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Auto Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{autoMatchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">AI high-confidence</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Manually Matched</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Confirmed by user</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reconciled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pct}%</div>
            <p className="text-xs text-muted-foreground mt-1">{totalReconciled} of {total} transactions</p>
          </CardContent>
        </Card>
      </div>

      <BankReconClient />

      <Suspense>
        <ListSearch
          placeholder="Filter by status..."
          statusOptions={[
            { value: "unmatched", label: "Unmatched" },
            { value: "matched", label: "Matched" },
            { value: "auto_matched", label: "Auto Matched" },
          ]}
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Bank Transactions</CardTitle>
          <CardDescription>All imported bank transactions and their reconciliation status.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Matched To</TableHead>
                <TableHead>Reconciled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell className="whitespace-nowrap">{tx.date.toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.reference || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                  <TableCell className={`text-right font-mono font-semibold ${tx.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>{matchStatusBadge(tx.matchStatus)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.matchedPayment
                      ? `${tx.matchedPayment.invoice.clientName} — ${tx.matchedPayment.invoice.invoiceNumber}`
                      : tx.matchedVendorPayment
                      ? `Vendor Inv ${tx.matchedVendorPayment.vendorInvoice.invoiceNumber}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {(tx as any).reconciledAt
                      ? new Date((tx as any).reconciledAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bank transactions yet. Import a CSV statement above to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
