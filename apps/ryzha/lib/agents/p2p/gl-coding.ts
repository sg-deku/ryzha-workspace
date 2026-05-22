import { callLLM } from "@/lib/ai/llm"

export async function runGLCodingAgent(description: string, organizationId: string) {
  const response = await callLLM(organizationId, [
    { role: "system", content: `You are an AI GL Coding Agent. Based on the description of an expense or invoice, suggest the most appropriate General Ledger (GL) account or category.` },
    { role: "user", content: `Description: ${description}` }
  ], "agent_p2p_gl", { modelName: "gpt-4o-mini", temperature: 0 })

  return {
    agent: "GL Coding Agent",
    suggestedCategory: "Professional Services",
    aiReasoning: response.content
  }
}
