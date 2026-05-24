import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export async function suggestInvoiceLineItems(organizationId: string, userInput: string, clientHistory?: string) {
  const prompt = `You are an expert invoice generator for startups.
Input: User typed "${userInput}".
${clientHistory ? `Context from past invoices for this client: ${clientHistory}` : ""}

Generate 2-3 detailed, professional line items based on the input.
For each item, include:
- description: clear and professional
- suggestedQuantity: a reasonable number (e.g., hours, units)
- suggestedUnitPrice: reasonable price in USD for a US startup
- recommendedTaxRate: reasonable tax rate percentage (0, 7, 15, or 19 depending on common scenarios)

Return ONLY a JSON array: [{ "description": string, "suggestedQuantity": number, "suggestedUnitPrice": number, "recommendedTaxRate": number }]`

  const response = await callLLM(organizationId, [
    { role: "user", content: prompt }
  ], "invoice_suggest", { temperature: 0.3 })

  const content = response.content as string
  const result = parseAIJson(content)

  return Array.isArray(result) ? result : (result.items || [])
}
