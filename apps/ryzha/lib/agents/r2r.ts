import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { appendAgentLog } from "./utils"
import { z } from "zod"

const extractionSchema = z.object({
  customer: z.string().optional(),
  product_type: z.string().optional(),
  is_subscription: z.boolean().default(false),
  period_months: z.number().default(1),
})

export async function runR2RAgent(transactionId: string) {
  const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!transaction) return null

  let logMessage = `R2R: New payment of $${transaction.amount}. Recording credit to revenue.`
  let metadata = {}

  // AI-powered extraction if description exists
  if (transaction.description) {
    try {
      const response = await callLLM(transaction.organizationId, [
        {
          role: "system",
          content: "Extract structured financial data from the transaction description. Respond in JSON."
        },
        {
          role: "user",
          content: transaction.description
        }
      ], "agent_r2r", { modelName: "gpt-4o-mini", temperature: 0 })

      // In a real implementation with structured output:
      // const result = await model.withStructuredOutput(extractionSchema).invoke(...)
      
      // For now, we'll parse the content manually or assume it returns JSON
      try {
        const parsed = JSON.parse(response.content as string)
        metadata = parsed
        logMessage = `R2R: Intelligent extraction complete. Customer: ${parsed.customer || "Unknown"}, Product: ${parsed.product_type || "Generic"}.`
      } catch (e) {
        console.error("Failed to parse AI response", e)
      }
    } catch (error) {
      console.error("AI extraction failed, falling back to deterministic", error)
    }
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
