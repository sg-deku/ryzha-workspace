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

export default async function VendorsPage({
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

  const [vendors, total, activeCount] = await Promise.all([
    prisma.vendor.findMany({
      where,
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (currentPage - 1) * PAGE_SIZE,
    }),
    prisma.vendor.count({ where }),
    prisma.vendor.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
  ])

  return (
    <PageShell
      title="Vendors"
      subtitle="Manage your supplier relationships and payment terms."
      newHref="/vendors/new"
      newLabel="New Vendor"
      kpis={[
        { label: "Total Vendors", value: total },
        { label: "Active", value: activeCount },
        { label: "Inactive", value: total - activeCount },
      ]}
    >
      <Suspense>
        <ListSearch
          placeholder="Search by name..."
          statusOptions={[
            { value: "ACTIVE", label: "Active" },
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
                <TableHead>Tax ID</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {vendor.vendorNumber || "—"}
                  </TableCell>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.email || "—"}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.status === "ACTIVE" ? "default" : "secondary"}>
                      {vendor.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{vendor.taxId || "—"}</TableCell>
                  <TableCell>{vendor.paymentTerms || "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendors/${vendor.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/vendors/${vendor.id}`}>View</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {vendors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No vendors found.
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
