import { callLLM } from "@/lib/ai/llm"

export async function runCreditAgent(customerId: string, amount: number, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: "Evaluate the customer's credit worthiness for a specific order amount." },
    { role: "user", content: `Customer ID: ${customerId}, Order Amount: ${amount}` }
  ], "agent_o2c_credit", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "Credit Agent",
    approved: true,
    creditLimit: 10000,
    aiReasoning: response.content
  }
}
