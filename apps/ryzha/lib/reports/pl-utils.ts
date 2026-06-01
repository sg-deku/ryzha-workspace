import { prisma } from "@/lib/prisma"

export interface PLData {
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
  revenueBreakdown: { name: string; amount: number }[]
  cogsBreakdown: { name: string; amount: number }[]
  opexBreakdown: { name: string; amount: number }[]
  expenseBreakdown: { name: string; amount: number }[]
  totalExpenses: number
}

export interface MonthlyPLRow {
  month: string
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  operatingExpenses: number
  netIncome: number
  expenses: number
}

function buildDateFilter(startDate?: string, endDate?: string) {
  if (!startDate && !endDate) return undefined
  const filter: any = {}
  if (startDate) filter.gte = new Date(startDate)
  if (endDate) filter.lte = new Date(endDate + "T23:59:59.999Z")
  return filter
}

function sumCredit(entries: { debit: number; credit: number }[]) {
  return entries.reduce((s, e) => s + e.credit - e.debit, 0)
}

function sumDebit(entries: { debit: number; credit: number }[]) {
  return entries.reduce((s, e) => s + e.debit - e.credit, 0)
}

function buildBreakdown(
  entries: { accountName: string; debit: number; credit: number }[],
  netFn: (e: { debit: number; credit: number }) => number,
  limit = 8
): { name: string; amount: number }[] {
  const map: Record<string, number> = {}
  for (const e of entries) {
    const key = e.accountName || "Other"
    map[key] = (map[key] ?? 0) + netFn(e)
  }
  return Object.entries(map)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit)
}

export async function getPLData(
  organizationId: string,
  startDate?: string,
  endDate?: string
): Promise<PLData> {
  const dateFilter = buildDateFilter(startDate, endDate)
  const where = (accountType: string) => ({
    organizationId,
    accountType,
    ...(dateFilter ? { date: dateFilter } : {}),
  })

  const [revenueEntries, cogsEntries, opexEntries, otherIncomeEntries, otherExpenseEntries] =
    await Promise.all([
      prisma.generalLedgerEntry.findMany({ where: where("Revenue") }),
      prisma.generalLedgerEntry.findMany({ where: where("COGS") }),
      prisma.generalLedgerEntry.findMany({ where: where("Expenses") }),
      prisma.generalLedgerEntry.findMany({ where: where("Other Income") }),
      prisma.generalLedgerEntry.findMany({ where: where("Other Expense") }),
    ])

  const revenue = sumCredit(revenueEntries)
  const cogs = sumDebit(cogsEntries)
  const operatingExpenses = sumDebit(opexEntries)
  const otherIncome = sumCredit(otherIncomeEntries)
  const otherExpense = sumDebit(otherExpenseEntries)

  const grossProfit = revenue - cogs
  const operatingIncome = grossProfit - operatingExpenses
  const netIncome = operatingIncome + otherIncome - otherExpense
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0
  const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0
  const totalExpenses = cogs + operatingExpenses + otherExpense

  const revenueBreakdown = buildBreakdown(revenueEntries, (e) => e.credit - e.debit)
  const cogsBreakdown = buildBreakdown(cogsEntries, (e) => e.debit - e.credit)
  const opexBreakdown = buildBreakdown(opexEntries, (e) => e.debit - e.credit)
  const expenseBreakdown = [...cogsBreakdown, ...opexBreakdown]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  return {
    revenue,
    cogs,
    grossProfit,
    grossMargin: Math.round(grossMargin * 10) / 10,
    operatingExpenses,
    operatingIncome,
    otherIncome,
    otherExpense,
    netIncome,
    netMargin: Math.round(netMargin * 10) / 10,
    revenueBreakdown,
    cogsBreakdown,
    opexBreakdown,
    expenseBreakdown,
    totalExpenses,
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

    const aggWhere = (accountType: string) => ({
      organizationId,
      accountType,
      date: { gte: startDate, lte: endDate },
    })

    const [revAgg, cogsAgg, opexAgg] = await Promise.all([
      prisma.generalLedgerEntry.aggregate({
        where: aggWhere("Revenue"),
        _sum: { credit: true, debit: true },
      }),
      prisma.generalLedgerEntry.aggregate({
        where: aggWhere("COGS"),
        _sum: { debit: true, credit: true },
      }),
      prisma.generalLedgerEntry.aggregate({
        where: aggWhere("Expenses"),
        _sum: { debit: true, credit: true },
      }),
    ])

    const revenue = (revAgg._sum.credit ?? 0) - (revAgg._sum.debit ?? 0)
    const cogs = (cogsAgg._sum.debit ?? 0) - (cogsAgg._sum.credit ?? 0)
    const operatingExpenses = (opexAgg._sum.debit ?? 0) - (opexAgg._sum.credit ?? 0)
    const grossProfit = revenue - cogs
    const netIncome = grossProfit - operatingExpenses
    const grossMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0

    rows.push({
      month: monthLabel,
      revenue,
      cogs,
      grossProfit,
      grossMargin,
      operatingExpenses,
      netIncome,
      expenses: cogs + operatingExpenses,
    })
  }

  return rows
}

export async function getComparativePL(
  organizationId: string,
  periods: { label: string; startDate: string; endDate: string }[]
): Promise<{ period: string; data: PLData }[]> {
  return Promise.all(
    periods.map(async (p) => ({
      period: p.label,
      data: await getPLData(organizationId, p.startDate, p.endDate),
    }))
  )
}
