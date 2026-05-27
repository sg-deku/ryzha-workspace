import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"
import { ListSearch } from "@/components/ui/list-search"
import { DataPagination } from "@/components/ui/data-pagination"
import { Suspense } from "react"

const PAGE_SIZE = 50

export const dynamic = "force-dynamic";

export default async function SalesOrdersPage({
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
        { orderNumber: { contains: q, mode: "insensitive" as const } },
        { customer: { name: { contains: q, mode: "insensitive" as const } } },
      ]
    }),
  }

  const [orders, total] = await Promise.all([
    prisma.salesOrder.findMany({
      where,
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.salesOrder.count({ where }),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Sales Orders</h2>
        <Button asChild>
          <Link href="/sales-orders/new">
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Link>
        </Button>
      </div>

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
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.status}
                    </Badge>
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
    </div>
  )
}
