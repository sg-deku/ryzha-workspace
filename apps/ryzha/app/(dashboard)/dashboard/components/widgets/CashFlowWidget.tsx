"use client"
import dynamic from "next/dynamic"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkeletonCard } from "@/components/ui/skeleton-card"

const CashFlowForecast = dynamic(
  () => import("../../cashflow-chart").then((mod) => mod.CashFlowForecast),
  { ssr: false, loading: () => <SkeletonCard /> }
)

export function CashFlowWidget() {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Cash Flow Forecast</CardTitle>
      </CardHeader>
      <CardContent>
        <CashFlowForecast />
      </CardContent>
    </Card>
  )
}
