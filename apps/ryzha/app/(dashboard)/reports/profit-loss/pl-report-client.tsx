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
import { Separator } from "@/components/ui/separator"
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
  DollarSign,
  Download,
  RefreshCw,
  ChartBar,
  ArrowLeftRight,
} from "lucide-react"
import { format, subDays, startOfMonth, endOfMonth, startOfYear, subMonths, subYears } from "date-fns"

const PRESETS = [
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "last_3_months", label: "Last 3 months" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
  { value: "custom", label: "Custom range" },
]

function resolvePreset(preset: string): { startDate: string | undefined; endDate: string | undefined } {
  const today = new Date()
  switch (preset) {
    case "last_30_days": return { startDate: format(subDays(today, 30), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "this_month": return { startDate: format(startOfMonth(today), "yyyy-MM-dd"), endDate: format(endOfMonth(today), "yyyy-MM-dd") }
    case "last_3_months": return { startDate: format(subDays(today, 90), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "this_year": return { startDate: format(startOfYear(today), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    default: return { startDate: undefined, endDate: undefined }
  }
}

function getPriorPeriod(preset: string, customStart?: string, customEnd?: string): { startDate: string; endDate: string; label: string } | null {
  const today = new Date()
  switch (preset) {
    case "last_30_days": return {
      startDate: format(subDays(today, 60), "yyyy-MM-dd"),
      endDate: format(subDays(today, 31), "yyyy-MM-dd"),
      label: "Prior 30 days",
    }
    case "this_month": {
      const prior = subMonths(today, 1)
      return {
        startDate: format(startOfMonth(prior), "yyyy-MM-dd"),
        endDate: format(endOfMonth(prior), "yyyy-MM-dd"),
        label: format(prior, "MMMM yyyy"),
      }
    }
    case "last_3_months": return {
      startDate: format(subDays(today, 180), "yyyy-MM-dd"),
      endDate: format(subDays(today, 91), "yyyy-MM-dd"),
      label: "Prior 3 months",
    }
    case "this_year": {
      const priorYear = subYears(today, 1)
      return {
        startDate: format(startOfYear(priorYear), "yyyy-MM-dd"),
        endDate: format(priorYear, "yyyy-MM-dd"),
        label: `${priorYear.getFullYear()}`,
      }
    }
    default: return null
  }
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(v))
}

function pct(v: number) { return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%` }

function variancePct(current: number, prior: number): number | null {
  if (prior === 0) return null
  return ((current - prior) / Math.abs(prior)) * 100
}

interface PLData {
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  operatingIncome: number
  otherIncome: number
  otherExpense: number
  netIncome: number
  netMargin: number
  totalExpenses: number
  revenueBreakdown: { name: string; amount: number }[]
  cogsBreakdown: { name: string; amount: number }[]
  opexBreakdown: { name: string; amount: number }[]
  expenseBreakdown: { name: string; amount: number }[]
}

interface MonthlyRow {
  month: string
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  netIncome: number
  expenses: number
}

function WaterfallRow({
  label,
  value,
  subLabel,
  indent = false,
  separator = false,
  bold = false,
  color,
  prior,
}: {
  label: string
  value: number
  subLabel?: string
  indent?: boolean
  separator?: boolean
  bold?: boolean
  color?: "green" | "red" | "blue" | "muted"
  prior?: number
}) {
  const colorClass =
    color === "green" ? "text-green-600 dark:text-green-400"
    : color === "red" ? "text-red-500 dark:text-red-400"
    : color === "blue" ? "text-blue-600 dark:text-blue-400"
    : ""

  const vp = prior !== undefined ? variancePct(value, prior) : null

  return (
    <>
      {separator && <tr><td colSpan={prior !== undefined ? 4 : 3}><Separator className="my-1" /></td></tr>}
      <tr className={`${bold ? "font-semibold" : ""} text-sm`}>
        <td className={`py-1 ${indent ? "pl-6" : ""} ${colorClass}`}>
          {label}
          {subLabel && <span className="text-xs text-muted-foreground ml-1">({subLabel})</span>}
        </td>
        <td className={`text-right py-1 font-mono ${bold ? "text-base" : ""} ${colorClass}`}>
          {value < 0 ? "-" : ""}{fmt(value)}
        </td>
        {prior !== undefined && (
          <td className="text-right py-1 font-mono text-muted-foreground">{prior < 0 ? "-" : ""}{fmt(prior)}</td>
        )}
        {prior !== undefined && (
          <td className="text-right py-1 font-mono">
            {vp !== null ? (
              <span className={vp >= 0 ? "text-emerald-600" : "text-red-500"}>
                {pct(vp)}
              </span>
            ) : "—"}
          </td>
        )}
      </tr>
    </>
  )
}

function PLWaterfall({ pl, prior, priorLabel }: { pl: PLData; prior?: PLData; priorLabel?: string }) {
  const hasComparative = !!prior

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Income Statement</CardTitle></CardHeader>
      <CardContent>
        <table className="w-full">
          <thead>
            <tr className="text-xs text-muted-foreground border-b">
              <th className="text-left py-1 font-medium">Line Item</th>
              <th className="text-right py-1 font-medium">Current</th>
              {hasComparative && <th className="text-right py-1 font-medium">{priorLabel}</th>}
              {hasComparative && <th className="text-right py-1 font-medium">Change</th>}
            </tr>
          </thead>
          <tbody>
            <WaterfallRow label="Revenue" value={pl.revenue} bold color="green" prior={prior?.revenue} />
            <WaterfallRow label="Cost of Goods Sold" value={-pl.cogs} indent color="red" prior={prior ? -prior.cogs : undefined} />
            <WaterfallRow
              label="Gross Profit"
              value={pl.grossProfit}
              subLabel={`${pl.grossMargin.toFixed(1)}% margin`}
              bold separator
              color={pl.grossProfit >= 0 ? "green" : "red"}
              prior={prior?.grossProfit}
            />
            <WaterfallRow label="Operating Expenses" value={-pl.operatingExpenses} indent color="red" prior={prior ? -prior.operatingExpenses : undefined} />
            <WaterfallRow
              label="Operating Income (EBIT)"
              value={pl.operatingIncome}
              bold separator
              color={pl.operatingIncome >= 0 ? "blue" : "red"}
              prior={prior?.operatingIncome}
            />
            {(pl.otherIncome > 0 || pl.otherExpense > 0 || (prior && (prior.otherIncome > 0 || prior.otherExpense > 0))) && (
              <>
                {pl.otherIncome > 0 && <WaterfallRow label="Other Income" value={pl.otherIncome} indent color="green" prior={prior?.otherIncome} />}
                {pl.otherExpense > 0 && <WaterfallRow label="Other Expense" value={-pl.otherExpense} indent color="red" prior={prior ? -prior.otherExpense : undefined} />}
              </>
            )}
            <WaterfallRow
              label="Net Income"
              value={pl.netIncome}
              subLabel={`${pl.netMargin.toFixed(1)}% margin`}
              bold separator
              color={pl.netIncome >= 0 ? "green" : "red"}
              prior={prior?.netIncome}
            />
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

function PLReportInner() {
  const searchParams = useSearchParams()
  const initialPreset = searchParams.get("preset") ?? "this_month"

  const [preset, setPreset] = useState(initialPreset)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [compareMode, setCompareMode] = useState(false)
  const [pl, setPL] = useState<PLData | null>(null)
  const [priorPL, setPriorPL] = useState<PLData | null>(null)
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

      if (compareMode) {
        const prior = getPriorPeriod(preset, startDate, endDate)
        if (prior) {
          const p2 = new URLSearchParams({ groupBy: "none", startDate: prior.startDate, endDate: prior.endDate })
          const res2 = await fetch(`/api/reports/pl?${p2}`)
          if (res2.ok) setPriorPL(await res2.json())
        }
      } else {
        setPriorPL(null)
      }
    } finally {
      setLoading(false)
    }
  }, [preset, startDate, endDate, compareMode])

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

  const priorPeriod = preset !== "custom" ? getPriorPeriod(preset) : null

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ChartBar className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profit & Loss</h1>
            <p className="text-muted-foreground text-sm">Income statement — Revenue → COGS → Gross Profit → EBIT → Net Income</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={tab === "realtime" ? fetchPL : fetchMonthly}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportSummary}>
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
            {priorPeriod && (
              <Button
                variant={compareMode ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setCompareMode(!compareMode)}
              >
                <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                vs {priorPeriod.label}
              </Button>
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
                        <div className="text-sm text-muted-foreground">Revenue</div>
                        {priorPL && (
                          <div className="text-xs text-muted-foreground">
                            vs {fmt(priorPL.revenue)}{" "}
                            {(() => { const v = variancePct(pl.revenue, priorPL.revenue); return v != null ? <span className={v >= 0 ? "text-green-600" : "text-red-500"}>{pct(v)}</span> : null })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2">
                        <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{fmt(pl.grossProfit)}</div>
                        <div className="text-sm text-muted-foreground">Gross Profit</div>
                        <div className="text-xs text-muted-foreground">{pl.grossMargin.toFixed(1)}% margin</div>
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
                        <div className="text-xs text-muted-foreground">{pl.netMargin.toFixed(1)}% net margin</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <div className="text-2xl font-bold">{fmt(pl.totalExpenses)}</div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        COGS {fmt(pl.cogs)} · OPEX {fmt(pl.operatingExpenses)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <PLWaterfall
                pl={pl}
                prior={priorPL ?? undefined}
                priorLabel={priorPeriod?.label}
              />

              <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                  <CardHeader><CardTitle className="text-base">Revenue</CardTitle></CardHeader>
                  <CardContent>
                    {pl.revenueBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No revenue data</p>
                    ) : (
                      <div className="space-y-2">
                        {pl.revenueBreakdown.map((r) => (
                          <div key={r.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate text-muted-foreground max-w-[180px]">{r.name}</span>
                              <span className="font-medium text-green-600">{fmt(r.amount)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-green-500" style={{ width: `${pl.revenue > 0 ? (r.amount / pl.revenue) * 100 : 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">COGS</CardTitle></CardHeader>
                  <CardContent>
                    {pl.cogsBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No COGS entries</p>
                    ) : (
                      <div className="space-y-2">
                        {pl.cogsBreakdown.map((e) => (
                          <div key={e.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate text-muted-foreground max-w-[180px]">{e.name}</span>
                              <span className="font-medium text-orange-500">{fmt(e.amount)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-orange-400" style={{ width: `${pl.cogs > 0 ? (e.amount / pl.cogs) * 100 : 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">OPEX</CardTitle></CardHeader>
                  <CardContent>
                    {pl.opexBreakdown.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No expense data</p>
                    ) : (
                      <div className="space-y-2">
                        {pl.opexBreakdown.map((e) => (
                          <div key={e.name} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="truncate text-muted-foreground max-w-[180px]">{e.name}</span>
                              <span className="font-medium text-red-500">{fmt(e.amount)}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-red-400" style={{ width: `${pl.operatingExpenses > 0 ? (e.amount / pl.operatingExpenses) * 100 : 0}%` }} />
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
                <CardHeader><CardTitle className="text-base">Revenue vs COGS vs OPEX (12 months)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="cogs" fill="#f97316" name="COGS" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="operatingExpenses" fill="#ef4444" name="OPEX" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Gross Profit & Net Income Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: any) => fmt(Number(v))} />
                      <Legend />
                      <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="netIncome" name="Net Income" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Monthly P&L Table</CardTitle>
                    {drillMonth && (
                      <Button variant="ghost" size="sm" onClick={() => setDrillMonth(null)} className="text-xs">✕ Clear</Button>
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
                          <TableHead className="text-right">COGS</TableHead>
                          <TableHead className="text-right">Gross Profit</TableHead>
                          <TableHead className="text-right">OPEX</TableHead>
                          <TableHead className="text-right">Net Income</TableHead>
                          <TableHead className="text-right">GM%</TableHead>
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
                            <TableCell className="text-right text-orange-500 font-mono">{fmt(row.cogs)}</TableCell>
                            <TableCell className={`text-right font-mono ${row.grossProfit >= 0 ? "text-blue-600" : "text-red-500"}`}>{row.grossProfit < 0 ? "-" : ""}{fmt(row.grossProfit)}</TableCell>
                            <TableCell className="text-right text-red-500 font-mono">{fmt(row.operatingExpenses)}</TableCell>
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
                            <TableCell className="text-right text-green-600 font-mono">{fmt(monthly.reduce((s, r) => s + r.revenue, 0))}</TableCell>
                            <TableCell className="text-right text-orange-500 font-mono">{fmt(monthly.reduce((s, r) => s + r.cogs, 0))}</TableCell>
                            <TableCell className="text-right text-blue-600 font-mono">{fmt(monthly.reduce((s, r) => s + r.grossProfit, 0))}</TableCell>
                            <TableCell className="text-right text-red-500 font-mono">{fmt(monthly.reduce((s, r) => s + r.operatingExpenses, 0))}</TableCell>
                            <TableCell className={`text-right font-mono ${monthly.reduce((s, r) => s + r.netIncome, 0) >= 0 ? "text-emerald-600" : "text-orange-600"}`}>
                              {(() => { const n = monthly.reduce((s, r) => s + r.netIncome, 0); return `${n < 0 ? "-" : ""}${fmt(n)}` })()}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
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
