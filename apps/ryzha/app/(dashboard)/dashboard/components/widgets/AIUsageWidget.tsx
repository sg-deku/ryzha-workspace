"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Zap, RefreshCw } from "lucide-react"
import Link from "next/link"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

interface UsageSummary {
  today: { totalTokens: number; calls: number }
  thisMonth: { totalTokens: number; calls: number }
  allTime: { totalTokens: number; calls: number }
}

export function AIUsageWidget() {
  const [data, setData] = useState<UsageSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/ai-usage")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Zap className="h-4 w-4 text-yellow-500" />
          AI Token Usage
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading && !data ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">Today</p>
                <p className="text-lg font-bold tabular-nums">{fmt(data.today.totalTokens)}</p>
                <p className="text-[10px] text-muted-foreground">{data.today.calls} calls</p>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">This Month</p>
                <p className="text-lg font-bold tabular-nums">{fmt(data.thisMonth.totalTokens)}</p>
                <p className="text-[10px] text-muted-foreground">{data.thisMonth.calls} calls</p>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <p className="text-[10px] text-muted-foreground">All Time</p>
                <p className="text-lg font-bold tabular-nums">{fmt(data.allTime.totalTokens)}</p>
                <p className="text-[10px] text-muted-foreground">{data.allTime.calls} calls</p>
              </div>
            </div>
            <Link
              href="/settings/ai-usage"
              className="block text-center text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View full breakdown →
            </Link>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-3">No data available</p>
        )}
      </CardContent>
    </Card>
  )
}
