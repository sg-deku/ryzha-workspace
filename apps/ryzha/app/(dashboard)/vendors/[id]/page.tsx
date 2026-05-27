import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, MapPin, Pencil } from "lucide-react"
import Link from "next/link"
import { VendorActivityTabs } from "./vendor-activity-tabs"

export const dynamic = "force-dynamic"

function formatAddress(address: any): string | null {
  if (!address) return null
  const parts = [address.street, address.city, address.postalCode, address.country].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

export default async function VendorDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const vendor = await prisma.vendor.findFirst({
    where: { id, organizationId: session.user.organizationId },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          vendorPayments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              method: true,
              referenceNumber: true,
              vendorInvoice: { select: { id: true, invoiceNumber: true } },
            },
          },
        },
      },
    },
  })

  if (!vendor) return notFound()

  const allPayments = vendor.invoices.flatMap((inv) => inv.vendorPayments)

  const totalSpend = vendor.invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0)

  const openPayables = vendor.invoices
    .filter((inv) => !["PAID", "CANCELLED"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.amount, 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  const addr = formatAddress(vendor.address)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{vendor.name}</h2>
            <Badge variant={vendor.status === "ACTIVE" ? "default" : "secondary"}>
              {vendor.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Vendor since {new Date(vendor.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/vendors/${vendor.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Spend (Paid)</p>
            <p className="text-2xl font-bold">{fmt(totalSpend)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open Payables</p>
            <p className="text-2xl font-bold">{fmt(openPayables)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Purchase Orders</p>
            <p className="text-2xl font-bold">{vendor.purchaseOrders.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendor.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{vendor.email}</p>
                </div>
              </div>
            )}
            {addr && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="text-sm">{addr}</p>
                </div>
              </div>
            )}
            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Tax ID</p>
                <p className="text-sm">{vendor.taxId || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Terms</p>
                <p className="text-sm">{vendor.paymentTerms || "NET30"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm">{new Date(vendor.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <VendorActivityTabs
              purchaseOrders={vendor.purchaseOrders.map((po) => ({
                id: po.id,
                poNumber: po.poNumber,
                status: po.status,
                totalAmount: po.totalAmount,
                createdAt: po.createdAt.toISOString(),
              }))}
              vendorInvoices={vendor.invoices.map((inv) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                status: inv.status,
                amount: inv.amount,
                dueDate: inv.dueDate.toISOString(),
              }))}
              payments={allPayments.map((p) => ({
                id: p.id,
                amount: p.amount,
                paymentDate: p.paymentDate.toISOString(),
                method: p.method,
                referenceNumber: p.referenceNumber ?? null,
                vendorInvoice: p.vendorInvoice,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
