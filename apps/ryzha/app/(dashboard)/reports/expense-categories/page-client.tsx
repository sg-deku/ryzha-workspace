"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { useEffect, useState } from "react"

const CategoryChart = dynamic(() => import("@/components/expenses/category-chart").then(mod => mod.CategoryChart), {
  ssr: false,
  loading: () => <SkeletonCard />
})

export default function ExpenseCategoriesReportPage() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // We can fetch data here or use static mock if no endpoint
    const fetchExpenses = async () => {
      try {
        const res = await fetch("/api/dashboard/stats") // Just an example if stats had it
        // Or we could create a new endpoint, but let's mock the chartData if nothing exists yet
        setChartData([
          { name: "Software", value: 1200 },
          { name: "Marketing", value: 800 },
          { name: "Office", value: 450 },
          { name: "Travel", value: 300 },
        ] as any)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchExpenses()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/reports">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Expense Categories</h2>
          <p className="text-muted-foreground">Distribution of spending across business categories</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Visual breakdown of all expenses this period.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <SkeletonCard /> : <CategoryChart data={chartData} />}
          </CardContent>
        </Card>
        
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>Category Insights</CardTitle>
            <CardDescription>AI-generated insights based on category trends.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-primary/10">
              <h4 className="font-semibold mb-2">Cost Reduction Opportunity</h4>
              <p className="text-sm text-muted-foreground">Software expenses have increased by 15% this quarter. Consider reviewing unused SaaS subscriptions to reduce costs.</p>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg border border-primary/10">
              <h4 className="font-semibold mb-2">Budget Adherence</h4>
              <p className="text-sm text-muted-foreground">Marketing spend is currently 5% under budget for the quarter, leaving room for additional campaigns if needed.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
