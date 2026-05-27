"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

interface PurchaseOrder {
  id: string
  poNumber: string
  status: string
  totalAmount: number
  createdAt: string
}

interface VendorInvoice {
  id: string
  invoiceNumber: string
  status: string
  amount: number
  dueDate: string
}

interface VendorPayment {
  id: string
  amount: number
  paymentDate: string
  method: string
  referenceNumber: string | null
  vendorInvoice: { id: string; invoiceNumber: string }
}

interface VendorActivityTabsProps {
  purchaseOrders: PurchaseOrder[]
  vendorInvoices: VendorInvoice[]
  payments: VendorPayment[]
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  APPROVED: "bg-blue-100 text-blue-800",
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
  ORDERED: "bg-blue-100 text-blue-800",
  RECEIVED: "bg-teal-100 text-teal-800",
  CLOSED: "bg-gray-100 text-gray-500",
  CANCELLED: "bg-gray-100 text-gray-500",
  OVERDUE: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  )
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export function VendorActivityTabs({ purchaseOrders, vendorInvoices, payments }: VendorActivityTabsProps) {
  return (
    <Tabs defaultValue="purchase-orders">
      <TabsList>
        <TabsTrigger value="purchase-orders">Purchase Orders ({purchaseOrders.length})</TabsTrigger>
        <TabsTrigger value="invoices">Vendor Invoices ({vendorInvoices.length})</TabsTrigger>
        <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="purchase-orders" className="mt-4">
        {purchaseOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No purchase orders found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrders.map((po) => (
                <TableRow key={po.id}>
                  <TableCell>
                    <Link href={`/purchases/${po.id}`} className="text-primary hover:underline font-medium">
                      {po.poNumber}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={po.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(po.createdAt)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(po.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="invoices" className="mt-4">
        {vendorInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No vendor invoices found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendorInvoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/vendor-invoices/${inv.id}`} className="text-primary hover:underline font-medium">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(inv.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="payments" className="mt-4">
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No payments recorded.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm">{fmtDate(p.paymentDate)}</TableCell>
                  <TableCell>
                    <Link href={`/vendor-invoices/${p.vendorInvoice.id}`} className="text-primary hover:underline text-sm">
                      {p.vendorInvoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground capitalize">{p.method.replace(/_/g, " ")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.referenceNumber ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  )
}
