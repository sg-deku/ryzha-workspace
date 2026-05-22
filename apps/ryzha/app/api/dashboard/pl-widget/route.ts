import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getPLData } from "@/lib/reports/pl-utils"
import { format, subDays, startOfMonth, endOfMonth, startOfYear } from "date-fns"

export const dynamic = "force-dynamic"

function resolveDateRange(preset: string) {
  const today = new Date()
  switch (preset) {
    case "today":
      return { startDate: format(today, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "last_7_days":
      return { startDate: format(subDays(today, 7), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "last_30_days":
      return { startDate: format(subDays(today, 30), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "this_month":
      return { startDate: format(startOfMonth(today), "yyyy-MM-dd"), endDate: format(endOfMonth(today), "yyyy-MM-dd") }
    case "this_year":
      return { startDate: format(startOfYear(today), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") }
    case "all_time":
    default:
      return { startDate: undefined, endDate: undefined }
  }
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const orgId = session.user.organizationId
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const preset = searchParams.get("preset") ?? "this_month"
  const customStart = searchParams.get("startDate") ?? undefined
  const customEnd = searchParams.get("endDate") ?? undefined

  const { startDate, endDate } = customStart ? { startDate: customStart, endDate: customEnd } : resolveDateRange(preset)

  const pl = await getPLData(orgId, startDate, endDate)

  return NextResponse.json({
    revenue: pl.revenue,
    expenses: pl.totalExpenses,
    netIncome: pl.netIncome,
    grossMargin: pl.grossMargin,
    topRevenue: pl.revenueBreakdown.slice(0, 3),
    topExpenses: pl.expenseBreakdown.slice(0, 3),
  })
}
