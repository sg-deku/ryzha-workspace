"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { SkeletonCard } from "@/components/ui/skeleton-card"

const CashFlowForecast = dynamic(() => import("@/app/(dashboard)/dashboard/cashflow-chart").then(mod => mod.CashFlowForecast), {
  ssr: false,
  loading: () => <SkeletonCard />
})

export default function CashFlowReportPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cash Flow Report</h2>
          <p className="text-muted-foreground">Historical and forecasted liquidity</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cash Flow Forecast & Scenario Planning</CardTitle>
            <CardDescription>Use AI to forecast your cash runway and test different spending scenarios.</CardDescription>
          </CardHeader>
          <CardContent>
            <CashFlowForecast />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
