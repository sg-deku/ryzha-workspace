import { prisma } from "@/lib/prisma"
import { getAIClientConfig, parseAIJson } from "@/lib/ai/client"

export interface ForecastParams {
  organizationId: string
  currentBalance: number
  whatIfScenarios?: { description: string; amount: number; frequency: "monthly" | "once" }[]
}

export async function generateCashFlowForecast({
  organizationId,
  currentBalance,
  whatIfScenarios = []
}: ForecastParams) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const expenses = await prisma.expense.findMany({
    where: { organizationId, date: { gte: sixMonthsAgo } },
    orderBy: { date: "asc" }
  })

  const invoices = await prisma.invoice.findMany({
    where: { organizationId, issueDate: { gte: sixMonthsAgo } },
    orderBy: { issueDate: "asc" },
    include: { lineItems: true }
  })

  const historicalData = {
    expenses: expenses.map(e => ({ date: e.date, amount: e.amount, description: e.description })),
    invoices: invoices.map(i => ({
      issueDate: i.issueDate,
      dueDate: i.dueDate,
      amount: i.total,
      status: i.status,
      client: i.clientName
    }))
  }

  const prompt = `You are a financial AI expert. Predict the next 90 days of cash flow for this startup.
Current Balance: $${currentBalance}
Historical Data (Last 6 Months):
${JSON.stringify(historicalData)}

"What If" Scenarios to include in forecast:
${JSON.stringify(whatIfScenarios)}

Tasks:
1. Identify recurring expenses (same vendor, similar amount, monthly).
2. Predict late payments based on status and due dates.
3. Project daily cash balance for the next 90 days.
4. Return JSON only (no markdown) with:
   - "dailyForecast": Array of { date: string (YYYY-MM-DD), balance: number }
   - "recurringExpenses": Array of { description: string, amount: number, probability: number }
   - "latePaymentRisks": Array of { invoiceNumber: string, client: string, riskLevel: "low" | "medium" | "high" }
   - "insights": Array of strings (e.g., "Balance predicted below $5000 on day 45")`

  const { client, model } = await getAIClientConfig(organizationId)
  const completion = await client.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  })

  return parseAIJson(completion.choices[0].message.content || "{}")
}
