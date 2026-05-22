import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"


export const dynamic = "force-dynamic";

export default async function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user) redirect("/login")

  const customer = await prisma.customer.findUnique({
    where: { 
      id: params.id,
      organizationId: session.user.organizationId 
    },
    include: {
      salesOrders: {
        orderBy: { createdAt: "desc" },
        take: 5
      }
    }
  })

  if (!customer) return notFound()

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold tracking-tight">{customer.name}</h2>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Badge variant={customer.status === "ACTIVE" ? "default" : "secondary"}>
              {customer.status}
            </Badge>
            Customer Details
          </p>
        </div>
        <Button asChild>
          <Link href={`/customers/${customer.id}/edit`}>Edit Customer</Link>
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
                <p>{customer.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tax ID</p>
                <p>{customer.taxId || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Credit Limit</p>
                <p>${customer.creditLimit.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created</p>
                <p>{new Date(customer.createdAt).toLocaleDateString()}</p>
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
                <h4 className="font-semibold mb-2">Recent Sales Orders</h4>
                {customer.salesOrders.length > 0 ? (
                  <ul className="space-y-2">
                    {customer.salesOrders.map((order) => (
                      <li key={order.id} className="flex justify-between items-center text-sm border-b pb-2">
                        <Link href={`/sales-orders/${order.id}`} className="text-primary hover:underline">
                          {order.orderNumber}
                        </Link>
                        <span>${order.totalAmount.toFixed(2)}</span>
                        <Badge variant="outline">{order.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No sales orders found.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
