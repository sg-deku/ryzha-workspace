import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { runPayrollAgent } from "@/lib/agents/payroll-agent"
import { runFXAgent } from "@/lib/agents/fx-agent"
import { runHeadcountAgent } from "@/lib/agents/headcount-agent"
import { runCollectionsAgent } from "@/lib/agents/collections-agent"
import { runFPnAAgent } from "@/lib/agents/fpna-agent"

async function refreshCashForecast(organizationId: string) {
  const now = new Date()
  const thirteenWeeksAgo = new Date(now.getTime() - 91 * 86400 * 1000)

  const [totalCashIn, totalCashOut] = await Promise.all([
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
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
  ])

  const weeklyIn = (totalCashIn._sum.amount ?? 0) / 13
  const weeklyOut = (totalCashOut._sum.amount ?? 0) / 13
  const runwayWeeks = weeklyOut > weeklyIn ? Math.floor((await getCurrentBalance(organizationId)) / (weeklyOut - weeklyIn)) : null

  if (runwayWeeks !== null && runwayWeeks < 12) {
    await prisma.notification.create({
      data: {
        organizationId,
        type: runwayWeeks < 6 ? "ERROR" : "WARNING",
        title: `Cash Runway Alert: ${runwayWeeks} weeks remaining`,
        message: `At current burn rate, you have approximately ${runwayWeeks} weeks of cash runway. Review your cash forecast immediately.`,
        link: "/cash-forecast",
      },
    }).catch(() => {})
  }

  return { weeklyIn, weeklyOut, netBurnPerWeek: weeklyOut - weeklyIn, runwayWeeks }
}

async function getCurrentBalance(organizationId: string): Promise<number> {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { bankBalance: true },
  })
  return settings?.bankBalance ?? 0
}

async function runBudgetCheck(organizationId: string) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const [actualExpenses, pendingApprovals] = await Promise.all([
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "BILL_CREATED"] },
        status: { in: ["POSTED", "APPROVED"] },
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.financialEventApproval.count({
      where: { organizationId, status: "PENDING" },
    }),
  ])

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { monthlyBudget: true },
  })

  const actualAmount = actualExpenses._sum.amount ?? 0
  const monthlyBudget = settings?.monthlyBudget ?? null

  if (monthlyBudget && actualAmount > monthlyBudget * 0.9) {
    const pct = Math.round((actualAmount / monthlyBudget) * 100)
    await prisma.notification.create({
      data: {
        organizationId,
        type: actualAmount > monthlyBudget ? "ERROR" : "WARNING",
        title: `Budget ${actualAmount > monthlyBudget ? "Exceeded" : "Alert"}: ${pct}% used`,
        message: `Monthly spend is at ${pct}% of budget ($${actualAmount.toFixed(0)} of $${monthlyBudget.toFixed(0)}).`,
        link: "/budget",
      },
    }).catch(() => {})
  }

  if (pendingApprovals > 0) {
    await prisma.notification.create({
      data: {
        organizationId,
        type: "INFO",
        title: `${pendingApprovals} Approval${pendingApprovals > 1 ? "s" : ""} Pending`,
        message: `You have ${pendingApprovals} financial event${pendingApprovals > 1 ? "s" : ""} awaiting approval.`,
        link: "/approvals",
      },
    }).catch(() => {})
  }

  return {
    actualExpensesThisMonth: actualAmount,
    pendingApprovals,
    monthlyBudget,
    budgetUtilisationPct: monthlyBudget ? Math.round((actualAmount / monthlyBudget) * 100) : null,
  }
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const orgs = await prisma.organization.findMany({
    where: { status: "ACTIVE" },
    select: { id: true },
  })

  const results: Record<string, unknown> = {}

  for (const org of orgs) {
    const orgId = org.id
    try {
      const agentConfig = await getAgentConfig(orgId)

      const [payroll, fx, headcount, collections, cashForecast, budgetCheck, fpna] = await Promise.allSettled([
        agentConfig.payrollEnabled ? runPayrollAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.fxEnabled ? runFXAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.headcountEnabled ? runHeadcountAgent(orgId) : Promise.resolve({ skipped: true }),
        agentConfig.collectionsEnabled ? runCollectionsAgent(orgId) : Promise.resolve({ skipped: true }),
        refreshCashForecast(orgId),
        runBudgetCheck(orgId),
        agentConfig.fpnaEnabled ? runFPnAAgent(orgId) : Promise.resolve({ skipped: true }),
      ])

      results[orgId] = {
        payroll: payroll.status === "fulfilled" ? payroll.value : { error: (payroll as any).reason?.message },
        fx: fx.status === "fulfilled" ? fx.value : { error: (fx as any).reason?.message },
        headcount: headcount.status === "fulfilled" ? headcount.value : { error: (headcount as any).reason?.message },
        collections: collections.status === "fulfilled" ? collections.value : { error: (collections as any).reason?.message },
        cashForecast: cashForecast.status === "fulfilled" ? cashForecast.value : { error: (cashForecast as any).reason?.message },
        budgetCheck: budgetCheck.status === "fulfilled" ? budgetCheck.value : { error: (budgetCheck as any).reason?.message },
        fpna: fpna.status === "fulfilled" ? fpna.value : { error: (fpna as any).reason?.message },
      }
    } catch (err: any) {
      results[orgId] = { error: err.message }
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results })
}

async function getAgentConfig(organizationId: string) {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { agentConfig: true },
  })
  const config = (settings?.agentConfig as Record<string, boolean> | null) ?? {}
  return {
    payrollEnabled: config.payrollEnabled !== false,
    fxEnabled: config.fxEnabled !== false,
    headcountEnabled: config.headcountEnabled !== false,
    collectionsEnabled: config.collectionsEnabled !== false,
    fpnaEnabled: config.fpnaEnabled !== false,
  }
}
