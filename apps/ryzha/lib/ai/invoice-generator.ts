import OpenAI from "openai"

let openaiInstance: OpenAI | null = null

function getOpenAI() {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error("Missing OPENAI_API_KEY environment variable")
    }
    openaiInstance = new OpenAI({ apiKey })
  }
  return openaiInstance
}

export async function suggestInvoiceLineItems(userInput: string, clientHistory?: string) {
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

  const openai = getOpenAI()
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  })

  const content = completion.choices[0].message.content || "{ \"items\": [] }"
  const result = JSON.parse(content)
  
  // Handle case where AI might return { "items": [...] } instead of raw array
  return Array.isArray(result) ? result : (result.items || [])
}
