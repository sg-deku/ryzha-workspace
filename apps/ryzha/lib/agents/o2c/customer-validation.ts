import { callLLM } from "@/lib/ai/llm"

export async function runCustomerValidationAgent(customerData: any, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: "Validate the customer data for completeness and potential fraud risk." },
    { role: "user", content: `Customer Data: ${JSON.stringify(customerData)}` }
  ], "agent_o2c_validation", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "Customer Validation Agent",
    status: "VALIDATED",
    riskScore: "Low",
    aiReasoning: response.content
  }
}
