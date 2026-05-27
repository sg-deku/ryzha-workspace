import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { UserPlus } from "lucide-react"
import { ListSearch } from "@/components/ui/list-search"
import { DataPagination } from "@/components/ui/data-pagination"
import { Suspense } from "react"

const PAGE_SIZE = 50

export const dynamic = "force-dynamic";

export default async function CustomersPage({
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
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
    ...(status && { status }),
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
        <Button asChild>
          <Link href="/customers/new">
            <UserPlus className="mr-2 h-4 w-4" /> Add Customer
          </Link>
        </Button>
      </div>

      <Suspense>
        <ListSearch
          placeholder="Search customers..."
          statusOptions={[
            { value: "ACTIVE", label: "Active" },
            { value: "ON_HOLD", label: "On Hold" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Credit Limit</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${customer.creditLimit?.toLocaleString() || "0"}</TableCell>
                  <TableCell>{customer.paymentTerms || "N/A"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/customers/${customer.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/customers/${customer.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {customers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No customers found.
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
