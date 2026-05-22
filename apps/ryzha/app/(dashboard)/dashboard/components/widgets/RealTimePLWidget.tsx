"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, DollarSign, RefreshCw, ArrowRight } from "lucide-react"
import Link from "next/link"

const PRESETS = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "this_month", label: "This month" },
  { value: "this_year", label: "This year" },
  { value: "all_time", label: "All time" },
]

interface PLWidgetData {
  revenue: number
  expenses: number
  netIncome: number
  grossMargin: number
  topRevenue: { name: string; amount: number }[]
  topExpenses: { name: string; amount: number }[]
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Math.abs(v))
}

interface RealTimePLWidgetProps {
  settings?: { dateRangePreset?: string }
  onSettingsChange?: (settings: Record<string, any>) => void
}

export function RealTimePLWidget({ settings, onSettingsChange }: RealTimePLWidgetProps) {
  const [preset, setPreset] = useState(settings?.dateRangePreset ?? "this_month")
  const [data, setData] = useState<PLWidgetData | null>(null)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async (p = preset) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/dashboard/pl-widget?preset=${p}`)
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [preset])

  useEffect(() => {
    fetchData(preset)
    intervalRef.current = setInterval(() => fetchData(preset), 60_000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [preset])

  const handlePresetChange = (v: string) => {
    setPreset(v)
    onSettingsChange?.({ dateRangePreset: v })
    fetchData(v)
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 pb-3">
        <CardTitle className="text-xl font-semibold">Profit & Loss</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={preset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRESETS.map((p) => (
                <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchData(preset)}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading || !data ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 p-3">
                <div className="flex items-center gap-1 text-xs text-green-700 dark:text-green-400 mb-1">
                  <TrendingUp className="h-3 w-3" /> Revenue
                </div>
                <div className="text-lg font-bold text-green-700 dark:text-green-400">{fmt(data.revenue)}</div>
              </div>
              <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3">
                <div className="flex items-center gap-1 text-xs text-red-700 dark:text-red-400 mb-1">
                  <TrendingDown className="h-3 w-3" /> Expenses
                </div>
                <div className="text-lg font-bold text-red-700 dark:text-red-400">{fmt(data.expenses)}</div>
              </div>
              <div className={`rounded-lg p-3 ${data.netIncome >= 0 ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-orange-50 dark:bg-orange-950/30"}`}>
                <div className={`flex items-center gap-1 text-xs mb-1 ${data.netIncome >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"}`}>
                  <DollarSign className="h-3 w-3" /> Net Income
                </div>
                <div className={`text-lg font-bold ${data.netIncome >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"}`}>
                  {data.netIncome < 0 ? "-" : ""}{fmt(data.netIncome)}
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3">
                <div className="flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 mb-1">
                  Margin
                </div>
                <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                  {data.grossMargin.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Top Revenue</p>
                <div className="space-y-1">
                  {data.topRevenue.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data</p>
                  ) : data.topRevenue.map((r) => (
                    <div key={r.name} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground max-w-[140px]">{r.name}</span>
                      <span className="font-medium text-green-600">{fmt(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Top Expenses</p>
                <div className="space-y-1">
                  {data.topExpenses.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No data</p>
                  ) : data.topExpenses.map((e) => (
                    <div key={e.name} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground max-w-[140px]">{e.name}</span>
                      <span className="font-medium text-red-500">{fmt(e.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-1 border-t">
              <Link
                href={`/reports/profit-loss?preset=${preset}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                View full P&L report <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
