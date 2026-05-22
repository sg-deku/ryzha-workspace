import { invokeAI } from "@/lib/ai/client"

export async function generateNarrative(
  reportType: string,
  data: any,
  query: string,
  organizationId: string
): Promise<string> {
  const prompt = `You are a financial analyst. Write a short, professional summary (2-3 sentences) based on the data below.

Report type: ${reportType}
User's original question: "${query}"

Data:
${JSON.stringify(data, null, 2)}

Focus on key trends, anomalies, or actionable insights. Do not repeat obvious numbers.`

  try {
    return await invokeAI(organizationId, prompt, { temperature: 0.5, feature: "report_narrative" })
  } catch (err) {
    console.error("Narrative generator error:", err)
    return "Unable to generate summary at this time."
  }
}
