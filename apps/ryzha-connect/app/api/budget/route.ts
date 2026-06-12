import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const organizationId = session.user.organizationId

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { monthlyBudget: true, agentConfig: true },
  })

  const monthlyBudget = settings?.monthlyBudget ?? 0
  const budgetConfig = (settings?.agentConfig as Record<string, unknown> | null)?.budget ?? null

  const now = new Date()
  const months: { label: string; start: Date; end: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    months.push({
      label: d.toLocaleString("default", { month: "short", year: "numeric" }),
      start: d,
      end,
    })
  }

  const monthlyData = await Promise.all(
    months.map(async ({ label, start, end }) => {
      const [revenue, expenses] = await Promise.all([
        prisma.financialEvent.aggregate({
          where: {
            organizationId,
            eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
            status: "POSTED",
            createdAt: { gte: start, lt: end },
          },
          _sum: { amount: true },
        }),
        prisma.financialEvent.aggregate({
          where: {
            organizationId,
            eventType: { in: ["EXPENSE_CREATED", "BILL_CREATED", "PAYROLL_PROCESSED"] },
            status: { in: ["POSTED", "APPROVED"] },
            createdAt: { gte: start, lt: end },
          },
          _sum: { amount: true },
        }),
      ])

      const actualRevenue = revenue._sum.amount ?? 0
      const actualExpenses = expenses._sum.amount ?? 0

      return {
        label,
        actualRevenue,
        actualExpenses,
        budgetExpenses: monthlyBudget,
        variance: monthlyBudget > 0 ? actualExpenses - monthlyBudget : null,
        variancePct: monthlyBudget > 0 ? ((actualExpenses - monthlyBudget) / monthlyBudget) * 100 : null,
        netIncome: actualRevenue - actualExpenses,
      }
    })
  )

  const currentMonth = monthlyData[monthlyData.length - 1]
  const expenseBreakdown = await prisma.financialEvent.groupBy({
    by: ["eventType"],
    where: {
      organizationId,
      eventType: { in: ["EXPENSE_CREATED", "BILL_CREATED", "PAYROLL_PROCESSED"] },
      status: { in: ["POSTED", "APPROVED"] },
      createdAt: { gte: months[months.length - 1].start, lt: months[months.length - 1].end },
    },
    _sum: { amount: true },
  })

  return NextResponse.json({
    monthlyBudget,
    monthlyData,
    currentMonth,
    expenseBreakdown: expenseBreakdown.map((e) => ({
      type: e.eventType,
      amount: e._sum.amount ?? 0,
    })),
  })
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { monthlyBudget } = body

  if (typeof monthlyBudget !== "number" || monthlyBudget < 0) {
    return NextResponse.json({ error: "Invalid monthlyBudget" }, { status: 400 })
  }

  const existingSettings = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  })
  if (existingSettings) {
    await prisma.financialSettings.update({
      where: { organizationId: session.user.organizationId },
      data: { monthlyBudget },
    })
  } else {
    await prisma.financialSettings.create({
      data: { organizationId: session.user.organizationId, monthlyBudget, deferredRevenueRules: [] },
    })
  }

  return NextResponse.json({ ok: true, monthlyBudget })
}
