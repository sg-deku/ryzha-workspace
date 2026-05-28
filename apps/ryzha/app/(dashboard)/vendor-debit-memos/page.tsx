import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { Plus, FileMinus, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  OPEN: "secondary",
  APPLIED: "default",
  PAID: "default",
  VOID: "outline",
}

const REASON_LABELS: Record<string, string> = {
  overcharge: "Overcharge",
  defective_goods: "Defective Goods",
  service_not_rendered: "Service Not Rendered",
  duplicate_payment: "Duplicate Payment",
  other: "Other",
}

const DEBIT_TYPE_LABELS: Record<string, string> = {
  vendor_credit: "Vendor Credit (AP)",
  cash_refund: "Cash Refund",
}

export default async function VendorDebitMemosPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const memos = await prisma.vendorDebitMemo.findMany({
    where: { organizationId: session.user.organizationId },
    include: {
      vendor: { select: { id: true, name: true } },
      vendorInvoice: { select: { id: true, invoiceNumber: true } },
    },
    orderBy: { issueDate: "desc" },
  })

  const totalOpen = memos.filter((m) => m.status === "OPEN").reduce((s, m) => s + m.amount, 0)
  const totalAll = memos.reduce((s, m) => s + m.amount, 0)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Vendor Debit Memos</h2>
          <p className="text-muted-foreground">Vendor overcharges, credits, and cash refunds from suppliers.</p>
        </div>
        <Button asChild>
          <Link href="/vendor-debit-memos/new">
            <Plus className="mr-2 h-4 w-4" /> New Debit Memo
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <FileMinus className="h-8 w-8 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{memos.length}</div>
              <div className="text-sm text-muted-foreground">Total Memos</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                ${totalOpen.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Open Credits</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                ${totalAll.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-sm text-muted-foreground">Total Claimed</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Debit Memos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Memo #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Linked Invoice</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right pr-6">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground italic">
                    No debit memos yet.{" "}
                    <Link href="/vendor-debit-memos/new" className="underline">
                      Create your first one
                    </Link>
                    .
                  </TableCell>
                </TableRow>
              ) : (
                memos.map((memo) => (
                  <TableRow key={memo.id} className="cursor-pointer hover:bg-muted/40">
                    <TableCell className="pl-6 font-mono text-sm font-semibold text-primary">
                      {memo.memoNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      <Link href={`/vendors/${memo.vendor.id}`} className="hover:underline flex items-center gap-1">
                        {memo.vendor.name} <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </Link>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {memo.vendorInvoice ? (
                        <Link href={`/vendor-invoices/${memo.vendorInvoice.id}`} className="text-primary hover:underline flex items-center gap-1">
                          {memo.vendorInvoice.invoiceNumber} <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={memo.debitType === "cash_refund" ? "default" : "secondary"} className="text-xs">
                        {DEBIT_TYPE_LABELS[memo.debitType] ?? memo.debitType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {REASON_LABELS[memo.reasonCategory] ?? memo.reasonCategory}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[memo.status] ?? "outline"}>
                        {memo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-green-700 dark:text-green-400">
                      ${memo.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground pr-6">
                      {new Date(memo.issueDate).toLocaleDateString()}
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
