import { prisma } from "@/lib/prisma"

export async function getProfitLoss(
  params: { startDate?: string; endDate?: string },
  orgId: string
) {
  const start = params.startDate
    ? new Date(params.startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 3))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const glEntries = await prisma.generalLedgerEntry.findMany({
    where: {
      organizationId: orgId,
      date: { gte: start, lte: end },
      accountType: { in: ["Revenue", "Expenses"] },
    },
    select: { date: true, accountType: true, accountName: true, credit: true, debit: true },
  })

  let totalRevenue = 0
  let totalExpenses = 0
  const byMonth: Record<string, { revenue: number; expenses: number }> = {}
  const revenueByAccount: Record<string, number> = {}
  const expensesByAccount: Record<string, number> = {}

  for (const entry of glEntries) {
    const month = entry.date.toISOString().slice(0, 7)
    if (!byMonth[month]) byMonth[month] = { revenue: 0, expenses: 0 }

    if (entry.accountType === "Revenue") {
      const recognized = entry.credit - entry.debit
      totalRevenue += recognized
      byMonth[month].revenue += recognized
      revenueByAccount[entry.accountName] = (revenueByAccount[entry.accountName] ?? 0) + recognized
    } else {
      const spent = entry.debit - entry.credit
      totalExpenses += spent
      byMonth[month].expenses += spent
      expensesByAccount[entry.accountName] = (expensesByAccount[entry.accountName] ?? 0) + spent
    }
  }

  const netProfit = totalRevenue - totalExpenses

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    margin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0,
    revenueByAccount: Object.entries(revenueByAccount)
      .map(([account, amount]) => ({ account, amount }))
      .sort((a, b) => b.amount - a.amount),
    expensesByAccount: Object.entries(expensesByAccount)
      .map(([account, amount]) => ({ account, amount }))
      .sort((a, b) => b.amount - a.amount),
    byMonth: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data, profit: data.revenue - data.expenses })),
  }
}
