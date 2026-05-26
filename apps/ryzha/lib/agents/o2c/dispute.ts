import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export async function runDisputeAgent(invoiceId: string, reason: string, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: "Classify the dispute reason and suggest a resolution strategy. Respond ONLY with JSON: { \"classification\": \"string\", \"suggested_action\": \"string\", \"urgency\": \"low|medium|high\", \"reasoning\": \"string\" }" },
    { role: "user", content: `Invoice ID: ${invoiceId}, Reason: ${reason}` }
  ], "agent_o2c_dispute", { temperature: 0 })

  let parsed: any = {}
  try {
    parsed = parseAIJson(response.content as string)
  } catch (e) {
    console.error("Dispute Agent failed to parse AI JSON", e)
  }

  return {
    agent: "Dispute Resolution Agent",
    classification: parsed.classification || "Billing Error",
    suggestedAction: parsed.suggested_action || "Issue credit memo",
    urgency: parsed.urgency || "medium",
    aiReasoning: parsed.reasoning || response.content,
  }
}
