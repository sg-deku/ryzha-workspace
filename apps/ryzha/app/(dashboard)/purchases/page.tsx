import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ListSearch } from "@/components/ui/list-search"
import { DataPagination } from "@/components/ui/data-pagination"
import { PageShell } from "@/components/ui/page-shell"
import { Suspense } from "react"

const PAGE_SIZE = 50

export const dynamic = "force-dynamic"

export default async function PurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, status, page } = await searchParams
  const currentPage = Math.max(1, Number(page) || 1)

  const orgId = session.user.organizationId
  const where = {
    organizationId: orgId,
    ...(status && { status }),
    ...(q && {
      OR: [
        { poNumber: { contains: q, mode: "insensitive" as const } },
        { vendor: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [pos, total, openAmount] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: { vendor: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.aggregate({
      where: { organizationId: orgId, status: { in: ["SUBMITTED", "APPROVED"] } },
      _sum: { totalAmount: true },
    }),
  ])

  const draftCount = await prisma.purchaseOrder.count({ where: { organizationId: orgId, status: "DRAFT" } })

  return (
    <PageShell
      title="Purchase Orders"
      subtitle="Manage procurement requests and supplier orders."
      newHref="/purchases/new"
      newLabel="New Purchase Order"
      kpis={[
        { label: "Total POs", value: total },
        { label: "Draft", value: draftCount },
        { label: "Open Commitment", value: `$${(openAmount._sum.totalAmount ?? 0).toLocaleString()}` },
      ]}
    >
      <Suspense>
        <ListSearch
          placeholder="Search by PO # or vendor..."
          statusOptions={[
            { value: "DRAFT", label: "Draft" },
            { value: "SUBMITTED", label: "Submitted" },
            { value: "APPROVED", label: "Approved" },
            { value: "RECEIVED", label: "Received" },
            { value: "CLOSED", label: "Closed" },
          ]}
        />
      </Suspense>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PO Number</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pos.map((po) => (
                <TableRow key={po.id}>
                  <TableCell className="font-medium font-mono text-sm">{po.poNumber}</TableCell>
                  <TableCell>{po.vendor.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{po.status}</Badge>
                  </TableCell>
                  <TableCell>${po.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{po.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/purchases/${po.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/purchases/${po.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No purchase orders found.
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
    </PageShell>
  )
}
