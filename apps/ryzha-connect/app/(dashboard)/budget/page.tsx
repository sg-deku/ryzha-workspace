"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle2, Pencil } from "lucide-react"

interface MonthlyRow {
  label: string
  actualRevenue: number
  actualExpenses: number
  budgetExpenses: number
  variance: number | null
  variancePct: number | null
  netIncome: number
}

interface BudgetData {
  monthlyBudget: number
  monthlyData: MonthlyRow[]
  currentMonth: MonthlyRow
  expenseBreakdown: { type: string; amount: number }[]
}

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
}

function StatCard({
  label,
  value,
  sub,
  trend,
}: {
  label: string
  value: string
  sub?: string
  trend?: "up" | "down" | "neutral"
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && (
        <p className={`text-xs flex items-center gap-1 ${trend === "up" ? "text-emerald-600" : trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
          {trend === "up" && <TrendingUp className="h-3 w-3" />}
          {trend === "down" && <TrendingDown className="h-3 w-3" />}
          {sub}
        </p>
      )}
    </div>
  )
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  EXPENSE_CREATED: "Expenses",
  BILL_CREATED: "Bills / AP",
  PAYROLL_PROCESSED: "Payroll",
}

export default function BudgetPage() {
  const [data, setData] = React.useState<BudgetData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [editingBudget, setEditingBudget] = React.useState(false)
  const [budgetInput, setBudgetInput] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/budget")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { fetchData() }, [fetchData])

  async function saveBudget() {
    const val = parseFloat(budgetInput.replace(/[^0-9.]/g, ""))
    if (isNaN(val) || val < 0) return
    setSaving(true)
    try {
      await fetch("/api/budget", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyBudget: val }),
      })
      await fetchData()
      setEditingBudget(false)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-muted rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  const { monthlyBudget, monthlyData, currentMonth, expenseBreakdown } = data
  const budgetUsedPct = monthlyBudget > 0 ? (currentMonth.actualExpenses / monthlyBudget) * 100 : null
  const overBudget = budgetUsedPct !== null && budgetUsedPct > 100

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget vs Actuals</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track spending against your monthly budget target across the last 6 months.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {editingBudget ? (
            <>
              <input
                value={budgetInput}
                onChange={(e) => setBudgetInput(e.target.value)}
                placeholder="Monthly budget"
                className="text-sm border rounded-lg px-3 py-1.5 w-40 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") saveBudget(); if (e.key === "Escape") setEditingBudget(false) }}
              />
              <button onClick={saveBudget} disabled={saving} className="text-sm bg-primary text-primary-foreground rounded-lg px-3 py-1.5 hover:bg-primary/90 transition-colors disabled:opacity-60">
                {saving ? "Saving..." : "Save"}
              </button>
              <button onClick={() => setEditingBudget(false)} className="text-sm border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors">
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => { setBudgetInput(String(monthlyBudget)); setEditingBudget(true) }}
              className="flex items-center gap-2 text-sm border rounded-lg px-4 py-2 hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4" />
              {monthlyBudget > 0 ? `Budget: ${fmt(monthlyBudget)}/mo` : "Set monthly budget"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue this month"
          value={fmt(currentMonth.actualRevenue)}
          sub={currentMonth.actualRevenue > 0 ? "vs last month" : "No data yet"}
          trend="neutral"
        />
        <StatCard
          label="Expenses this month"
          value={fmt(currentMonth.actualExpenses)}
          sub={budgetUsedPct !== null ? `${budgetUsedPct.toFixed(0)}% of budget` : "No budget set"}
          trend={overBudget ? "down" : "neutral"}
        />
        <StatCard
          label="Monthly budget"
          value={monthlyBudget > 0 ? fmt(monthlyBudget) : "Not set"}
          sub={currentMonth.variance !== null ? `${fmt(Math.abs(currentMonth.variance))} ${currentMonth.variance > 0 ? "over" : "under"}` : undefined}
          trend={currentMonth.variance !== null ? (currentMonth.variance > 0 ? "down" : "up") : "neutral"}
        />
        <StatCard
          label="Net income"
          value={fmt(Math.abs(currentMonth.netIncome))}
          sub={currentMonth.netIncome >= 0 ? "Profitable" : "Operating at loss"}
          trend={currentMonth.netIncome >= 0 ? "up" : "down"}
        />
      </div>

      {monthlyBudget > 0 && budgetUsedPct !== null && (
        <div className={`rounded-xl border p-5 ${overBudget ? "border-red-200 bg-red-50/40 dark:border-red-900/40 dark:bg-red-950/10" : "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/10"}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {overBudget ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              <p className="text-sm font-semibold">
                {overBudget ? "Over budget this month" : "Within budget this month"}
              </p>
            </div>
            <span className={`text-sm font-bold ${overBudget ? "text-red-600" : "text-emerald-600"}`}>
              {budgetUsedPct.toFixed(0)}% used
            </span>
          </div>
          <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${overBudget ? "bg-red-500" : budgetUsedPct > 80 ? "bg-yellow-500" : "bg-emerald-500"}`}
              style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
            <span>{fmt(currentMonth.actualExpenses)} spent</span>
            <span>{fmt(monthlyBudget)} budget</span>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <p className="font-semibold text-sm">6-Month Trend</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Revenue</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Expenses</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Budget</th>
                <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Variance</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {monthlyData.map((row, i) => {
                const isCurrentMonth = i === monthlyData.length - 1
                return (
                  <tr key={row.label} className={`hover:bg-muted/20 transition-colors ${isCurrentMonth ? "bg-primary/5 font-medium" : ""}`}>
                    <td className="px-5 py-3">
                      {row.label}
                      {isCurrentMonth && <span className="ml-2 text-[10px] bg-primary/10 text-primary rounded px-1.5 py-0.5 font-medium">Current</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">{fmt(row.actualRevenue)}</td>
                    <td className="px-4 py-3 text-right text-red-500">{fmt(row.actualExpenses)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.budgetExpenses > 0 ? fmt(row.budgetExpenses) : "-"}</td>
                    <td className={`px-4 py-3 text-right ${row.variance === null ? "text-muted-foreground" : row.variance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                      {row.variance !== null
                        ? `${row.variance > 0 ? "+" : ""}${fmt(Math.abs(row.variance))}`
                        : "-"}
                    </td>
                    <td className={`px-5 py-3 text-right font-medium ${row.netIncome >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {fmt(row.netIncome)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {expenseBreakdown.length > 0 && (
        <div className="rounded-xl border bg-card p-5">
          <p className="font-semibold text-sm mb-4">Expense Breakdown (Current Month)</p>
          <div className="space-y-3">
            {expenseBreakdown.map((e) => {
              const total = expenseBreakdown.reduce((s, x) => s + x.amount, 0)
              const share = total > 0 ? (e.amount / total) * 100 : 0
              return (
                <div key={e.type} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{EVENT_TYPE_LABELS[e.type] ?? e.type}</span>
                    <span className="font-medium">{fmt(e.amount)} ({share.toFixed(0)}%)</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${share}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
