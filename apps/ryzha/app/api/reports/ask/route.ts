export const dynamic = "force-dynamic"

import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"
import { parseNaturalLanguageQuery } from "@/lib/reports/ai/query-parser"
import { generateNarrative } from "@/lib/reports/ai/narrative-generator"
import { getRevenueByMonth } from "@/lib/reports/static/revenue"
import { getExpensesByCategory } from "@/lib/reports/static/expenses"
import { getRunway } from "@/lib/reports/static/runway"
import { getARAging } from "@/lib/reports/static/ar-aging"
import { getSpendByVendor } from "@/lib/reports/static/spend"
import { getProfitLoss } from "@/lib/reports/static/pl"
import { getCashFlow } from "@/lib/reports/static/cashflow"

const reportHandlers: Record<string, (params: any, orgId: string) => Promise<any>> = {
  revenue_by_month: getRevenueByMonth,
  expenses_by_category: getExpensesByCategory,
  runway: getRunway,
  ar_aging: getARAging,
  spend_by_vendor: getSpendByVendor,
  profit_loss: getProfitLoss,
  cash_flow: getCashFlow,
}

function inferChartType(reportType: string): string {
  switch (reportType) {
    case "revenue_by_month": return "line"
    case "expenses_by_category": return "pie"
    case "ar_aging": return "bar"
    case "cash_flow": return "line"
    case "profit_loss": return "bar"
    default: return "table"
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let query: string
  try {
    const body = await req.json()
    query = body.query
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 })
  }

  const orgId = session.user.organizationId

  const structured = await parseNaturalLanguageQuery(query, orgId)
  if (!structured || !structured.reportType) {
    return NextResponse.json(
      {
        error:
          "I can only answer questions about your financial data. Try asking: " +
          '"Show me runway", "Expenses by category last month", "Cash flow this quarter", ' +
          '"Which customers are overdue?", or "Profit and loss this year".',
      },
      { status: 400 }
    )
  }

  const handler = reportHandlers[structured.reportType]
  if (!handler) {
    return NextResponse.json(
      { error: `Report type '${structured.reportType}' is not implemented.` },
      { status: 400 }
    )
  }

  let data: any
  try {
    data = await handler(structured.parameters, orgId)
  } catch (err) {
    console.error("Error fetching report data:", err)
    return NextResponse.json({ error: "Failed to fetch report data." }, { status: 500 })
  }

  const summary = await generateNarrative(structured.reportType, data, query, orgId)

  return NextResponse.json({
    data,
    summary,
    chartType: inferChartType(structured.reportType),
    reportType: structured.reportType,
  })
}
