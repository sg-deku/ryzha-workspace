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

export default async function CustomersPage({
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
    ...(q && { name: { contains: q, mode: "insensitive" as const } }),
    ...(status && { status }),
  }

  const [customers, total, activeCount, totalCredit] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.customer.count({ where }),
    prisma.customer.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    prisma.customer.aggregate({ where: { organizationId: orgId }, _sum: { creditLimit: true } }),
  ])

  return (
    <PageShell
      title="Customers"
      subtitle="Manage your customer accounts and credit limits."
      newHref="/customers/new"
      newLabel="New Customer"
      kpis={[
        { label: "Total Customers", value: total },
        { label: "Active", value: activeCount },
        { label: "On Hold / Inactive", value: total - activeCount },
        {
          label: "Total Credit Exposure",
          value: `$${(totalCredit._sum.creditLimit ?? 0).toLocaleString()}`,
        },
      ]}
    >
      <Suspense>
        <ListSearch
          placeholder="Search by name..."
          statusOptions={[
            { value: "ACTIVE", label: "Active" },
            { value: "ON_HOLD", label: "On Hold" },
            { value: "INACTIVE", label: "Inactive" },
          ]}
        />
      </Suspense>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">ID</TableHead>
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
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {customer.customerNumber || "—"}
                  </TableCell>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>${customer.creditLimit?.toLocaleString() ?? "0"}</TableCell>
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
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
    </PageShell>
  )
}
