import { invokeAI } from "@/lib/ai/client"
import { StructuredQuery, ReportType } from "./types"

function defaultDateRange() {
  const end = new Date()
  const start = new Date()
  start.setMonth(start.getMonth() - 1)
  return {
    startDate: start.toISOString().split("T")[0],
    endDate: end.toISOString().split("T")[0],
  }
}

function keywordFallback(query: string): StructuredQuery | null {
  const q = query.toLowerCase()
  const dates = defaultDateRange()

  const patterns: Array<{ keywords: string[]; reportType: ReportType; needsDates: boolean }> = [
    { keywords: ["runway", "cash runway", "how long", "zero cash", "burn"], reportType: "runway", needsDates: false },
    { keywords: ["aging", "overdue", "ar aging", "receivable", "outstanding invoice"], reportType: "ar_aging", needsDates: false },
    { keywords: ["revenue", "income", "sales by month", "monthly revenue"], reportType: "revenue_by_month", needsDates: true },
    { keywords: ["expense categor", "spending categor", "category breakdown", "spend by categor"], reportType: "expenses_by_category", needsDates: true },
    { keywords: ["vendor", "supplier", "spend by vendor", "vendor spend"], reportType: "spend_by_vendor", needsDates: true },
    { keywords: ["profit", "loss", "p&l", "net income", "profit and loss"], reportType: "profit_loss", needsDates: true },
    { keywords: ["cash flow", "cashflow", "inflow", "outflow", "liquidity"], reportType: "cash_flow", needsDates: true },
    { keywords: ["expense", "spending", "spend"], reportType: "expenses_by_category", needsDates: true },
  ]

  for (const { keywords, reportType, needsDates } of patterns) {
    if (keywords.some((kw) => q.includes(kw))) {
      return {
        reportType,
        parameters: needsDates ? dates : {},
      }
    }
  }

  return null
}

function extractJSON(text: string): any | null {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const source = codeBlock ? codeBlock[1] : text

  const match = source.match(/\{[\s\S]*\}/)
  if (!match) return null

  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}

export async function parseNaturalLanguageQuery(
  query: string,
  organizationId: string
): Promise<StructuredQuery | null> {
  const today = new Date().toISOString().split("T")[0]
  const { startDate: lastMonthStartStr, endDate: lastMonthEndStr } = defaultDateRange()

  const prompt = `You are a financial query parser for Ryzha. Convert the user's question into a structured report request.
Today's date: ${today}

Available report types:
- revenue_by_month (requires date range)
- expenses_by_category (requires date range)
- runway (no parameters needed)
- ar_aging (accounts receivable aging, no parameters needed)
- spend_by_vendor (requires date range, optional vendorId)
- profit_loss (requires date range)
- cash_flow (requires date range)

User question: "${query}"

Return ONLY valid JSON with no extra text:
{"reportType":"one of the above","parameters":{"startDate":"YYYY-MM-DD","endDate":"YYYY-MM-DD","vendorId":null,"customerId":null}}

If no date range is mentioned, use startDate=${lastMonthStartStr} and endDate=${lastMonthEndStr}.
For runway and ar_aging, parameters can be an empty object {}.
If the question cannot be mapped, return {"error":"unknown"}.`

  try {
    const content = await invokeAI(organizationId, prompt, { temperature: 0, json: true, feature: "report_query" })
    console.log("[query-parser] LLM response:", content)

    const result = extractJSON(content)
    if (!result || result.error) {
      return keywordFallback(query)
    }
    if (!result.reportType) {
      return keywordFallback(query)
    }
    return result as StructuredQuery
  } catch (err) {
    console.error("[query-parser] LLM call failed:", err)
    return keywordFallback(query)
  }
}
