import { getAIClientConfig, parseAIJson } from "@/lib/ai/client"

const categories = [
  "Software & SaaS",
  "Hardware",
  "Office Supplies",
  "Meals & Entertainment",
  "Travel",
  "Marketing",
  "Legal",
  "Contractors",
  "Rent",
  "Utilities",
  "Other"
]

export async function categorizeExpense(description: string, amount: number, organizationId?: string, vendor?: string) {
  let retries = 3
  let lastError: any

  while (retries >= 0) {
    try {
      const prompt = `You are an expense categorizer for startup accounting.
Transaction: Description: "${description}", Amount: ${amount}, Vendor: ${vendor || "unknown"}.
Choose best category from: ${categories.join(", ")}. Also decide tax-deductible (true/false).
Return JSON only (no markdown): { "category": string, "taxRelevant": boolean, "confidence": 0-1 }`

      const { client, model } = await getAIClientConfig(organizationId || "")
      const completion = await client.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
      })

      const result = parseAIJson<{ category: string; taxRelevant: boolean; confidence: number }>(
        completion.choices[0].message.content || "{}"
      )
      return {
        category: result.category || "Other",
        taxRelevant: result.taxRelevant ?? false,
        confidence: result.confidence ?? 0.5
      }
    } catch (error) {
      lastError = error
      retries--
      if (retries >= 0) {
        const delay = Math.pow(2, 3 - retries) * 1000
        console.warn(`AI categorization failed, retrying in ${delay}ms... (${retries} left)`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  console.error("AI categorization failed after retries:", lastError)
  throw lastError
}
