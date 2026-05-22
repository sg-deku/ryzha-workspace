import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
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

function monthEnd(monthsAgo: number): Date {
  const d = monthStart(monthsAgo - 1)
  d.setMilliseconds(d.getMilliseconds() - 1)
  return d
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgId = session.user.organizationId

  const [settings, salesOrders, expenses7mo, transactions7mo] = await Promise.all([
    prisma.financialSettings.findUnique({
      where: { organizationId: orgId },
      select: { bankBalance: true, averageMonthlyExpenses: true },
    }),
    prisma.salesOrder.findMany({
      where: { organizationId: orgId, status: "INVOICED" },
      select: { totalAmount: true },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: orgId,
        date: { gte: monthStart(6) },
      },
      select: { amount: true, date: true },
    }),
    prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        workflowStatus: "completed",
        createdAt: { gte: monthStart(6) },
      },
      select: { amount: true, createdAt: true },
    }),
  ])

  const bankBalance = settings?.bankBalance ?? 0

  const outstandingTotal = salesOrders.reduce((s, o) => s + o.totalAmount, 0)

  const monthlyRevenue: number[] = []
  const monthlyExpenses: number[] = []
  for (let i = 6; i >= 0; i--) {
    const start = monthStart(i)
    const end = i === 0 ? new Date() : monthEnd(i)
    monthlyRevenue.push(
      transactions7mo
        .filter(t => new Date(t.createdAt) >= start && new Date(t.createdAt) <= end)
        .reduce((s, t) => s + t.amount, 0)
    )
    monthlyExpenses.push(
      expenses7mo
        .filter(e => new Date(e.date) >= start && new Date(e.date) <= end)
        .reduce((s, e) => s + e.amount, 0)
    )
  }

  const currentMRR = monthlyRevenue[6]
  const prevMRR = monthlyRevenue[5]
  const currentExpenses = monthlyExpenses[6]
  const prevExpenses = monthlyExpenses[5]

  const burnRate = settings?.averageMonthlyExpenses ?? (currentExpenses || 0)
  const runway = burnRate > 0 ? bankBalance / burnRate : 0
  const prevRunway = burnRate > 0 ? (bankBalance - currentExpenses + prevExpenses) / burnRate : 0

  const reconciledCount = await prisma.transaction.count({
    where: { organizationId: orgId, workflowStatus: "completed" },
  })

  return NextResponse.json([
    {
      title: "MRR",
      value: fmt(currentMRR),
      change: pctChange(currentMRR, prevMRR),
      data: monthlyRevenue,
    },
    {
      title: "Cash Balance",
      value: fmt(bankBalance),
      change: pctChange(bankBalance, bankBalance - currentMRR + currentExpenses),
      data: Array(6).fill(bankBalance).map((v, i) => Math.max(0, v - (6 - i) * (burnRate / 30 * 5))).concat([bankBalance]),
    },
    {
      title: "Outstanding Invoices",
      value: fmt(outstandingTotal),
      change: outstandingTotal > 0 ? "Needs collection" : "All clear",
      data: Array(7).fill(outstandingTotal),
    },
    {
      title: "Expenses This Month",
      value: fmt(currentExpenses),
      change: pctChange(currentExpenses, prevExpenses),
      data: monthlyExpenses,
    },
    {
      title: "Runway",
      value: runway > 0 ? `${runway.toFixed(1)} mo` : "—",
      change: runway > 0 ? pctChange(runway, prevRunway) : "Set bank balance",
      data: Array(7).fill(0).map((_, i) => Math.max(0, runway - (6 - i) * 0.1)),
    },
    {
      title: "Burn Rate",
      value: burnRate > 0 ? `${fmt(burnRate)}/mo` : "—",
      change: pctChange(burnRate, prevExpenses || burnRate),
      data: monthlyExpenses.map(e => e || burnRate),
    },
    {
      title: "Reconciled",
      value: `${reconciledCount} tx`,
      change: currentMRR > 0 ? `${fmt(currentMRR)} this mo` : "No activity",
      data: monthlyRevenue,
    },
  ])
}
