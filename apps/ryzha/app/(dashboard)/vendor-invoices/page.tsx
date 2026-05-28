import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload } from "lucide-react"
import { ListSearch } from "@/components/ui/list-search"
import { DataPagination } from "@/components/ui/data-pagination"
import { Suspense } from "react"

const PAGE_SIZE = 50

export const dynamic = "force-dynamic";

export default async function VendorInvoicesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, status, page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const where = {
    organizationId: session.user.organizationId,
    ...(status && { status }),
    ...(q && {
      OR: [
        { invoiceNumber: { contains: q, mode: "insensitive" as const } },
        { vendor: { name: { contains: q, mode: "insensitive" as const } } },
      ]
    }),
  }

  const [invoices, total] = await Promise.all([
    prisma.vendorInvoice.findMany({
      where,
      include: { vendor: true, purchaseOrder: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.vendorInvoice.count({ where }),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Vendor Invoices</h2>
        <Button asChild>
          <Link href="/vendor-invoices/upload">
            <Upload className="mr-2 h-4 w-4" /> Upload Invoice
          </Link>
        </Button>
      </div>

      <Suspense>
        <ListSearch
          placeholder="Search by invoice # or vendor..."
          statusOptions={[
            { value: "PENDING", label: "Pending" },
            { value: "MATCHED", label: "Matched" },
            { value: "APPROVED", label: "Approved" },
            { value: "PAID", label: "Paid" },
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Payables</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Internal #</TableHead>
                <TableHead>Invoice #</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>PO #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{(inv as any).internalNumber || "—"}</TableCell>
                  <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                  <TableCell>{inv.vendor.name}</TableCell>
                  <TableCell>{inv.purchaseOrder?.poNumber || "Direct"}</TableCell>
                  <TableCell>
                    <Badge variant={inv.status === "MATCHED" ? "default" : "outline"}>
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${inv.amount.toLocaleString()}</TableCell>
                  <TableCell>{inv.dueDate.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendor-invoices/${inv.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendor-invoices/${inv.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No vendor invoices found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <Suspense>
            <DataPagination total={total} pageSize={PAGE_SIZE} currentPage={currentPage} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
