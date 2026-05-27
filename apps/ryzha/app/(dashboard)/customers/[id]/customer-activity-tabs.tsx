"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

interface SalesOrder {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  dueDate: string | null
  createdAt: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  total: number
  issueDate: string
  dueDate: string
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  method: string
  referenceNumber: string | null
  invoice: { invoiceNumber: string; id: string }
}

interface CreditNote {
  id: string
  amount: number
  issueDate: string
  reasonCategory: string
  reason: string | null
  invoice: { invoiceNumber: string; id: string }
}

interface CustomerActivityTabsProps {
  salesOrders: SalesOrder[]
  invoices: Invoice[]
  payments: Payment[]
  creditNotes: CreditNote[]
}

const STATUS_COLORS: Record<string, string> = {
  PAID: "bg-green-100 text-green-800",
  SENT: "bg-blue-100 text-blue-800",
  DRAFT: "bg-gray-100 text-gray-700",
  OVERDUE: "bg-red-100 text-red-800",
  PARTIAL: "bg-yellow-100 text-yellow-800",
  VOID: "bg-gray-100 text-gray-500",
  APPROVED: "bg-blue-100 text-blue-800",
  INVOICED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-teal-100 text-teal-800",
  CANCELLED: "bg-gray-100 text-gray-500",
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-700"
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {status}
    </span>
  )
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

export function CustomerActivityTabs({ salesOrders, invoices, payments, creditNotes }: CustomerActivityTabsProps) {
  return (
    <Tabs defaultValue="orders">
      <TabsList>
        <TabsTrigger value="orders">Sales Orders ({salesOrders.length})</TabsTrigger>
        <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
        <TabsTrigger value="payments">Payments ({payments.length})</TabsTrigger>
        <TabsTrigger value="credit-notes">Credit Notes ({creditNotes.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="mt-4">
        {salesOrders.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No sales orders found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesOrders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/sales-orders/${o.id}`} className="text-primary hover:underline font-medium">
                      {o.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {o.dueDate ? fmtDate(o.dueDate) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-medium">{fmt(o.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="invoices" className="mt-4">
        {invoices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No invoices found.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>
                    <Link href={`/invoices/${inv.id}`} className="text-primary hover:underline font-medium">
                      {inv.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell><StatusBadge status={inv.status} /></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(inv.issueDate)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{fmtDate(inv.dueDate)}</TableCell>
                  <TableCell className="text-right font-medium">{fmt(inv.total)}</TableCell>
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
                    <Link href={`/invoices/${p.invoice.id}`} className="text-primary hover:underline text-sm">
                      {p.invoice.invoiceNumber}
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

      <TabsContent value="credit-notes" className="mt-4">
        {creditNotes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No credit notes issued.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creditNotes.map((cn) => (
                <TableRow key={cn.id}>
                  <TableCell className="text-sm">{fmtDate(cn.issueDate)}</TableCell>
                  <TableCell>
                    <Link href={`/invoices/${cn.invoice.id}`} className="text-primary hover:underline text-sm">
                      {cn.invoice.invoiceNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cn.reasonCategory.replace(/_/g, " ")}
                    {cn.reason ? ` — ${cn.reason}` : ""}
                  </TableCell>
                  <TableCell className="text-right font-medium">{fmt(cn.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>
    </Tabs>
  )
}
