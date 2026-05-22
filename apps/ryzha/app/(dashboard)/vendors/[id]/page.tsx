import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Pencil } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"


export const dynamic = "force-dynamic";

export default async function VendorDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const vendor = await prisma.vendor.findUnique({
    where: { 
      id: params.id,
      organizationId: session.user.organizationId 
    },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 5
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  })

  if (!vendor) return notFound()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/vendors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{vendor.name}</h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Badge variant={vendor.status === "ACTIVE" ? "default" : "secondary"}>
                {vendor.status}
              </Badge>
              Vendor Details
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/vendors/${vendor.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{vendor.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                <p>{vendor.taxId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payment Terms</p>
                <p>{vendor.paymentTerms || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{new Date(vendor.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Recent Purchase Orders</h4>
                {vendor.purchaseOrders.length > 0 ? (
                  <ul className="space-y-2">
                    {vendor.purchaseOrders.map((po) => (
                      <li key={po.id} className="flex justify-between items-center text-sm border-b pb-2">
                        <Link href={`/purchases/${po.id}`} className="text-primary hover:underline">
                          {po.poNumber}
                        </Link>
                        <span>${po.totalAmount.toFixed(2)}</span>
                        <Badge variant="outline">{po.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No purchase orders found.</p>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recent Invoices</h4>
                {vendor.invoices.length > 0 ? (
                  <ul className="space-y-2">
                    {vendor.invoices.map((inv) => (
                      <li key={inv.id} className="flex justify-between items-center text-sm border-b pb-2">
                        <Link href={`/vendor-invoices/${inv.id}`} className="text-primary hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                        <span>${inv.amount.toFixed(2)}</span>
                        <Badge variant="outline">{inv.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No invoices found.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
