import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, Send, PhoneCall } from "lucide-react"


export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const overdueOrders = await prisma.salesOrder.findMany({
    where: {
      organizationId: session.user.organizationId,
      status: "INVOICED",
      createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    },
    include: { customer: true },
    orderBy: { createdAt: "asc" }
  })

  const totalOverdue = overdueOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="px-3 py-1 text-sm">
            ${totalOverdue.toLocaleString()} Overdue
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Collection Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84/100</div>
            <Progress value={84} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Days to Pay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42 Days</div>
            <p className="text-xs text-red-500 mt-1 flex items-center">
              <AlertCircle className="mr-1 h-3 w-3" /> +4 days from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Automated Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground mt-1">12 sent this week</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overdue Invoices</CardTitle>
          <CardDescription>Customers with outstanding balances past 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Last Action</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueOrders.map((order) => {
                const days = Math.floor((Date.now() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.customer.name}</TableCell>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell className="text-red-600 font-semibold">${order.totalAmount.toLocaleString()}</TableCell>
                    <TableCell>{days} days</TableCell>
                    <TableCell className="text-muted-foreground text-sm italic">Email sent 2d ago</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" title="Call Customer">
                          <PhoneCall className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" title="Send Manual Reminder">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {overdueOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Great! No overdue invoices found.
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
