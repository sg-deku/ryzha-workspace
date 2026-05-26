import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export async function runGLCodingAgent(description: string, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: `You are an AI GL Coding Agent. Based on the description of an expense or invoice, suggest the most appropriate General Ledger (GL) account or category. Respond with ONLY JSON: { "category": "string", "confidence": 0.9, "reasoning": "string" }` },
    { role: "user", content: `Description: ${description}` }
  ], "agent_p2p_gl", { temperature: 0 })

  let parsed: any = {}
  try {
    parsed = parseAIJson(response.content as string)
  } catch (e) {
    console.error("GL Coding Agent failed to parse AI JSON", e)
  }

  return {
    agent: "GL Coding Agent",
    suggestedCategory: parsed.category || "Vendor Expense",
    confidence: parsed.confidence ?? 0.5,
    aiReasoning: parsed.reasoning || response.content
  }
}
