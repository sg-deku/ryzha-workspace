import { getFinancialContext } from "@/lib/ai/rag"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { appendAgentLog } from "./utils"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { createNotification } from "@/lib/notifications"
import { addMonths, startOfMonth } from "date-fns"

const DEFERRED_KEYWORDS = [
  "annual", "yearly", "subscription", "prepaid", "upfront", "12-month",
  "24-month", "multi-year", "retainer", "advance", "license", "maintenance",
]

const IMMEDIATE_KEYWORDS = [
  "one-time", "single", "consulting", "project", "milestone", "delivery",
  "professional services", "setup", "onboarding", "training",
]

function deterministicDeferralCheck(
  description: string | null | undefined,
  deferredRevenueRules: string[]
): "deferred" | "immediate" | "inconclusive" {
  if (!description) return "immediate"
  const lower = description.toLowerCase()

  const allDeferredRules = [...DEFERRED_KEYWORDS, ...deferredRevenueRules.map(r => r.toLowerCase())]

  const matchesDeferred = allDeferredRules.some(kw => lower.includes(kw))
  const matchesImmediate = IMMEDIATE_KEYWORDS.some(kw => lower.includes(kw))

  if (matchesDeferred && !matchesImmediate) return "deferred"
  if (matchesImmediate && !matchesDeferred) return "immediate"
  return "inconclusive"
}

export async function runOMAgent(transactionId: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      organization: {
        include: { financialSettings: true },
      },
    },
  })

  if (!tx) return null

  const settings = tx.organization.financialSettings
  const deferralMonths = settings?.deferralPeriodMonths || 12
  const deferredRevenueRules = (settings?.deferredRevenueRules as string[]) || []

  const deterministicResult = deterministicDeferralCheck(tx.description, deferredRevenueRules)

  let isDeferred: boolean
  let aiReasoning = ""
  let requiresReview = false

  if (deterministicResult === "deferred") {
    isDeferred = true
    aiReasoning = `Deterministic ASC 606: description matches deferral keyword pattern.`
  } else if (deterministicResult === "immediate") {
    isDeferred = false
    aiReasoning = `Deterministic ASC 606: description matches immediate recognition pattern.`
  } else {
    isDeferred = false
    requiresReview = true

    if (tx.description) {
      try {
        const context = await getFinancialContext(
          `How should we recognize revenue for: ${tx.description}?`,
          tx.organizationId
        )

        const response = await callLLM(
          tx.organizationId,
          [
            {
              role: "system",
              content: `You are an expert accountant (O&M Agent). Advise whether revenue should be deferred based on ASC 606. Deterministic rules could not classify this transaction.
Context: ${context}
Respond with JSON: { "deferred": boolean, "reason": string, "confidence": "high" | "medium" | "low" }`,
            },
            {
              role: "user",
              content: `Transaction: ${tx.description}, Amount: ${tx.amount}`,
            },
          ],
          "agent_om",
          { temperature: 0 }
        )

        try {
          const result = parseAIJson(response.content as string) as {
            deferred: boolean
            reason: string
            confidence: string
          }

          if (result.confidence === "high") {
            isDeferred = result.deferred
            requiresReview = false
            aiReasoning = `AI Advisory (high confidence): ${result.reason}`
          } else {
            isDeferred = false
            requiresReview = true
            aiReasoning = `AI Advisory (${result.confidence} confidence): ${result.reason}. Defaulting to immediate recognition — flagged for manual review.`
          }
        } catch {
          aiReasoning = `AI classification failed. Defaulting to immediate recognition — flagged for manual review.`
          requiresReview = true
        }
      } catch {
        aiReasoning = `AI call failed. Defaulting to immediate recognition — flagged for manual review.`
        requiresReview = true
      }
    }
  }

  const paymentFraction: number = tx.paymentFraction ?? 1
  const effectiveAmount = tx.amount * paymentFraction

  let updated

  if (requiresReview) {
    await appendAgentLog(
      transactionId,
      "O&M",
      `INCONCLUSIVE — ${aiReasoning} Transaction flagged for manual ASC 606 review.`
    )

    await createNotification({
      organizationId: tx.organizationId,
      type: "WARNING",
      title: "ASC 606 Classification Needs Review",
      message: `Transaction $${tx.amount} from ${tx.customerEmail ?? "unknown"}: "${tx.description}" could not be deterministically classified. Revenue recognized as immediate — please review.`,
      link: `/transactions/${transactionId}`,
    })

    updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        recognizedRevenue: effectiveAmount,
        deferredRevenue: 0,
        revenueRecognitionType: "immediate",
      },
    })
  } else if (isDeferred) {
    const monthlyPortion = effectiveAmount / deferralMonths
    const deferred = effectiveAmount - monthlyPortion

    await appendAgentLog(
      transactionId,
      "O&M",
      `${aiReasoning} Recognized $${monthlyPortion.toFixed(2)}, deferred $${deferred.toFixed(2)} over ${deferralMonths} months.`
    )

    updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        recognizedRevenue: monthlyPortion,
        deferredRevenue: deferred,
        revenueRecognitionType: "deferred",
      },
    })

    const existingScheduleCount = await prisma.deferredRevenueSchedule.count({
      where: { transactionId },
    })

    if (existingScheduleCount === 0) {
      const scheduleRows = Array.from({ length: deferralMonths }, (_, i) => ({
        transactionId,
        period: addMonths(startOfMonth(new Date()), i + 1),
        amount: monthlyPortion,
        recognized: false,
        organizationId: tx.organizationId,
      }))
      await prisma.deferredRevenueSchedule.createMany({ data: scheduleRows })
    }

    await createSystemJournalEntry({
      organizationId: tx.organizationId,
      sourceType: "OM_Deferred",
      sourceId: transactionId,
      reference: `OM-DEF-${transactionId.slice(-8)}`,
      description: `ASC 606 deferral — ${tx.description ?? transactionId}`,
      entryDate: new Date(),
      lines: [
        {
          accountName: "Subscription Revenue",
          accountType: "Revenue",
          debit: deferred,
          credit: 0,
          description: `Reverse immediate recognition — deferred portion`,
        },
        {
          accountName: "Deferred Revenue",
          accountType: "Liabilities",
          debit: 0,
          credit: deferred,
          description: `Deferred over ${deferralMonths} months`,
        },
      ],
    })
  } else {
    await appendAgentLog(transactionId, "O&M", `${aiReasoning} Immediate revenue recognition applied.`)
    updated = await prisma.transaction.findUnique({ where: { id: transactionId } })
  }

  return updated
}
