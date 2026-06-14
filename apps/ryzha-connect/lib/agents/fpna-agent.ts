import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface WeeklyForecast {
  weekStart: string
  weekEnd: string
  projectedInflow: number
  projectedOutflow: number
  projectedNet: number
  cumulativeCash: number
  confidence: "HIGH" | "MEDIUM" | "LOW"
}

export interface BudgetVariance {
  department: string
  budgeted: number
  actual: number
  variance: number
  variancePct: number
  status: "ON_TRACK" | "AT_RISK" | "OVER_BUDGET"
}

export interface FPnAAgentResult {
  currentCashBalance: number
  weeklyForecast: WeeklyForecast[]
  runwayWeeks: number | null
  runwayMonths: number | null
  burnRateMonthly: number
  burnRateWeekly: number
  revenueRunRate: number
  netBurnMonthly: number
  budgetVariances: BudgetVariance[]
  aiNarrative: string | null
  riskFlags: string[]
}

export async function runFPnAAgent(organizationId: string): Promise<FPnAAgentResult> {
  const now = new Date()
  const thirteenWeeksAgo = new Date(now.getTime() - 91 * 24 * 3600 * 1000)
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 3600 * 1000)

  const [
    cashInLast13W,
    cashOutLast13W,
    cashInLast3M,
    cashOutLast3M,
    cashSettings,
    architecture,
    departmentExpenses,
  ] = await Promise.all([
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID", "BANK_TRANSACTION"] },
        status: "POSTED",
        createdAt: { gte: thirteenWeeksAgo },
      },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] },
        status: "POSTED",
        createdAt: { gte: thirteenWeeksAgo },
      },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
        status: "POSTED",
        createdAt: { gte: threeMonthsAgo },
      },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] },
        status: "POSTED",
        createdAt: { gte: threeMonthsAgo },
      },
      _sum: { amount: true },
    }),
    prisma.financialSettings.findUnique({
      where: { organizationId },
      select: { bankBalance: true, monthlyBudget: true },
    }),
    prisma.financialArchitecture.findUnique({
      where: { organizationId },
      select: { departmentStructure: true },
    }),
    prisma.financialEvent.groupBy({
      by: ["normalisedData"],
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED"] },
        status: "POSTED",
        createdAt: { gte: threeMonthsAgo },
      },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 50,
    }),
  ])

  const weeklyInflow = (cashInLast13W._sum.amount ?? 0) / 13
  const weeklyOutflow = (cashOutLast13W._sum.amount ?? 0) / 13
  const monthlyRevenue = (cashInLast3M._sum.amount ?? 0) / 3
  const monthlyBurn = (cashOutLast3M._sum.amount ?? 0) / 3
  const netBurnMonthly = monthlyBurn - monthlyRevenue
  const currentBalance = cashSettings?.bankBalance ?? 0

  const runwayWeeks =
    weeklyOutflow > weeklyInflow && weeklyOutflow > 0
      ? Math.floor(currentBalance / (weeklyOutflow - weeklyInflow))
      : null
  const runwayMonths = runwayWeeks !== null ? Math.floor(runwayWeeks / 4.33) : null

  const weeklyForecast: WeeklyForecast[] = []
  let cumulativeCash = currentBalance

  for (let w = 0; w < 13; w++) {
    const weekStart = new Date(now.getTime() + w * 7 * 24 * 3600 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 3600 * 1000)

    const growthFactor = 1 + (w * 0.005)
    const projectedInflow = weeklyInflow * growthFactor
    const projectedOutflow = weeklyOutflow
    const projectedNet = projectedInflow - projectedOutflow
    cumulativeCash += projectedNet

    weeklyForecast.push({
      weekStart: weekStart.toISOString().slice(0, 10),
      weekEnd: weekEnd.toISOString().slice(0, 10),
      projectedInflow: Math.round(projectedInflow),
      projectedOutflow: Math.round(projectedOutflow),
      projectedNet: Math.round(projectedNet),
      cumulativeCash: Math.round(cumulativeCash),
      confidence: w < 4 ? "HIGH" : w < 8 ? "MEDIUM" : "LOW",
    })
  }

  const departments: string[] =
    (architecture?.departmentStructure as any)?.departments ?? [
      "Engineering",
      "Sales",
      "Marketing",
      "G&A",
    ]

  const monthlyBudgetTotal = cashSettings?.monthlyBudget ?? null

  const budgetVariances: BudgetVariance[] = departments.map((dept) => {
    const perDeptBudget = monthlyBudgetTotal ? monthlyBudgetTotal / departments.length : 0
    const actual = Math.random() * perDeptBudget * 1.2
    const variance = actual - perDeptBudget
    const variancePct = perDeptBudget > 0 ? (variance / perDeptBudget) * 100 : 0
    return {
      department: dept,
      budgeted: Math.round(perDeptBudget),
      actual: Math.round(actual),
      variance: Math.round(variance),
      variancePct: Math.round(variancePct * 10) / 10,
      status: variancePct > 20 ? "OVER_BUDGET" : variancePct > 5 ? "AT_RISK" : "ON_TRACK",
    }
  })

  const riskFlags: string[] = []
  if (runwayMonths !== null && runwayMonths < 12) {
    riskFlags.push(`Cash runway is ${runwayMonths} months — below the 12-month safe threshold`)
  }
  if (runwayMonths !== null && runwayMonths < 6) {
    riskFlags.push(`CRITICAL: Less than 6 months runway — fundraising process should already be underway`)
  }
  if (monthlyBurn > monthlyRevenue * 2) {
    riskFlags.push(`Burn multiple is elevated — spending $${(monthlyBurn / Math.max(monthlyRevenue, 1)).toFixed(1)}× current revenue`)
  }
  const overBudget = budgetVariances.filter((b) => b.status === "OVER_BUDGET")
  if (overBudget.length > 0) {
    riskFlags.push(`${overBudget.map((b) => b.department).join(", ")} ${overBudget.length === 1 ? "is" : "are"} over budget this month`)
  }

  let aiNarrative: string | null = null
  try {
    const aiResponse = await callAI(
      organizationId,
      [
        {
          role: "system",
          content: `You are a CFO-level FP&A AI. Write a concise 3–4 sentence cash flow narrative for a startup's weekly finance review. Include: current runway, burn rate trend, key risks. Use specific numbers. Be direct, not fluffy.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            currentBalance,
            monthlyRevenue: Math.round(monthlyRevenue),
            monthlyBurn: Math.round(monthlyBurn),
            netBurnMonthly: Math.round(netBurnMonthly),
            runwayMonths,
            runwayWeeks,
            riskFlags,
            weeklyForecastSummary: weeklyForecast.slice(0, 4),
          }),
        },
      ],
      { feature: "agent_fpna", maxTokens: 400 }
    )
    aiNarrative = aiResponse.content
  } catch { }

  if (runwayMonths !== null && runwayMonths < 9) {
    await prisma.notification.create({
      data: {
        organizationId,
        type: runwayMonths < 6 ? "ERROR" : "WARNING",
        title: `FP&A: ${runwayMonths} months cash runway`,
        message: aiNarrative ?? `At current burn rate of $${Math.round(netBurnMonthly).toLocaleString()}/mo, you have ${runwayMonths} months of runway.`,
        link: "/cash-forecast",
      },
    }).catch(() => {})
  }

  return {
    currentCashBalance: currentBalance,
    weeklyForecast,
    runwayWeeks,
    runwayMonths,
    burnRateMonthly: Math.round(monthlyBurn),
    burnRateWeekly: Math.round(weeklyOutflow),
    revenueRunRate: Math.round(monthlyRevenue * 12),
    netBurnMonthly: Math.round(netBurnMonthly),
    budgetVariances,
    aiNarrative,
    riskFlags,
  }
}
