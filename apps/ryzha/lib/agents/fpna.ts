import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { appendAgentLog } from "./utils"

export async function runFPAgent(transactionId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { 
      organization: { 
        include: { financialSettings: true } 
      } 
    }
  })
  if (!tx) return null

  const settings = tx.organization.financialSettings
  const targetMonthlyRevenue = settings?.targetMonthlyRevenue || 10000

  // Bank balance comes from FinancialSnapshot plus adjustments
  const snapshot = await prisma.financialSnapshot.findUnique({ where: { organizationId: tx.organizationId } })
  const lastKnownBalance = snapshot?.bankBalance ?? settings?.bankBalance ?? 0
  const bankBalance = lastKnownBalance

  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const [glRevenue, currentMonthGLRevenue, recentExpenses] = await Promise.all([
    prisma.generalLedgerEntry.aggregate({
      where: { organizationId: tx.organizationId, accountType: "Revenue" },
      _sum: { credit: true }
    }),
    prisma.generalLedgerEntry.aggregate({
      where: {
        organizationId: tx.organizationId,
        accountType: "Revenue",
        date: { gte: monthStart }
      },
      _sum: { credit: true }
    }),
    prisma.expense.aggregate({
      where: { 
        organizationId: tx.organizationId, 
        date: { gte: threeMonthsAgo } 
      },
      _sum: { amount: true }
    })
  ])

  const currentRevenue = glRevenue._sum.credit ?? 0
  const avgMonthlyExpenses = (recentExpenses._sum.amount || 0) / 3

  const runwayMonths = avgMonthlyExpenses > 0 ? bankBalance / avgMonthlyExpenses : 999
  const zeroCashDate = new Date()
  zeroCashDate.setDate(zeroCashDate.getDate() + Math.round(runwayMonths * 30))

  const actualMonthlyRevenue = currentMonthGLRevenue._sum.credit ?? 0
  const percentAhead = targetMonthlyRevenue > 0
    ? ((actualMonthlyRevenue - targetMonthlyRevenue) / targetMonthlyRevenue) * 100
    : 0

  let logMessage = `FP&A: Runway recalculated: ${runwayMonths.toFixed(1)} months. Zero cash date: ${zeroCashDate.toLocaleDateString()}. ${percentAhead > 0 ? `+${percentAhead.toFixed(0)}%` : `${percentAhead.toFixed(0)}%`} ahead of plan.`
  let aiNarrative = ""

  // Upgrade with AI Narrative & Scenario Analysis
  try {
    const response = await callLLM(tx.organizationId, [
      {
        role: "system",
        content: `You are a strategic CFO (FP&A Agent). Analyze the company's financial health.
          Runway: ${runwayMonths.toFixed(1)} months
          Zero Cash Date: ${zeroCashDate.toLocaleDateString()}
          Monthly Burn: $${avgMonthlyExpenses.toFixed(2)}
          Revenue vs Plan: ${percentAhead.toFixed(0)}%
          
          Respond with JSON: { "narrative": string, "scenarios": { "optimistic": string, "pessimistic": string } }`
      },
      {
        role: "user",
        content: `Current transaction: ${tx.description} for $${tx.amount}. Give me a short narrative summary.`
      }
    ], "agent_fpna", { temperature: 0.7 })

    try {
      const result = parseAIJson(response.content as string)
      aiNarrative = result.narrative
      logMessage = `FP&A: ${aiNarrative}`
    } catch (e) {
      console.error("FP&A AI narrative failed", e)
    }
  } catch (error) {
    console.error("FP&A AI failed", error)
  }

  await appendAgentLog(transactionId, "FP&A", logMessage)

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: { runwayMonths, zeroCashDate, percentAhead },
  })

  // Update global financial snapshot
  await prisma.financialSnapshot.upsert({
    where: { organizationId: tx.organizationId },
    update: { 
      bankBalance, 
      averageMonthlyExpenses: avgMonthlyExpenses, 
      runwayMonths, 
      zeroCashDate 
    },
    create: { 
      organizationId: tx.organizationId, 
      bankBalance, 
      averageMonthlyExpenses: avgMonthlyExpenses, 
      runwayMonths, 
      zeroCashDate 
    }
  })

  return updated
}
