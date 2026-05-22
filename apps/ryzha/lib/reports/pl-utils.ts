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

  const invoiceWhere: any = { organizationId, status: { not: "VOID" } }
  if (startDate || endDate) invoiceWhere.issueDate = dateFilter

  const expenseWhere: any = { organizationId }
  if (startDate || endDate) expenseWhere.date = dateFilter

  const vendorWhere: any = { organizationId }
  if (startDate || endDate) vendorWhere.createdAt = dateFilter

  const [invoices, expenses, vendorInvoices] = await Promise.all([
    prisma.invoice.findMany({
      where: invoiceWhere,
      include: { lineItems: true },
    }),
    prisma.expense.findMany({ where: expenseWhere }),
    prisma.vendorInvoice.findMany({ where: vendorWhere }),
  ])

  const revenue = invoices.reduce((s, inv) => s + inv.subtotal, 0)
  const expenseTotal = expenses.reduce((s, e) => s + e.amount, 0)
  const vendorExpenseTotal = vendorInvoices.reduce((s, vi) => s + vi.amount, 0)
  const totalExpenses = expenseTotal + vendorExpenseTotal

  const revenueByDesc: Record<string, number> = {}
  for (const inv of invoices) {
    for (const item of inv.lineItems) {
      const key = item.description || "Other"
      revenueByDesc[key] = (revenueByDesc[key] ?? 0) + item.amount
    }
  }
  const revenueBreakdown = Object.entries(revenueByDesc)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  const expenseByCategory: Record<string, number> = {}
  for (const e of expenses) {
    const key = e.category || "Uncategorized"
    expenseByCategory[key] = (expenseByCategory[key] ?? 0) + e.amount
  }
  for (const vi of vendorInvoices) {
    expenseByCategory["Vendor Expenses"] = (expenseByCategory["Vendor Expenses"] ?? 0) + vi.amount
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
    expenses: expenseTotal,
    vendorExpenses: vendorExpenseTotal,
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

    const [invoices, expenses, vendorInvoices] = await Promise.all([
      prisma.invoice.aggregate({
        where: {
          organizationId,
          status: { not: "VOID" },
          issueDate: { gte: startDate, lte: endDate },
        },
        _sum: { subtotal: true },
      }),
      prisma.expense.aggregate({
        where: { organizationId, date: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.vendorInvoice.aggregate({
        where: { organizationId, createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
    ])

    const revenue = invoices._sum.subtotal ?? 0
    const expenses2 = (expenses._sum.amount ?? 0) + (vendorInvoices._sum.amount ?? 0)
    const netIncome = revenue - expenses2
    const grossMargin = revenue > 0 ? Math.round((netIncome / revenue) * 100) : 0

    rows.push({ month: monthLabel, revenue, expenses: expenses2, netIncome, grossMargin })
  }

  return rows
}
