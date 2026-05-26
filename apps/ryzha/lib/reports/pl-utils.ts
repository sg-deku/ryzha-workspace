import { prisma } from "@/lib/prisma"

export interface PLData {
  revenue: number
  expenses: number
  vendorExpenses: number
  totalExpenses: number
  grossProfit: number
  netIncome: number
  grossMargin: number
  netMargin: number
  revenueBreakdown: { name: string; amount: number }[]
  expenseBreakdown: { name: string; amount: number }[]
}

export interface MonthlyPLRow {
  month: string
  revenue: number
  expenses: number
  netIncome: number
  grossMargin: number
}

export async function getPLData(
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<PLData> {
  const dateFilter: any = {}
  if (startDate || endDate) {
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate + "T23:59:59.999Z")
  }

  const whereRevenue: any = { organizationId, accountType: "Revenue" }
  if (startDate || endDate) whereRevenue.date = dateFilter

  const whereExpenses: any = { organizationId, accountType: "Expenses" }
  if (startDate || endDate) whereExpenses.date = dateFilter

  const [revenueEntries, expenseEntries] = await Promise.all([
    prisma.generalLedgerEntry.findMany({ where: whereRevenue }),
    prisma.generalLedgerEntry.findMany({ where: whereExpenses }),
  ])

  const revenue = revenueEntries.reduce((s, e) => s + e.credit - e.debit, 0)
  const totalExpenses = expenseEntries.reduce((s, e) => s + e.debit - e.credit, 0)

  const revenueByDesc: Record<string, number> = {}
  for (const entry of revenueEntries) {
    const key = entry.accountName || "Other"
    revenueByDesc[key] = (revenueByDesc[key] ?? 0) + (entry.credit - entry.debit)
  }
  const revenueBreakdown = Object.entries(revenueByDesc)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  const expenseByCategory: Record<string, number> = {}
  for (const e of expenseEntries) {
    const key = e.accountName || "Uncategorized"
    expenseByCategory[key] = (expenseByCategory[key] ?? 0) + (e.debit - e.credit)
  }
  const expenseBreakdown = Object.entries(expenseByCategory)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  const grossProfit = revenue - totalExpenses
  const netIncome = grossProfit
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0

  return {
    revenue,
    expenses: totalExpenses,
    vendorExpenses: 0, // Simplified, everything is in totalExpenses from GL
    totalExpenses,
    grossProfit,
    netIncome,
    grossMargin,
    netMargin,
    revenueBreakdown,
    expenseBreakdown,
  }
}

export async function getMonthlyPL(
  organizationId: string,
  monthsBack = 12
): Promise<MonthlyPLRow[]> {
  const rows: MonthlyPLRow[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() - i)
    const startDate = new Date(date.getFullYear(), date.getMonth(), 1)
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)

    const monthLabel = startDate.toLocaleString("default", { month: "short", year: "2-digit" })

    const [revenueEntries, expenseEntries] = await Promise.all([
      prisma.generalLedgerEntry.aggregate({
        where: {
          organizationId,
          accountType: "Revenue",
          date: { gte: startDate, lte: endDate },
        },
        _sum: { credit: true, debit: true },
      }),
      prisma.generalLedgerEntry.aggregate({
        where: { 
          organizationId, 
          accountType: "Expenses", 
          date: { gte: startDate, lte: endDate } 
        },
        _sum: { debit: true, credit: true },
      }),
    ])

    const revenue = (revenueEntries._sum.credit ?? 0) - (revenueEntries._sum.debit ?? 0)
    const expenses = (expenseEntries._sum.debit ?? 0) - (expenseEntries._sum.credit ?? 0)
    const netIncome = revenue - expenses
    const grossMargin = revenue > 0 ? Math.round((netIncome / revenue) * 100) : 0

    rows.push({ month: monthLabel, revenue, expenses, netIncome, grossMargin })
  }

  return rows
}
