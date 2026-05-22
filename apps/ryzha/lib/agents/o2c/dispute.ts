import { callLLM } from "@/lib/ai/llm"

export async function runDisputeAgent(invoiceId: string, reason: string, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: "Classify the dispute reason and suggest a resolution strategy." },
    { role: "user", content: `Invoice ID: ${invoiceId}, Reason: ${reason}` }
  ], "agent_o2c_dispute", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "Dispute Resolution Agent",
    classification: "Billing Error",
    suggestedAction: "Issue credit memo",
    aiReasoning: response.content
  }
}
