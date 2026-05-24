import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { DollarSign, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

const METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  cheque: "Cheque",
  cash: "Cash",
  stripe: "Stripe",
  other: "Other",
}

export default async function PaymentsPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const payments = await prisma.payment.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { paymentDate: "desc" },
    include: {
      invoice: {
        select: { invoiceNumber: true, customerName: true },
      },
    },
  })

  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments Received</h1>
          <p className="text-muted-foreground">All payments collected against your invoices.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Total Received</p>
            <p className="text-lg font-bold">
              ${totalReceived.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="pr-6 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    No payments recorded yet.
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/invoices/${payment.invoiceId}`}
                        className="flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                      >
                        {payment.invoice.invoiceNumber}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{payment.invoice.customerName}</TableCell>
                    <TableCell className="font-semibold text-green-600">
                      ${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {METHOD_LABELS[payment.method] ?? payment.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {payment.referenceNumber ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm text-right pr-6">
                      {new Date(payment.paymentDate).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
