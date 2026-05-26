import { prisma } from "@/lib/prisma"
import { callLLM } from "@/lib/ai/llm"
import { parseAIJson } from "@/lib/ai/client"

export async function runApprovalAgent(poId: string, organizationId: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { vendor: true, lineItems: true, organization: true }
  })

  if (!po) throw new Error("Purchase Order not found")

  const response = await callLLM(organizationId, [
    { role: "system", content: `You are an AI Approval Routing Agent. Analyze purchase orders and decide who needs to approve them based on amount, category, and historical data. Respond ONLY with JSON: { "approvers": ["Role 1", "Role 2"], "threshold": 1000, "reasoning": "string" }` },
    { role: "user", content: `PO ID: ${poId}, Vendor: ${po.vendor.name}, Total: ${po.totalAmount}, Items: ${JSON.stringify(po.lineItems)}` }
  ], "agent_p2p_approval", { temperature: 0 })

  let parsed: any = {}
  try {
    parsed = parseAIJson(response.content as string)
  } catch (e) {
    console.error("Approval Agent failed to parse AI JSON", e)
  }

  return {
    agent: "Approval Agent",
    status: "ROUTED",
    suggestedApprovers: parsed.approvers || ["Finance Manager"],
    approvalThreshold: parsed.threshold,
    reasoning: parsed.reasoning || response.content
  }
}
