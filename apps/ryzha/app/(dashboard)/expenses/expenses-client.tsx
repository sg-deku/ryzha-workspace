"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Upload, Brain, Sparkles, Filter, MoreHorizontal, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonWithLoading } from "@/components/ui/button-with-loading"
import { ExpenseTable } from "@/components/expenses/expense-table"
import { AICategorizeProgress } from "@/components/expenses/ai-categorize-progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SkeletonCard } from "@/components/ui/skeleton-card"

const CategoryChart = dynamic(() => import("@/components/expenses/category-chart").then(mod => mod.CategoryChart), {
  ssr: false,
  loading: () => <SkeletonCard />
})

interface Expense {
  id: string
  date: string
  description: string
  amount: number
  category: string | null
  status: string
}

interface ExpensesClientProps {
  initialExpenses: Expense[]
  chartData: { name: string; value: number }[]
}

export function ExpensesClient({ initialExpenses, chartData }: ExpensesClientProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const totalToProcess = initialExpenses.filter(e => e.status === 'PENDING').length

  const router = useRouter()
  
  const handleCategorizeAll = async () => {
    if (totalToProcess === 0) return
    
    setIsProcessing(true)
    setProcessedCount(0)
    
    const pendingExpenses = initialExpenses.filter(e => e.status === 'PENDING')
    
    for (let i = 0; i < pendingExpenses.length; i++) {
      try {
        await fetch("/api/expenses/ai-categorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ expenseId: pendingExpenses[i].id })
        })
      } catch (err) {
        console.error("Failed to categorize", err)
      }
      setProcessedCount(i + 1)
    }
    
    setIsProcessing(false)
    router.refresh()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Track and categorize your business spending.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" asChild>
            <Link href="/expenses/new">
              <Upload className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/expenses/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Link>
          </Button>
          <ButtonWithLoading 
            className="bg-purple-600 hover:bg-purple-700 text-white"
            onClick={handleCategorizeAll}
            isLoading={isProcessing}
            loadingText={`Categorizing (${processedCount}/${totalToProcess})`}
            disabled={totalToProcess === 0}
          >
            <Brain className="mr-2 h-4 w-4" />
            Categorize All ({totalToProcess})
          </ButtonWithLoading>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AICategorizeProgress 
            isProcessing={isProcessing}
            totalItems={totalToProcess}
            processedItems={processedCount}
            onComplete={() => setIsProcessing(false)}
          />
          
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
            <CardContent className="p-8 flex flex-col justify-between min-h-[160px]">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Total Monthly Spending</p>
                <h2 className="text-4xl font-bold">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                    initialExpenses.reduce((sum, e) => sum + e.amount, 0)
                  )}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-indigo-100 mt-4">
                <div className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  <span>{totalToProcess} pending review</span>
                </div>
                <div className="h-1 w-1 rounded-full bg-indigo-300" />
                <span>Last updated just now</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpenseTable 
                initialExpenses={initialExpenses} 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <CategoryChart 
                data={chartData} 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
