import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Phone, MapPin, FileText, CreditCard } from "lucide-react"
import Link from "next/link"
import { CustomerActivityTabs } from "./customer-activity-tabs"

export const dynamic = "force-dynamic"

function formatAddress(address: any): string | null {
  if (!address) return null
  const parts = [address.street, address.city, address.postalCode, address.country].filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

export default async function CustomerDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session?.user) redirect("/login")

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: session.user.organizationId },
  })

  if (!customer) return notFound()

  const [invoices, salesOrders] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId: session.user.organizationId,
        OR: [
          { customerId: id },
          ...(customer.email ? [{ clientEmail: { equals: customer.email, mode: "insensitive" } }] : []),
        ],
      },
      orderBy: { issueDate: "desc" },
      take: 50,
      include: {
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            method: true,
            referenceNumber: true,
            invoice: { select: { id: true, invoiceNumber: true } },
          },
        },
        creditNotes: {
          select: {
            id: true,
            amount: true,
            issueDate: true,
            reasonCategory: true,
            reason: true,
            invoice: { select: { id: true, invoiceNumber: true } },
          },
        },
      },
    }),
    prisma.salesOrder.findMany({
      where: {
        organizationId: session.user.organizationId,
        customerId: id,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
  ])

  const allPayments = invoices.flatMap((inv) => inv.payments)
  const allCreditNotes = invoices.flatMap((inv) => inv.creditNotes)

  const totalRevenue = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.total, 0)

  const openBalance = invoices
    .filter((inv) => !["PAID", "VOID", "REFUNDED"].includes(inv.status))
    .reduce((sum, inv) => sum + inv.total, 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n)

  const addr = formatAddress(customer.address)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
            <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
              {customer.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Customer since {new Date(customer.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p>
        </div>
        <Button asChild>
          <Link href={`/customers/${customer.id}/edit`}>Edit Customer</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Open Balance</p>
            <p className="text-2xl font-bold">{fmt(openBalance)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Credit Limit</p>
            <p className="text-2xl font-bold">{fmt(customer.creditLimit ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customer.email && (
              <div className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm">{customer.phone}</p>
                </div>
              </div>
            )}
            {addr && (
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Billing Address</p>
                  <p className="text-sm">{addr}</p>
                </div>
              </div>
            )}
            <div className="border-t pt-4 space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Tax ID</p>
                <p className="text-sm">{customer.taxId || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Terms</p>
                <p className="text-sm">{customer.paymentTerms || "NET30"}</p>
              </div>
            </div>
            {customer.notes && (
              <div className="border-t pt-4">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerActivityTabs
              salesOrders={salesOrders.map((o) => ({
                id: o.id,
                orderNumber: o.orderNumber,
                status: o.status,
                totalAmount: o.totalAmount,
                dueDate: o.dueDate?.toISOString() ?? null,
                createdAt: o.createdAt.toISOString(),
              }))}
              invoices={invoices.map((inv) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                status: inv.status,
                total: inv.total,
                issueDate: inv.issueDate.toISOString(),
                dueDate: inv.dueDate.toISOString(),
              }))}
              payments={allPayments.map((p) => ({
                id: p.id,
                amount: p.amount,
                paymentDate: p.paymentDate.toISOString(),
                method: p.method,
                referenceNumber: p.referenceNumber ?? null,
                invoice: p.invoice,
              }))}
              creditNotes={allCreditNotes.map((cn) => ({
                id: cn.id,
                amount: cn.amount,
                issueDate: cn.issueDate.toISOString(),
                reasonCategory: cn.reasonCategory,
                reason: cn.reason ?? null,
                invoice: cn.invoice,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
