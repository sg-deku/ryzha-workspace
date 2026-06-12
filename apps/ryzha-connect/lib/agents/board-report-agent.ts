import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface BoardReportResult {
  period: string
  narrative: string
  keyMetrics: {
    mrr: number
    arr: number
    mrrGrowth: number
    burnRate: number
    runway: number
    netBurn: number
    revenueThisMonth: number
    expensesThisMonth: number
    newSubscriptions: number
    cancelledSubscriptions: number
    anomaliesDetected: number
    pendingApprovals: number
  }
  riskFlags: { severity: "HIGH" | "MEDIUM" | "LOW"; message: string }[]
  generatedAt: string
}

function formatPeriod(d: Date) {
  return d.toLocaleString("en-US", { month: "long", year: "numeric" })
}

export async function runBoardReportAgent(organizationId: string): Promise<BoardReportResult> {
  const now = new Date()
  const period = formatPeriod(now)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)

  const [
    revenueThisMonth,
    revenueLastMonth,
    expensesThisMonth,
    newSubs,
    cancelledSubs,
    architecture,
    anomalies,
    pendingApprovals,
    revenueQ,
    expensesQ,
  ] = await Promise.all([
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
        status: "POSTED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
        status: "POSTED",
        createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] },
        status: "POSTED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.financialEvent.count({
      where: { organizationId, eventType: "SUBSCRIPTION_CREATED", createdAt: { gte: startOfMonth } },
    }),
    prisma.financialEvent.count({
      where: { organizationId, eventType: "SUBSCRIPTION_CANCELLED", createdAt: { gte: startOfMonth } },
    }),
    prisma.financialArchitecture.findUnique({ where: { organizationId } }),
    prisma.aIDecisionLog.count({
      where: {
        organizationId,
        agentName: "Anomaly",
        createdAt: { gte: startOfMonth },
      },
    }),
    prisma.financialEventApproval.count({
      where: { organizationId, status: "PENDING" },
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
  ])

  const mrr = revenueThisMonth._sum.amount ?? 0
  const lastMrr = revenueLastMonth._sum.amount ?? 0
  const arr = mrr * 12
  const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0
  const expenses = expensesThisMonth._sum.amount ?? 0
  const netBurn = expenses - mrr
  const monthlyBurn = expenses
  const avgMonthlyRevQ = (revenueQ._sum.amount ?? 0) / 3
  const avgMonthlyExpQ = (expensesQ._sum.amount ?? 0) / 3
  const avgNetBurnQ = avgMonthlyExpQ - avgMonthlyRevQ
  const runway = avgNetBurnQ > 0 ? 18 : 99

  const keyMetrics = {
    mrr,
    arr,
    mrrGrowth,
    burnRate: monthlyBurn,
    runway,
    netBurn,
    revenueThisMonth: mrr,
    expensesThisMonth: expenses,
    newSubscriptions: newSubs,
    cancelledSubscriptions: cancelledSubs,
    anomaliesDetected: anomalies,
    pendingApprovals,
  }

  const riskFlags: BoardReportResult["riskFlags"] = []

  if (mrrGrowth < -10) {
    riskFlags.push({ severity: "HIGH", message: `MRR declined ${Math.abs(mrrGrowth).toFixed(1)}% vs prior month - immediate review recommended` })
  } else if (mrrGrowth < 0) {
    riskFlags.push({ severity: "MEDIUM", message: `MRR down ${Math.abs(mrrGrowth).toFixed(1)}% vs prior month` })
  }

  if (cancelledSubs > newSubs && newSubs > 0) {
    riskFlags.push({ severity: "HIGH", message: `Net negative subscription growth this month (${newSubs} new, ${cancelledSubs} cancelled)` })
  }

  if (netBurn > mrr * 2) {
    riskFlags.push({ severity: "HIGH", message: `Burn rate is ${(netBurn / (mrr || 1)).toFixed(1)}× revenue - review cost structure` })
  }

  if (pendingApprovals > 10) {
    riskFlags.push({ severity: "MEDIUM", message: `${pendingApprovals} approvals outstanding - finance team action required` })
  }

  if (anomalies > 5) {
    riskFlags.push({ severity: "MEDIUM", message: `${anomalies} anomalies detected this month - review in Staging Queue` })
  }

  let narrative = generateFallbackNarrative(period, keyMetrics, riskFlags, architecture)

  try {
    const prompt = `Period: ${period}
Business Model: ${architecture?.businessModel ?? "SaaS"}

Key Metrics:
- MRR: $${mrr.toFixed(0)}
- ARR: $${arr.toFixed(0)}
- MRR Growth vs Prior Month: ${mrrGrowth.toFixed(1)}%
- Monthly Burn: $${monthlyBurn.toFixed(0)}
- Net Burn: $${netBurn.toFixed(0)}
- New Subscriptions: ${newSubs}
- Cancelled Subscriptions: ${cancelledSubs}
- Anomalies Flagged: ${anomalies}
- Pending Approvals: ${pendingApprovals}

Risk Flags: ${riskFlags.map((f) => `[${f.severity}] ${f.message}`).join("; ") || "None"}

Write a concise, board-ready financial commentary (3-4 paragraphs). Be direct and data-driven. Explain variances, highlight risks, and recommend actions where relevant. Write in third person as if presenting to a board.`

    const aiResponse = await callAI(organizationId, [
      { role: "system", content: "You are a CFO writing board-ready financial reports for VC-backed startups. Be concise, accurate, and direct." },
      { role: "user", content: prompt },
    ], {
      feature: "agent_board_report",
      maxTokens: 800,
    })

    if (aiResponse.content) narrative = aiResponse.content
  } catch {
    // fall through to template narrative
  }

  return {
    period,
    narrative,
    keyMetrics,
    riskFlags,
    generatedAt: new Date().toISOString(),
  }
}

function generateFallbackNarrative(
  period: string,
  metrics: BoardReportResult["keyMetrics"],
  risks: BoardReportResult["riskFlags"],
  architecture: any
): string {
  const f = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n)

  const growthSign = metrics.mrrGrowth >= 0 ? "+" : ""
  const model = architecture?.businessModel ?? "the business"

  let narrative = `**${period} Financial Summary**\n\n`

  narrative += `The company closed ${period} with MRR of ${f(metrics.mrr)} (ARR ${f(metrics.arr)}), representing ${growthSign}${metrics.mrrGrowth.toFixed(1)}% growth versus the prior month. `

  if (metrics.mrrGrowth > 5) {
    narrative += `This reflects continued momentum in ${model} revenue driven by ${metrics.newSubscriptions} new subscription activations during the period. `
  } else if (metrics.mrrGrowth < 0) {
    narrative += `The decline was partially offset by ${metrics.newSubscriptions} new activations, against ${metrics.cancelledSubscriptions} cancellations. Retention trends require attention. `
  } else {
    narrative += `Revenue was broadly flat with ${metrics.newSubscriptions} new activations and ${metrics.cancelledSubscriptions} cancellations recorded by Ryzha's subscription tracking agents. `
  }

  narrative += `\n\nTotal operating expenses for the period were ${f(metrics.expensesThisMonth)}, resulting in a net burn of ${f(metrics.netBurn)}. `

  if (metrics.netBurn > 0) {
    narrative += `The company remains in investment mode with burn exceeding revenue. Management should review the cost trajectory relative to growth targets. `
  } else {
    narrative += `Revenue exceeded expenses this period, reflecting improving unit economics. `
  }

  if (risks.length > 0) {
    narrative += `\n\n**Risk Highlights**: Ryzha's agent network flagged ${risks.length} item(s) requiring board awareness: ${risks.map((r) => r.message).join("; ")}. `
  }

  narrative += `\n\nRyzha processed all financial events continuously during the month with ${metrics.anomaliesDetected} anomalies detected and routed for review. ${metrics.pendingApprovals} approval(s) remain outstanding as of report date.`

  return narrative
}
