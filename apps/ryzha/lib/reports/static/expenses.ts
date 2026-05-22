import { prisma } from "@/lib/prisma"

export async function getExpensesByCategory(
  params: { startDate?: string; endDate?: string },
  orgId: string
) {
  const start = params.startDate ? new Date(params.startDate) : new Date(new Date().setMonth(new Date().getMonth() - 3))
  const end = params.endDate ? new Date(params.endDate) : new Date()

  const expenses = await prisma.expense.findMany({
    where: {
      organizationId: orgId,
      date: { gte: start, lte: end },
    },
    select: { category: true, amount: true },
  })

  const byCategory: Record<string, number> = {}
  for (const exp of expenses) {
    const key = exp.category || "Uncategorized"
    byCategory[key] = (byCategory[key] || 0) + exp.amount
  }

  return Object.entries(byCategory).map(([name, value]) => ({ name, value }))
}
