import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

function ageBucket(dueDate: Date): string {
  const days = Math.floor((Date.now() - dueDate.getTime()) / 86400000)
  if (days <= 0) return "Current"
  if (days <= 30) return "1–30 days"
  if (days <= 60) return "31–60 days"
  if (days <= 90) return "61–90 days"
  return "90+ days"
}

const BUCKET_ORDER = ["Current", "1–30 days", "31–60 days", "61–90 days", "90+ days"]

export default async function APAgingPage() {
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const organizationId = session.user.organizationId

  const openVendorInvoices = await prisma.vendorInvoice.findMany({
    where: {
      organizationId,
      status: { notIn: ["PAID", "CANCELLED"] },
    },
    include: { vendor: true },
    orderBy: { dueDate: "asc" },
  })

  const byBucket: Record<string, { invoices: typeof openVendorInvoices; total: number }> = {}
  for (const bucket of BUCKET_ORDER) {
    byBucket[bucket] = { invoices: [], total: 0 }
  }

  for (const inv of openVendorInvoices) {
    const bucket = ageBucket(inv.dueDate)
    byBucket[bucket].invoices.push(inv)
    byBucket[bucket].total += inv.amount
  }

  const grandTotal = openVendorInvoices.reduce((s, i) => s + i.amount, 0)
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">AP Aging Report</h2>
            <p className="text-muted-foreground">Outstanding vendor invoices by age</p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <a href="/api/reports/export?type=ap-aging" download>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        {BUCKET_ORDER.map((bucket) => (
          <Card key={bucket}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{bucket}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(byBucket[bucket].total)}</div>
              <p className="text-xs text-muted-foreground mt-1">{byBucket[bucket].invoices.length} invoices</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {BUCKET_ORDER.filter((b) => byBucket[b].invoices.length > 0).map((bucket) => (
        <Card key={bucket}>
          <CardHeader>
            <CardTitle>{bucket}</CardTitle>
            <CardDescription>{formatCurrency(byBucket[bucket].total)} outstanding</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byBucket[bucket].invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">
                      <Link href={`/vendor-invoices/${inv.id}`} className="text-primary hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </TableCell>
                    <TableCell>{inv.vendor.name}</TableCell>
                    <TableCell>{inv.dueDate.toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "DISPUTED" ? "destructive" : "outline"}>
                        {inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(inv.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {openVendorInvoices.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No outstanding vendor invoices. All caught up!
          </CardContent>
        </Card>
      )}

      {openVendorInvoices.length > 0 && (
        <div className="flex justify-end">
          <div className="text-lg font-bold">
            Total Outstanding: {formatCurrency(grandTotal)}
          </div>
        </div>
      )}
    </div>
  )
}
