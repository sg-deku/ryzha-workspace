"use client"

import { useState, useEffect } from "react"
import { AnomalyCard } from "@/components/alerts/anomaly-card"
import { Button } from "@/components/ui/button"

export function DashboardAlerts() {
  const [anomalies, setAnomalies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAnomalies = async () => {
    try {
      const res = await fetch("/api/expenses/alert")
      if (res.ok) setAnomalies(await res.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnomalies()
  }, [])

  const handleBulkResolve = async () => {
    try {
      await fetch("/api/expenses/alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolve_all" })
      })
      setAnomalies([])
    } catch (err) {
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-primary/5 p-4 rounded-full mb-4">
          <span className="text-3xl">✅</span>
        </div>
        <h3 className="text-lg font-medium text-foreground">No anomalies detected</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-[280px]">
          Our AI audit agents have reviewed your recent expenses and found no irregularities.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span>🔔</span> Expense Anomalies
        </h2>
        <Button 
          variant="ghost"
          size="sm"
          onClick={handleBulkResolve}
          className="text-xs text-primary hover:underline h-auto p-0"
        >
          Mark all as reviewed
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {anomalies.map(a => (
          <AnomalyCard key={a.id} anomaly={a} onResolve={fetchAnomalies} />
        ))}
      </div>
    </div>
  )
}
