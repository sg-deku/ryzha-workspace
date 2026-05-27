import { callLLM } from "@/lib/ai/llm"

export async function runCustomerValidationAgent(customerData: any, orderAmount: number, organizationId: string) {
  const prompt = `Validate the customer data for completeness and check if the order amount exceeds their credit limit.
Customer Data: ${JSON.stringify(customerData)}
Order Amount: ${orderAmount}

If the Order Amount exceeds the Customer's creditLimit, you MUST return a status of "REJECTED" or "FLAGGED". Otherwise "VALIDATED".
Respond in JSON format with { "status": "VALIDATED" | "REJECTED", "riskScore": "Low" | "High", "reasoning": "..." }`

  try {
    const response = await callLLM(organizationId, [
      { role: "system", content: "You are a financial risk validation agent. Respond with valid JSON only." },
      { role: "user", content: prompt }
    ], "agent_o2c_validation", { temperature: 0 })

    const content = response.content as string
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (result && result.status) {
      return {
        agent: "Customer Validation Agent",
        status: result.status,
        riskScore: result.riskScore || "High",
        aiReasoning: result.reasoning || "Credit limit exceeded"
      }
    }
  } catch (e) {
    console.error("Failed to parse LLM validation", e)
  }

  // Fallback programmatic check just in case LLM fails
  const creditLimit = customerData.creditLimit || 0
  if (orderAmount > creditLimit) {
    return {
      agent: "Customer Validation Agent",
      status: "REJECTED",
      riskScore: "High",
      aiReasoning: `Order amount ($${orderAmount}) exceeds customer credit limit ($${creditLimit}).`
    }
  }

  return {
    agent: "Customer Validation Agent",
    status: "VALIDATED",
    riskScore: "Low",
    aiReasoning: "Customer data complete and order within credit limit."
  }
}
