import { prisma } from "@/lib/prisma"
import { getFinancialContext } from "@/lib/ai/rag"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { appendAgentLog } from "./utils"
import { addMonths, startOfMonth } from "date-fns"

export async function runOMAgent(transactionId: string) {
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
  const deferralMonths = settings?.deferralPeriodMonths || 12
  const deferredRules = (settings?.deferredRevenueRules as string[]) || ["annual", "yearly", "subscription"]

  let isDeferred = deferredRules.some(rule => tx.description?.toLowerCase().includes(rule.toLowerCase()))
  let aiReasoning = ""

  if (tx.description) {
    try {
      const context = await getFinancialContext(`How should we recognize revenue for: ${tx.description}?`, tx.organizationId)
      
      const response = await callLLM(tx.organizationId, [
        {
          role: "system",
          content: `You are an expert accountant (O&M Agent). Decide if revenue should be recognized immediately or deferred based on ASC 606 rules. 
          Context: ${context}
          Respond with JSON: { "deferred": boolean, "reason": string, "period": number }`
        },
        {
          role: "user",
          content: `Transaction: ${tx.description}, Amount: ${tx.amount}`
        }
      ], "agent_om", { temperature: 0 })

      try {
        const result = parseAIJson(response.content as string) as any
        isDeferred = result.deferred
        aiReasoning = result.reason
      } catch (e) {
        console.error("AI reasoning failed", e)
      }
    } catch (error) {
      console.error("O&M AI failed", error)
    }
  }

  const paymentFraction: number = tx.paymentFraction ?? 1
  const effectiveAmount = tx.amount * paymentFraction

  let updated
  if (isDeferred) {
    const monthlyPortion = effectiveAmount / deferralMonths
    const deferred = effectiveAmount - monthlyPortion
    const logMessage = aiReasoning 
      ? `O&M: ${aiReasoning} (ASC 606). Recognized $${monthlyPortion.toFixed(2)}, deferred $${deferred.toFixed(2)} over ${deferralMonths} months.`
      : `STOP! According to ASC 606, this transaction should be deferred. Recognized $${monthlyPortion.toFixed(2)}, deferred $${deferred.toFixed(2)}.`

    await appendAgentLog(transactionId, "O&M", logMessage)

    updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        recognizedRevenue: monthlyPortion,
        deferredRevenue: deferred,
        revenueRecognitionType: "deferred",
      },
    })

    const existingScheduleCount = await prisma.deferredRevenueSchedule.count({
      where: { transactionId }
    })

    if (existingScheduleCount === 0) {
      const scheduleRows = Array.from({ length: deferralMonths }, (_, i) => ({
        transactionId,
        period: addMonths(startOfMonth(new Date()), i + 1),
        amount: monthlyPortion,
        recognized: false,
        organizationId: tx.organizationId
      }))
      await prisma.deferredRevenueSchedule.createMany({ data: scheduleRows })
    }
  } else {
    const logMessage = aiReasoning || "Approved: immediate revenue recognition."
    await appendAgentLog(transactionId, "O&M", logMessage)

    updated = await prisma.transaction.findUnique({ where: { id: transactionId } })
  }
  return updated
}
