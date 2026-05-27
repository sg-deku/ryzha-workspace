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
import { Suspense } from "react"


export const dynamic = "force-dynamic";

export default async function PurchasesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  const { q, status } = await searchParams

  const pos = await prisma.purchaseOrder.findMany({
    where: {
      organizationId: session.user.organizationId,
      ...(status && { status }),
      ...(q && {
        OR: [
          { poNumber: { contains: q, mode: "insensitive" } },
          { vendor: { name: { contains: q, mode: "insensitive" } } },
        ]
      }),
    },
    include: { vendor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Purchase Orders</h2>
        <Button asChild>
          <Link href="/purchases/new">
            <Plus className="mr-2 h-4 w-4" /> New PO
          </Link>
        </Button>
      </div>

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
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="font-medium">{po.poNumber}</TableCell>
                  <TableCell>{po.vendor.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {po.status}
                    </Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}
