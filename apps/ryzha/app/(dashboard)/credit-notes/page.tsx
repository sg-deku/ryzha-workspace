import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { FileX, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

const REASON_LABELS: Record<string, string> = {
  returned_goods: "Returned Goods",
  service_not_delivered: "Service Not Delivered",
  billing_error: "Billing Error",
  discount: "Discount",
  partial_delivery: "Partial Delivery",
  other: "Other",
}

const REFUND_METHOD_LABELS: Record<string, string> = {
  bank_transfer: "Bank Transfer",
  credit_card: "Credit Card",
  account_credit: "Account Credit",
  cheque: "Cheque",
  other: "Other",
}

export default async function CreditNotesPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const creditNotes = await prisma.creditNote.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { issueDate: "desc" },
    include: {
      invoice: {
        select: { invoiceNumber: true, clientName: true },
      },
    },
  })

  const totalCredited = creditNotes.reduce((sum, cn) => sum + cn.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Credit Notes</h1>
          <p className="text-muted-foreground">All credit notes and refunds issued to clients.</p>
        </div>
        <div className="flex items-center gap-2 bg-destructive/10 px-4 py-2 rounded-lg">
          <FileX className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">Total Credited</p>
            <p className="text-lg font-bold">
              ${totalCredited.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Note History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Invoice</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Refund Method</TableHead>
                <TableHead className="pr-6 text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
                    No credit notes issued yet.
                  </TableCell>
                </TableRow>
              ) : (
                creditNotes.map((cn) => (
                  <TableRow key={cn.id}>
                    <TableCell className="pl-6">
                      <Link
                        href={`/invoices/${cn.invoiceId}`}
                        className="flex items-center gap-1 text-primary hover:underline font-mono text-sm"
                      >
                        {cn.invoice.invoiceNumber}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm">{cn.invoice.clientName}</TableCell>
                    <TableCell className="font-semibold text-destructive">
                      -${cn.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {REASON_LABELS[cn.reasonCategory] ?? cn.reasonCategory}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {cn.refundMethod ? (REFUND_METHOD_LABELS[cn.refundMethod] ?? cn.refundMethod) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm text-right pr-6">
                      {new Date(cn.issueDate).toLocaleDateString("en-GB", {
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
