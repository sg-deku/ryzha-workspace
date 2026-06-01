"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { ArrowLeft, Download, RefreshCw, TrendingUp, TrendingDown, Minus } from "lucide-react"
import Link from "next/link"

interface Budget {
  id: string
  name: string
  fiscalYear: number
  period: string
  status: string
}

interface VarianceLine {
  periodLabel: string
  accountName: string
  accountType: string
  budgeted: number
  actual: number
  variance: number
  variancePct: number | null
}

interface VarianceResult {
  budget: {
    id: string
    name: string
    fiscalYear: number
    period: string
    currency: string
  }
  results: VarianceLine[]
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Math.abs(v))
}

function VarianceBadge({ variance, pct }: { variance: number; pct: number | null }) {
  if (Math.abs(variance) < 1) {
    return (
      <Badge variant="secondary" className="gap-1 font-mono text-xs">
        <Minus className="h-3 w-3" /> On budget
      </Badge>
    )
  }
  const isOver = variance < 0
  return (
    <Badge
      className={`gap-1 font-mono text-xs ${isOver ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"}`}
    >
      {isOver ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
      {isOver ? "Over" : "Under"} {pct !== null ? `${Math.abs(pct).toFixed(1)}%` : ""}
    </Badge>
  )
}

export function BudgetVsActualsClient({ budgets }: { budgets: Budget[] }) {
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>(budgets[0]?.id ?? "")
  const [data, setData] = useState<VarianceResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")

  const fetchVariance = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/budgets/${id}/variance`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedBudgetId) fetchVariance(selectedBudgetId)
  }, [selectedBudgetId, fetchVariance])

  const filteredLines = data?.results.filter(l =>
    filterType === "all" ? true : l.accountType === filterType
  ) ?? []

  const accountTypes = data ? [...new Set(data.results.map(l => l.accountType))].sort() : []

  const periodMap: Record<string, { budgeted: number; actual: number }> = {}
  for (const line of filteredLines) {
    if (!periodMap[line.periodLabel]) periodMap[line.periodLabel] = { budgeted: 0, actual: 0 }
    periodMap[line.periodLabel].budgeted += line.budgeted
    periodMap[line.periodLabel].actual += line.actual
  }
  const chartData = Object.entries(periodMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, vals]) => ({
      period,
      Budgeted: Math.round(vals.budgeted),
      Actual: Math.round(vals.actual),
      variance: Math.round(vals.budgeted - vals.actual),
    }))

  const totals = filteredLines.reduce(
    (acc, l) => {
      acc.budgeted += l.budgeted
      acc.actual += l.actual
      acc.variance += l.variance
      return acc
    },
    { budgeted: 0, actual: 0, variance: 0 }
  )

  const handleExportCsv = () => {
    if (!data) return
    const header = "Period,Account Name,Account Type,Budgeted,Actual,Variance,Variance %\n"
    const rows = filteredLines
      .map(
        l =>
          `"${l.periodLabel}","${l.accountName}","${l.accountType}",${l.budgeted},${l.actual},${l.variance},${l.variancePct ?? ""}`
      )
      .join("\n")
    const blob = new Blob([header + rows], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `budget-vs-actuals-${data.budget.name.replace(/\s+/g, "-")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Budget vs Actuals</h2>
            {data && (
              <p className="text-muted-foreground">
                {data.budget.name} · FY{data.budget.fiscalYear} · {data.budget.period}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => fetchVariance(selectedBudgetId)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={!data}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Budget:</span>
          <Select value={selectedBudgetId} onValueChange={setSelectedBudgetId}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select budget" />
            </SelectTrigger>
            <SelectContent>
              {budgets.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name} (FY{b.fiscalYear})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {accountTypes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type:</span>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {accountTypes.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {budgets.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No budgets found. Create a budget first to compare against actuals.
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Budgeted</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(totals.budgeted)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Actual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{fmt(totals.actual)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Net Variance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${totals.variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {totals.variance >= 0 ? "+" : "-"}{fmt(totals.variance)}
                </p>
              </CardContent>
            </Card>
          </div>

          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget vs Actual by Period</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, ""]} />
                    <Legend />
                    <Bar dataKey="Budgeted" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Actual" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Line-by-Line Variance</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLines.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No data for selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredLines.map((line, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">{line.periodLabel}</TableCell>
                      <TableCell className="font-medium">{line.accountName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{line.accountType}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">{fmt(line.budgeted)}</TableCell>
                      <TableCell className="text-right font-mono">{fmt(line.actual)}</TableCell>
                      <TableCell className={`text-right font-mono ${line.variance >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {line.variance >= 0 ? "+" : "-"}{fmt(line.variance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <VarianceBadge variance={line.variance} pct={line.variancePct} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
