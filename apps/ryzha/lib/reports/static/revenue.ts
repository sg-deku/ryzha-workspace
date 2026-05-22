import { prisma } from "@/lib/prisma"

export async function getRevenueByMonth(
  params: { startDate?: string; endDate?: string },
  orgId: string
) {
  const start = params.startDate ? new Date(params.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 6))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const invoices = await prisma.invoice.findMany({
    where: {
      organizationId: orgId,
      issueDate: { gte: start, lte: end },
      status: { in: ["PAID", "SENT"] },
    },
    select: { issueDate: true, total: true, status: true },
    orderBy: { issueDate: "asc" },
  })

  const byMonth: Record<string, number> = {}
  for (const inv of invoices) {
    const key = inv.issueDate.toISOString().slice(0, 7)
    byMonth[key] = (byMonth[key] || 0) + inv.total
  }

  return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue }))
}
