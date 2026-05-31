import { prisma } from "@/lib/prisma"

export async function getCashFlow(
  params: { startDate?: string; endDate?: string },
  orgId: string
) {
  const start = params.startDate
    ? new Date(params.startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 6))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const [payments, vendorPayments] = await Promise.all([
    prisma.payment.findMany({
      where: {
        organizationId: orgId,
        paymentDate: { gte: start, lte: end },
      },
      select: { paymentDate: true, amount: true },
    }),
    prisma.vendorPayment.findMany({
      where: {
        organizationId: orgId,
        paymentDate: { gte: start, lte: end },
      },
      select: { paymentDate: true, amount: true },
    }),
  ])

  const byMonth: Record<string, { inflow: number; outflow: number }> = {}

  for (const p of payments) {
    const key = p.paymentDate.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { inflow: 0, outflow: 0 }
    byMonth[key].inflow += p.amount
  }

  for (const vp of vendorPayments) {
    const key = vp.paymentDate.toISOString().slice(0, 7)
    if (!byMonth[key]) byMonth[key] = { inflow: 0, outflow: 0 }
    byMonth[key].outflow += vp.amount
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
