import { prisma } from "@/lib/prisma"

export interface HeadcountAgentResult {
  processed: number
  matched: number
  discrepancies: number
  alerts: HeadcountAlert[]
  errors: string[]
}

export interface HeadcountAlert {
  type: "MISSING_PAYROLL" | "EXTRA_PAYROLL" | "AMOUNT_MISMATCH" | "DEPARTMENT_MISMATCH"
  description: string
  severity: "LOW" | "MEDIUM" | "HIGH"
  payrollEventId?: string
  expectedAmount?: number
  actualAmount?: number
}

export async function runHeadcountAgent(organizationId: string): Promise<HeadcountAgentResult> {
  const result: HeadcountAgentResult = {
    processed: 0,
    matched: 0,
    discrepancies: 0,
    alerts: [],
    errors: [],
  }

  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const payrollEvents = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      eventType: "PAYROLL_PROCESSED",
      createdAt: { gte: startOfMonth },
    },
    orderBy: { createdAt: "desc" },
  })

  result.processed = payrollEvents.length

  if (payrollEvents.length === 0) {
    return result
  }

  const rippling = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "RIPPLING" } },
    select: { id: true, status: true },
  })

  const gusto = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "GUSTO" } },
    select: { id: true, status: true },
  })

  const headcountConn = rippling?.status === "ACTIVE" ? rippling : gusto?.status === "ACTIVE" ? gusto : null

  for (const event of payrollEvents) {
    const normData = event.normalisedData as Record<string, unknown>

    const headcount = (normData?.headcount as number) ?? null
    const expectedPerHead = (normData?.averageSalaryMonthly as number) ?? null
    const department = (normData?.department as string) ?? null

    if (headcount && expectedPerHead && event.amount) {
      const expectedTotal = headcount * expectedPerHead
      const variance = Math.abs(event.amount - expectedTotal)
      const variancePct = expectedTotal > 0 ? variance / expectedTotal : 0

      if (variancePct > 0.1) {
        const alert: HeadcountAlert = {
          type: "AMOUNT_MISMATCH",
          description: `Payroll amount ${event.amount.toFixed(2)} differs from expected ${expectedTotal.toFixed(2)} by ${(variancePct * 100).toFixed(1)}% for ${department ?? "unknown department"}`,
          severity: variancePct > 0.2 ? "HIGH" : "MEDIUM",
          payrollEventId: event.id,
          expectedAmount: expectedTotal,
          actualAmount: event.amount,
        }
        result.alerts.push(alert)
        result.discrepancies++

        await prisma.aIDecisionLog.create({
          data: {
            organizationId,
            financialEventId: event.id,
            agentName: "Headcount",
            decisionType: "HEADCOUNT_VALIDATION",
            inputSummary: { headcount, expectedPerHead, department, expectedTotal } as any,
            output: { variance, variancePct, alert: alert.type } as any,
            confidence: 0.85,
            reasoning: alert.description,
          },
        }).catch(() => {})

        if (alert.severity === "HIGH") {
          await createHeadcountNotification(organizationId, alert)
        }
      } else {
        result.matched++
      }
    } else {
      result.matched++
    }
  }

  const lastMonth = new Date(startOfMonth.getTime() - 1)
  const prevMonthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1)

  const prevMonthPayroll = await prisma.financialEvent.aggregate({
    where: {
      organizationId,
      eventType: "PAYROLL_PROCESSED",
      status: "POSTED",
      createdAt: { gte: prevMonthStart, lt: startOfMonth },
    },
    _sum: { amount: true },
    _count: { id: true },
  })

  const currentMonthTotal = payrollEvents.reduce((s, e) => s + (e.amount ?? 0), 0)
  const prevMonthTotal = prevMonthPayroll._sum.amount ?? 0

  if (prevMonthTotal > 0) {
    const change = (currentMonthTotal - prevMonthTotal) / prevMonthTotal
    if (Math.abs(change) > 0.15) {
      const alert: HeadcountAlert = {
        type: "AMOUNT_MISMATCH",
        description: `Total payroll changed ${change > 0 ? "+" : ""}${(change * 100).toFixed(1)}% vs last month (${prevMonthTotal.toFixed(0)} to ${currentMonthTotal.toFixed(0)})`,
        severity: Math.abs(change) > 0.25 ? "HIGH" : "MEDIUM",
      }
      result.alerts.push(alert)
      if (!result.discrepancies) result.discrepancies++
    }
  }

  return result
}

async function createHeadcountNotification(organizationId: string, alert: HeadcountAlert) {
  await prisma.notification.create({
    data: {
      organizationId,
      type: alert.severity === "HIGH" ? "ERROR" : "WARNING",
      title: "Payroll Headcount Discrepancy",
      message: alert.description,
      link: "/staging?source=gusto&status=POSTED",
    },
  }).catch(() => {})
}
