import { prisma } from "@/lib/prisma"

export async function getCashFlow(
  params: { startDate?: string; endDate?: string },
  orgId: string
) {
  const start = params.startDate ? new Date(params.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const [invoices, expenses] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        organizationId: orgId,
        issueDate: { gte: start, lte: end },
        status: "PAID",
      },
      select: { issueDate: true, total: true },
    }),
    prisma.expense.findMany({
      where: {
        organizationId: orgId,
        date: { gte: start, lte: end },
      },
      select: { date: true, amount: true },
    }),
  ])

  const byMonth: Record<string, { inflow: number; outflow: number }> = {}
  for (const inv of invoices) {
    const key = inv.issueDate.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { inflow: 0, outflow: 0 }
    byMonth[key].inflow += inv.total
  }
  for (const exp of expenses) {
    const key = exp.date.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { inflow: 0, outflow: 0 }
    byMonth[key].outflow += exp.amount
  }

  return Object.entries(byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      inflow: data.inflow,
      outflow: data.outflow,
      net: data.inflow - data.outflow,
    }))
}
