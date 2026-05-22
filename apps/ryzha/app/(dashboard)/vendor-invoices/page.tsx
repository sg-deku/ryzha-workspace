import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { FileText, Upload } from "lucide-react"


export const dynamic = "force-dynamic";

export default async function VendorInvoicesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const invoices = await prisma.vendorInvoice.findMany({
    where: { organizationId: session.user.organizationId },
    include: { vendor: true, purchaseOrder: true },
    orderBy: { createdAt: "desc" }
  })

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

      <Card>
        <CardHeader>
          <CardTitle>Payables</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
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
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/vendor-invoices/${inv.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No vendor invoices found.
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
