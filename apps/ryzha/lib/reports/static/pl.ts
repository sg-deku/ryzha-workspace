import { prisma } from "@/lib/prisma"

export async function getProfitLoss(
  params: { startDate?: string; endDate?: string },
  orgId: string
) {
  const start = params.startDate ? new Date(params.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        issueDate: { gte: start, lte: end },
        status: { in: ["PAID", "SENT"] },
      },
      select: { issueDate: true, total: true },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: orgId,
        date: { gte: start, lte: end },
      },
      select: { date: true, amount: true, category: true },
    }),
  ])

  const totalRevenue = invoices.reduce((sum, i) => sum + i.total, 0)
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  const byMonth: Record<string, { revenue: number; expenses: number }> = {}
  for (const inv of invoices) {
    const key = inv.issueDate.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { revenue: 0, expenses: 0 }
    byMonth[key].revenue += inv.total
  }
  for (const exp of expenses) {
    const key = exp.date.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { revenue: 0, expenses: 0 }
    byMonth[key].expenses += exp.amount
  }

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    margin: totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 10000) / 100 : 0,
    byMonth: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({ month, ...data, profit: data.revenue - data.expenses })),
  }
}
