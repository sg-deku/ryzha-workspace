import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"

export async function runApprovalAgent(poId: string, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: `You are an AI Approval Routing Agent. Analyze purchase orders and decide who needs to approve them based on amount, category, and historical data. Suggest an approval path.` },
    { role: "user", content: `PO ID: ${poId}` }
  ], "agent_p2p_approval", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "Approval Agent",
    status: "ROUTED",
    suggestedApprovers: ["Department Head", "Finance Manager"],
    aiReasoning: response.content
  }
}
