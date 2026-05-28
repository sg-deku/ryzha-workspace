import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil, Plus, FileMinus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VendorInvoicePaymentPanel } from "../vendor-invoice-payment-panel"

export const dynamic = "force-dynamic";

export default async function VendorInvoiceDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const invoice = await prisma.vendorInvoice.findUnique({
    where: { 
      id,
      organizationId: session.user.organizationId 
    },
    include: {
      vendor: true,
      purchaseOrder: true,
      lineItems: true,
      vendorPayments: { orderBy: { paymentDate: "desc" } },
      debitMemos: { orderBy: { issueDate: "desc" } },
    }
  })

  if (!invoice) return notFound()

  const totalPaid = invoice.vendorPayments.reduce((s, p) => s + p.amount, 0)
  const outstanding = Math.max(0, invoice.amount - totalPaid)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendor-invoices">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Invoice {invoice.invoiceNumber}</h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Badge variant="outline">{invoice.status}</Badge>
              Vendor Invoice
            </p>
          </div>
        </div>
        {invoice.status === "PENDING" && (
          <Button variant="outline" asChild>
            <Link href={`/vendor-invoices/${invoice.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vendor</p>
                  <Link href={`/vendors/${invoice.vendorId}`} className="text-primary hover:underline">
                    {invoice.vendor.name}
                  </Link>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">PO Number</p>
                  {invoice.purchaseOrderId ? (
                    <Link href={`/purchases/${invoice.purchaseOrderId}`} className="text-primary hover:underline">
                      {invoice.purchaseOrder?.poNumber}
                    </Link>
                  ) : (
                    <span>N/A</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="font-bold">${invoice.amount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Due Date</p>
                  <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created</p>
                  <p>{new Date(invoice.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                  <p className={outstanding > 0 ? "font-bold text-destructive" : "font-bold text-green-600"}>${outstanding.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle>Debit Memos</CardTitle>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/vendor-debit-memos/new?vendorId=${invoice.vendorId}&vendorInvoiceId=${invoice.id}`}>
                  <Plus className="mr-1 h-3 w-3" /> New Debit Memo
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {invoice.debitMemos.length === 0 ? (
                <p className="text-sm text-muted-foreground px-6 py-4">No debit memos on this invoice.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Memo #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right pr-6">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.debitMemos.map((dm) => (
                      <TableRow key={dm.id}>
                        <TableCell className="pl-6 font-mono text-sm font-semibold">
                          <Link href="/vendor-debit-memos" className="text-primary hover:underline flex items-center gap-1">
                            <FileMinus className="h-3 w-3" /> {dm.memoNumber}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant={dm.debitType === "cash_refund" ? "default" : "secondary"}>
                            {dm.debitType === "cash_refund" ? "Cash Refund" : "Vendor Credit"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{dm.reason}</TableCell>
                        <TableCell>
                          <Badge variant={dm.status === "VOID" ? "outline" : dm.status === "OPEN" ? "secondary" : "default"}>
                            {dm.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-700 dark:text-green-400 font-semibold pr-6">
                          ${dm.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="text-right font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">${invoice.amount.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div>
          <VendorInvoicePaymentPanel
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            totalAmount={invoice.amount}
            initialPayments={JSON.parse(JSON.stringify(invoice.vendorPayments))}
            status={invoice.status}
          />
        </div>
      </div>
    </div>
  )
}
