import { NextResponse } from "next/server"
import { getMobileSession } from "@/lib/mobile-auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getMobileSession(req)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    snapshot,
    monthlyRevenue,
    monthlyExpenses,
    ytdRevenue,
    ytdExpenses,
    expenseByCategory,
  ] = await Promise.all([
    prisma.financialSnapshot.findUnique({ where: { organizationId } }),

    prisma.invoice.aggregate({
      where: { organizationId, status: "PAID", issueDate: { gte: startOfMonth } },
      _sum: { total: true },
    }),

    prisma.expense.aggregate({
      where: { organizationId, status: "APPROVED", date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),

    prisma.invoice.aggregate({
      where: { organizationId, status: "PAID", issueDate: { gte: startOfYear } },
      _sum: { total: true },
    }),

    prisma.expense.aggregate({
      where: { organizationId, status: "APPROVED", date: { gte: startOfYear } },
      _sum: { amount: true },
    }),

    prisma.expense.groupBy({
      by: ["category"],
      where: { organizationId, date: { gte: startOfYear } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 8,
    }),
  ])

  const rev = monthlyRevenue._sum.total ?? 0
  const exp = monthlyExpenses._sum.amount ?? 0

  return NextResponse.json({
    snapshot,
    monthly: {
      revenue: rev,
      expenses: exp,
      netIncome: rev - exp,
    },
    ytd: {
      revenue: ytdRevenue._sum.total ?? 0,
      expenses: ytdExpenses._sum.amount ?? 0,
      netIncome: (ytdRevenue._sum.total ?? 0) - (ytdExpenses._sum.amount ?? 0),
    },
    expenseByCategory: expenseByCategory.map((e) => ({
      category: e.category ?? "Other",
      amount: e._sum.amount ?? 0,
    })),
  })
}
