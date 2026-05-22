"use client"

import { useEffect, useState } from "react"
import { KPICard } from "./kpi-card"

interface KPI {
  title: string
  value: string
  change: string
  data: number[]
}

export function KPIGrid() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats")
        if (res.ok) {
          const data = await res.json()
          setKpis(data)
        }
      } catch (error) {
        console.error("Failed to fetch KPIs", error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-wrap gap-4 mb-8">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-32 flex-1 min-w-[200px] bg-muted rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      {kpis.map((kpi, i) => (
        <div key={kpi.title} className="flex-1 min-w-[200px]">
          <KPICard
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            data={kpi.data}
            index={i}
          />
        </div>
      ))}
    </div>
  )
}