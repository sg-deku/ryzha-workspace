"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
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
  LineChart,
  Line,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Download,
  RefreshCw,
  ChartBar,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"

const PRESETS = [
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
  { value: "custom", label: "Custom range" },
]

function resolvePreset(preset: string) {
  const today = new Date()
  switch (preset) {
    case "last_30_days": return { startDate: format(subDays(today, 30), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "this_month": return { startDate: format(startOfMonth(today), "yyyy-MM-dd"), endDate: format(endOfMonth(today), "yyyy-MM-dd") }
    case "last_3_months": return { startDate: format(subDays(today, 90), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "this_year": return { startDate: format(startOfYear(today), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    default: return { startDate: undefined, endDate: undefined }
  }
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(v))
}

function pct(v: number) { return `${v.toFixed(1)}%` }

interface PLData {
  revenue: number
  expenses: number
  totalExpenses: number
  grossProfit: number
  netIncome: number
  grossMargin: number
  netMargin: number
  revenueBreakdown: { name: string; amount: number }[]
  expenseBreakdown: { name: string; amount: number }[]
}

interface MonthlyRow {
  month: string
  revenue: number
  expenses: number
  netIncome: number
  grossMargin: number
}

function PLReportInner() {
  const searchParams = useSearchParams()
  const initialPreset = searchParams.get("preset") ?? "this_month"

  const [preset, setPreset] = useState(initialPreset)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [pl, setPL] = useState<PLData | null>(null)
  const [monthly, setMonthly] = useState<MonthlyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyLoading, setMonthlyLoading] = useState(true)
  const [tab, setTab] = useState("realtime")
  const [drillMonth, setDrillMonth] = useState<MonthlyRow | null>(null)

  const fetchPL = useCallback(async () => {
    setLoading(true)
    try {
      const { startDate: s, endDate: e } = preset === "custom"
        ? { startDate, endDate }
        : resolvePreset(preset)
      const params = new URLSearchParams({ groupBy: "none" })
      if (s) params.set("startDate", s)
      if (e) params.set("endDate", e)
      const res = await fetch(`/api/reports/pl?${params}`)
      if (res.ok) setPL(await res.json())
    } finally {
      setLoading(false)
    }
  }, [preset, startDate, endDate])

  const fetchMonthly = useCallback(async () => {
    setMonthlyLoading(true)
    try {
      const res = await fetch("/api/reports/pl?groupBy=month&monthsBack=12")
      if (res.ok) {
        const data = await res.json()
        setMonthly(data.monthly)
      }
    } finally {
      setMonthlyLoading(false)
    }
  }, [])

  useEffect(() => { fetchPL() }, [fetchPL])
  useEffect(() => { fetchMonthly() }, [fetchMonthly])

  const handleExportSummary = () => {
    const { startDate: s, endDate: e } = preset === "custom"
      ? { startDate, endDate }
      : resolvePreset(preset)
    const params = new URLSearchParams({ groupBy: "none", format: "csv" })
    if (s) params.set("startDate", s)
    if (e) params.set("endDate", e)
    window.open(`/api/reports/pl?${params}`, "_blank")
  }

  const handleExportMonthly = () => {
    window.open("/api/reports/pl?groupBy=month&monthsBack=12&format=csv", "_blank")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ChartBar className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
            <p className="text-muted-foreground text-sm">Income statement across all modules</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={tab === "realtime" ? fetchPL : fetchMonthly}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={tab === "realtime" ? handleExportSummary : handleExportMonthly}>
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">Real-time P&L</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <div className="flex flex-wrap gap-2 items-end">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Period</label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="h-8 w-40 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {preset === "custom" && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">From</label>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 text-sm w-36" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">To</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 text-sm w-36" />
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
              </div>
              <Skeleton className="h-64" />
            </div>
          ) : pl ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 dark:bg-green-900 p-2">
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{fmt(pl.revenue)}</div>
                        <div className="text-sm text-muted-foreground">Total Revenue</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-red-100 dark:bg-red-900 p-2">
                        <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{fmt(pl.totalExpenses)}</div>
                        <div className="text-sm text-muted-foreground">Total Expenses</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-full p-2 ${pl.netIncome >= 0 ? "bg-emerald-100 dark:bg-emerald-900" : "bg-orange-100 dark:bg-orange-900"}`}>
                        <DollarSign className={`h-5 w-5 ${pl.netIncome >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"}`} />
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${pl.netIncome >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                          {pl.netIncome < 0 ? "-" : ""}{fmt(pl.netIncome)}
                        </div>
                        <div className="text-sm text-muted-foreground">Net Income</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <div className="text-2xl font-bold">{pct(pl.grossMargin)}</div>
                      <div className="text-sm text-muted-foreground">Gross Margin</div>
                      <div className="text-xs text-muted-foreground mt-1">Net Margin: {pct(pl.netMargin)}</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Revenue Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {pl.revenueBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No revenue data</p>
                    ) : (
                      <div className="space-y-2">
                        {pl.revenueBreakdown.map((r) => (
                          <div key={r.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate text-muted-foreground max-w-[220px]">{r.name}</span>
                              <span className="font-medium text-green-600">{fmt(r.amount)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-green-500"
                                style={{ width: `${pl.revenue > 0 ? (r.amount / pl.revenue) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Expense Breakdown</CardTitle></CardHeader>
                  <CardContent>
                    {pl.expenseBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No expense data</p>
                    ) : (
                      <div className="space-y-2">
                        {pl.expenseBreakdown.map((e) => (
                          <div key={e.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate text-muted-foreground max-w-[220px]">{e.name}</span>
                              <span className="font-medium text-red-500">{fmt(e.amount)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-red-500"
                                style={{ width: `${pl.totalExpenses > 0 ? (e.amount / pl.totalExpenses) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
          {monthlyLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-48" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader><CardTitle className="text-base">Revenue vs Expenses (12 months)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Net Income Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Line
                        type="monotone"
                        dataKey="netIncome"
                        name="Net Income"
                        stroke="#6366f1"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Monthly P&L Table</CardTitle>
                    {drillMonth && (
                      <Button variant="ghost" size="sm" onClick={() => setDrillMonth(null)} className="text-xs">
                        ✕ Clear
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Expenses</TableHead>
                          <TableHead className="text-right">Net Income</TableHead>
                          <TableHead className="text-right">Margin</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {monthly.map((row) => (
                          <TableRow
                            key={row.month}
                            className={`cursor-pointer hover:bg-muted/30 ${drillMonth?.month === row.month ? "bg-muted/50" : ""}`}
                            onClick={() => setDrillMonth(drillMonth?.month === row.month ? null : row)}
                          >
                            <TableCell className="font-medium">{row.month}</TableCell>
                            <TableCell className="text-right text-green-600 font-mono">{fmt(row.revenue)}</TableCell>
                            <TableCell className="text-right text-red-500 font-mono">{fmt(row.expenses)}</TableCell>
                            <TableCell className={`text-right font-mono font-semibold ${row.netIncome >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                              {row.netIncome < 0 ? "-" : ""}{fmt(row.netIncome)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge variant={row.grossMargin >= 0 ? "secondary" : "destructive"} className="font-mono text-xs">
                                {row.grossMargin}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                        {monthly.length > 0 && (
                          <TableRow className="font-bold border-t-2">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right text-green-600 font-mono">
                              {fmt(monthly.reduce((s, r) => s + r.revenue, 0))}
                            </TableCell>
                            <TableCell className="text-right text-red-500 font-mono">
                              {fmt(monthly.reduce((s, r) => s + r.expenses, 0))}
                            </TableCell>
                            <TableCell className={`text-right font-mono ${monthly.reduce((s, r) => s + r.netIncome, 0) >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                              {(() => { const n = monthly.reduce((s, r) => s + r.netIncome, 0); return `${n < 0 ? "-" : ""}${fmt(n)}` })()}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {drillMonth && (
                    <div className="mt-4 rounded-lg border bg-muted/20 p-4">
                      <p className="text-sm font-semibold mb-2">{drillMonth.month} detail</p>
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Revenue</span><br /><span className="font-mono font-medium text-green-600">{fmt(drillMonth.revenue)}</span></div>
                        <div><span className="text-muted-foreground">Expenses</span><br /><span className="font-mono font-medium text-red-500">{fmt(drillMonth.expenses)}</span></div>
                        <div><span className="text-muted-foreground">Net Income</span><br /><span className={`font-mono font-medium ${drillMonth.netIncome >= 0 ? "text-emerald-600" : "text-orange-600"}`}>{drillMonth.netIncome < 0 ? "-" : ""}{fmt(drillMonth.netIncome)}</span></div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function PLReportClient() {
  return (
    <Suspense fallback={<div className="h-32 w-full animate-pulse rounded-xl bg-muted" />}>
      <PLReportInner />
    </Suspense>
  )
}
