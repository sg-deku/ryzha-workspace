import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`
  return `$${n.toFixed(0)}`
}

function pctChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? "+100%" : "0%"
  const pct = ((current - previous) / previous) * 100
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

function monthStart(monthsAgo: number): Date {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  d.setMonth(d.getMonth() - monthsAgo)
  return d
}

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.organizationId

  const [settings, salesOrders, expenses7mo, transactions7mo, invoiceCount, expenseCount] = await Promise.all([
    prisma.financialSettings.findUnique({
      where: { organizationId: orgId },
      select: { bankBalance: true, averageMonthlyExpenses: true },
    }),
    prisma.salesOrder.findMany({
      where: { organizationId: orgId, status: "INVOICED" },
      select: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: { organizationId: orgId, date: { gte: monthStart(6) } },
      select: { amount: true, date: true },
    }),
    prisma.transaction.findMany({
      where: { organizationId: orgId, workflowStatus: "completed", createdAt: { gte: monthStart(6) } },
      select: { amount: true, createdAt: true },
    }),
    prisma.invoice.count({ where: { organizationId: orgId, status: { in: ["SENT", "OVERDUE"] } } }),
    prisma.expense.count({ where: { organizationId: orgId, status: "PENDING" } }),
  ])

  const bankBalance = settings?.bankBalance ?? 0
  const burnRate = settings?.averageMonthlyExpenses ?? 0
  const runway = burnRate > 0 ? bankBalance / burnRate : 0
  const outstandingTotal = salesOrders.reduce((s, o) => s + o.totalAmount, 0)

  const monthlyRevenue: number[] = []
  const monthlyExpenses: number[] = []
  for (let i = 6; i >= 0; i--) {
    const start = monthStart(i)
    const end = i === 0 ? new Date() : monthStart(i - 1)
    monthlyRevenue.push(
      transactions7mo.filter(t => new Date(t.createdAt) >= start && new Date(t.createdAt) < end).reduce((s, t) => s + t.amount, 0)
    )
    monthlyExpenses.push(
      expenses7mo.filter(e => new Date(e.date) >= start && new Date(e.date) < end).reduce((s, e) => s + e.amount, 0)
    )
  }

  const currentMRR = monthlyRevenue[6]
  const prevMRR = monthlyRevenue[5]
  const currentExpenses = monthlyExpenses[6]
  const prevExpenses = monthlyExpenses[5]

  return NextResponse.json({
    kpis: [
      { title: "Cash Balance", value: fmt(bankBalance), change: "", data: Array(7).fill(bankBalance) },
      { title: "Runway", value: runway > 0 ? `${runway.toFixed(1)} mo` : "—", change: "", data: Array(7).fill(runway) },
      { title: "Monthly Revenue", value: fmt(currentMRR), change: pctChange(currentMRR, prevMRR), data: monthlyRevenue },
      { title: "Burn Rate", value: burnRate > 0 ? `${fmt(burnRate)}/mo` : "—", change: pctChange(currentExpenses, prevExpenses), data: monthlyExpenses },
      { title: "Outstanding", value: fmt(outstandingTotal), change: `${invoiceCount} invoice${invoiceCount !== 1 ? "s" : ""}`, data: Array(7).fill(outstandingTotal) },
      { title: "Pending Expenses", value: `${expenseCount}`, change: "awaiting review", data: Array(7).fill(expenseCount) },
    ],
  })
}
