import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPLData, getMonthlyPL } from "@/lib/reports/pl-utils"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const startDate = searchParams.get("startDate") ?? undefined
  const endDate = searchParams.get("endDate") ?? undefined
  const groupBy = searchParams.get("groupBy") ?? "none"
  const monthsBack = parseInt(searchParams.get("monthsBack") ?? "12")
  const format = searchParams.get("format")

  if (groupBy === "month") {
    const monthly = await getMonthlyPL(orgId, monthsBack)

    if (format === "csv") {
      const header = "Month,Revenue,Expenses,Net Income,Gross Margin %\n"
      const rows = monthly
        .map((r) => `"${r.month}",${r.revenue},${r.expenses},${r.netIncome},${r.grossMargin}`)
        .join("\n")
      return new Response(header + rows, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="pl-monthly-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    }

    return NextResponse.json({ monthly })
  }

  const pl = await getPLData(orgId, startDate, endDate)

  if (format === "csv") {
    const lines = [
      "Category,Amount",
      `Total Revenue,${pl.revenue}`,
      `Total Expenses,${pl.totalExpenses}`,
      `Net Income,${pl.netIncome}`,
      `Gross Margin %,${pl.grossMargin.toFixed(1)}`,
      "",
      "Revenue Breakdown,Amount",
      ...pl.revenueBreakdown.map((r) => `"${r.name}",${r.amount}`),
      "",
      "Expense Breakdown,Amount",
      ...pl.expenseBreakdown.map((e) => `"${e.name}",${e.amount}`),
    ]
    return new Response(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="pl-report-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  }

  return NextResponse.json(pl)
}
