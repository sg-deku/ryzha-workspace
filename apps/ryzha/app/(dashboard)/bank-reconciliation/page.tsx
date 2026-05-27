import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { ListSearch } from "@/components/ui/list-search"

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

  const [transactions, unmatchedCount, matchedCount] = await Promise.all([
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
  ])

  const totalUnmatched = await prisma.bankTransaction.aggregate({
    where: { organizationId, matchStatus: "unmatched" },
    _sum: { amount: true },
  })

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  const matchStatusVariant = (s: string) => {
    if (s === "matched") return "default"
    if (s === "auto_matched") return "default"
    return "secondary"
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bank Reconciliation</h2>
          <p className="text-muted-foreground">Match bank transactions to invoices and payments</p>
        </div>
        <Button asChild>
          <Link href="/cash-application">Go to Cash Application</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unmatched Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{unmatchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalUnmatched._sum.amount ?? 0)} unreconciled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Matched Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{matchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Successfully reconciled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unmatchedCount + matchedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {matchedCount + unmatchedCount > 0
                ? `${Math.round((matchedCount / (matchedCount + unmatchedCount)) * 100)}% reconciled`
                : "No transactions yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Suspense>
        <ListSearch
          placeholder="Filter transactions..."
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
          <CardDescription>
            All imported bank transactions and their reconciliation status.
            Use <Link href="/cash-application" className="text-primary hover:underline">Cash Application</Link> to run AI matching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Match Status</TableHead>
                <TableHead>Matched To</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.date.toLocaleDateString()}</TableCell>
                  <TableCell className="font-mono text-xs">{tx.reference || "—"}</TableCell>
                  <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                  <TableCell className={tx.amount >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {formatCurrency(tx.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={matchStatusVariant(tx.matchStatus)}>
                      {tx.matchStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tx.matchedPayment
                      ? `Invoice ${tx.matchedPayment.invoice.invoiceNumber} — ${tx.matchedPayment.invoice.clientName}`
                      : tx.matchedVendorPayment
                      ? `Vendor Inv ${tx.matchedVendorPayment.vendorInvoice.invoiceNumber}`
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No bank transactions imported yet. Import via the Transactions page or Cash Application.
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
