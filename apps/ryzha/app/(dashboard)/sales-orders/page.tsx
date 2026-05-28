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

export default async function SalesOrdersPage({
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
        { orderNumber: { contains: q, mode: "insensitive" as const } },
        { customer: { name: { contains: q, mode: "insensitive" as const } } },
      ],
    }),
  }

  const [orders, total, openAmount] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.salesOrder.count({ where }),
    prisma.salesOrder.aggregate({
      where: { organizationId: orgId, status: { in: ["APPROVED", "INVOICED"] } },
      _sum: { totalAmount: true },
    }),
  ])

  const draftCount = await prisma.salesOrder.count({ where: { organizationId: orgId, status: "DRAFT" } })

  return (
    <PageShell
      title="Sales Orders"
      subtitle="Track customer orders from creation to fulfillment."
      newHref="/sales-orders/new"
      newLabel="New Sales Order"
      kpis={[
        { label: "Total Orders", value: total },
        { label: "Draft", value: draftCount },
        { label: "Open Value", value: `$${(openAmount._sum.totalAmount ?? 0).toLocaleString()}` },
      ]}
    >
      <Suspense>
        <ListSearch
          placeholder="Search by order # or customer..."
          statusOptions={[
            { value: "DRAFT", label: "Draft" },
            { value: "APPROVED", label: "Approved" },
            { value: "INVOICED", label: "Invoiced" },
            { value: "SHIPPED", label: "Shipped" },
            { value: "PAID", label: "Paid" },
          ]}
        />
      </Suspense>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium font-mono text-sm">{order.orderNumber}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{order.status}</Badge>
                  </TableCell>
                  <TableCell>${order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{order.createdAt.toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sales-orders/${order.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/sales-orders/${order.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {orders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No sales orders found.
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
