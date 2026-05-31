import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"
import { appendAgentLog } from "./utils"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"

export async function runR2RAgent(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!transaction) return null

  let logMessage = `R2R: New payment of $${transaction.amount}. Recording credit to revenue.`
  let metadata: Record<string, unknown> = {}
  let productType = "Generic"
  let customer = transaction.customerEmail ?? "Unknown"

  if (transaction.description) {
    try {
      const response = await callLLM(transaction.organizationId, [
        {
          role: "system",
          content: "Extract structured financial data from the transaction description. Respond in JSON with keys: customer (string), product_type (string), is_subscription (boolean), period_months (number)."
        },
        {
          role: "user",
          content: transaction.description
        }
      ], "agent_r2r", { temperature: 0 })

      try {
        const parsed = parseAIJson(response.content as string)
        metadata = parsed
        if (parsed.customer) customer = String(parsed.customer)
        if (parsed.product_type) productType = String(parsed.product_type)
        logMessage = `R2R: Intelligent extraction complete. Customer: ${customer}, Product: ${productType}.`
      } catch (e) {
        console.error("Failed to parse AI response", e)
      }
    } catch (error) {
      console.error("AI extraction failed, falling back to deterministic", error)
    }
  }

  const alreadyHasJE = await prisma.journalEntry.findUnique({
    where: {
      organizationId_sourceType_sourceId: {
        organizationId: transaction.organizationId,
        sourceType: "R2R",
        sourceId: transaction.id,
      },
    },
    select: { id: true },
  })

  if (!alreadyHasJE) {
    const amount = transaction.amount
    await createSystemJournalEntry({
      organizationId: transaction.organizationId,
      sourceType: "R2R",
      sourceId: transaction.id,
      reference: `R2R-${transaction.id.slice(-8)}`,
      description: `Revenue recognition — ${transaction.description ?? transaction.id}`,
      entryDate: transaction.createdAt ?? new Date(),
      lines: [
        {
          accountName: "Cash",
          accountType: "Assets",
          debit: amount,
          credit: 0,
          description: `Cash received from ${customer}`,
        },
        {
          accountName: "Subscription Revenue",
          accountType: "Revenue",
          debit: 0,
          credit: amount,
          description: `${productType} — ${customer}`,
        },
      ],
    })
    logMessage += " GL journal entry posted (DR Cash / CR Revenue)."
  }

  await appendAgentLog(transactionId, "R2R", logMessage, { metadata })

  const updated = await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      recognizedRevenue: transaction.amount,
      revenueRecognitionType: "immediate",
    },
  })
  return updated
}
