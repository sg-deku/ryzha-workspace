import { callLLM } from "@/lib/ai/llm"

export async function runPricingAgent(orderData: any, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: "Suggest optimal pricing and potential discounts for this order based on customer history and current promotions." },
    { role: "user", content: `Order Data: ${JSON.stringify(orderData)}` }
  ], "agent_o2c_pricing", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "Pricing & Discount Agent",
    suggestedDiscount: "5%",
    finalPrice: (orderData.amount || 1000) * 0.95,
    aiReasoning: response.content
  }
}
