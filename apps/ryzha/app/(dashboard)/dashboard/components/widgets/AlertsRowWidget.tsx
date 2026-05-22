"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, ArrowRight, Clock } from "lucide-react"
import Link from "next/link"

interface AlertsRowWidgetProps {
  pendingPurchases?: number
  overdueSales?: number
}

export function AlertsRowWidget({ pendingPurchases = 0, overdueSales = 0 }: AlertsRowWidgetProps) {
  if (pendingPurchases === 0 && overdueSales === 0) return null

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {pendingPurchases > 0 && (
        <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending P2P Approvals</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingPurchases}</div>
            <p className="text-xs text-muted-foreground">Purchase orders waiting for your review.</p>
            <Button variant="link" className="px-0 h-auto mt-2 text-orange-600" asChild>
              <Link href="/purchases?status=PENDING_APPROVAL" className="flex items-center">
                Review Now <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      {overdueSales > 0 && (
        <Card className="border-red-200 bg-red-50/30 dark:bg-red-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue O2C Invoices</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueSales}</div>
            <p className="text-xs text-muted-foreground">Invoices past their due date.</p>
            <Button variant="link" className="px-0 h-auto mt-2 text-red-600" asChild>
              <Link href="/collections" className="flex items-center">
                Collect Payments <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
