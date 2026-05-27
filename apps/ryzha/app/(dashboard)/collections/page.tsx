import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Send, PhoneCall } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"


export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const organizationId = session.user.organizationId

  const [overdueOrders, paidInvoiceCount, allInvoiceCount, payments] = await Promise.all([
    prisma.salesOrder.findMany({
      where: {
        organizationId,
        status: { notIn: ["PAID", "CANCELLED"] },
        dueDate: { lt: new Date() }
      },
      include: { customer: true },
      orderBy: { dueDate: "asc" }
    }),
    prisma.invoice.count({ where: { organizationId, status: "PAID" } }),
    prisma.invoice.count({ where: { organizationId } }),
    prisma.payment.findMany({
      where: { organizationId },
      include: { invoice: { select: { issueDate: true } } }
    })
  ])

  const totalOverdue = overdueOrders.reduce((sum, o) => sum + o.totalAmount, 0)

  const collectionScore = allInvoiceCount > 0
    ? Math.round((paidInvoiceCount / allInvoiceCount) * 100)
    : 0

  const avgDaysToPay = payments.length > 0
    ? Math.round(
        payments.reduce((sum, p) => {
          const days = (p.paymentDate.getTime() - p.invoice.issueDate.getTime()) / 86400000
          return sum + days
        }, 0) / payments.length
      )
    : null

  return (
    <TooltipProvider>
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
              <div className="text-2xl font-bold">{collectionScore}/100</div>
              <Progress value={collectionScore} className="mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Days to Pay</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgDaysToPay !== null ? `${avgDaysToPay} Days` : "N/A"}
              </div>
              {avgDaysToPay === null && (
                <p className="text-xs text-muted-foreground mt-1">No payments recorded yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Automated Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Inactive</div>
              <p className="text-xs text-muted-foreground mt-1">Configure email in Settings to enable</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Overdue Invoices</CardTitle>
            <CardDescription>Customers with outstanding balances past their due date.</CardDescription>
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
                  const days = order.dueDate ? Math.floor((Date.now() - order.dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.customer.name}</TableCell>
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell className="text-red-600 font-semibold">${order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{days} days</TableCell>
                      <TableCell className="text-muted-foreground text-sm italic">No action taken</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button variant="outline" size="icon" disabled title="Call Customer">
                                  <PhoneCall className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Configure Twilio in Settings to enable calls</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span>
                                <Button variant="outline" size="icon" disabled title="Send Reminder">
                                  <Send className="h-4 w-4" />
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>Configure email in Settings to enable reminders</TooltipContent>
                          </Tooltip>
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
    </TooltipProvider>
  )
}
