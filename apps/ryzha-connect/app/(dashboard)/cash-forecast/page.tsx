import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

async function getCashData(organizationId: string) {
  const thirteenWeeksAgo = new Date(Date.now() - 91 * 86_400_000)

  const [inflows, outflows, settings] = await Promise.all([
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
        status: "POSTED",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] },
        status: "POSTED",
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.financialSettings.findUnique({
      where: { organizationId },
      select: { bankBalance: true },
    }),
  ])

  const totalInflow = inflows.reduce((s, e) => s + (e.amount ?? 0), 0)
  const totalOutflow = outflows.reduce((s, e) => s + (e.amount ?? 0), 0)
  const netCash = totalInflow - totalOutflow

  const bucketByMonth = (events: typeof inflows): Record<string, number> => {
    const map: Record<string, number> = {}
    for (const e of events) {
      const key = e.createdAt.toISOString().slice(0, 7)
      map[key] = (map[key] ?? 0) + (e.amount ?? 0)
    }
    return map
  }

  const inflowByMonth = bucketByMonth(inflows)
  const outflowByMonth = bucketByMonth(outflows)
  const months = Array.from(new Set([...Object.keys(inflowByMonth), ...Object.keys(outflowByMonth)])).sort()

  const recentInflows = inflows.filter((e) => e.createdAt >= thirteenWeeksAgo)
  const recentOutflows = outflows.filter((e) => e.createdAt >= thirteenWeeksAgo)

  const weeklyInflow = recentInflows.reduce((s, e) => s + (e.amount ?? 0), 0) / 13
  const weeklyOutflow = recentOutflows.reduce((s, e) => s + (e.amount ?? 0), 0) / 13
  const weeklyNetBurn = weeklyOutflow - weeklyInflow

  const currentBalance = settings?.bankBalance ?? netCash

  const forecastWeeks = Array.from({ length: 13 }, (_, i) => {
    const weekStart = new Date(Date.now() + i * 7 * 86_400_000)
    const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const projectedBalance = currentBalance - weeklyNetBurn * (i + 1)
    return { week: i + 1, label, projectedBalance, inflow: weeklyInflow, outflow: weeklyOutflow }
  })

  const runwayWeeks = weeklyNetBurn > 0 ? Math.floor(currentBalance / weeklyNetBurn) : null

  return {
    totalInflow,
    totalOutflow,
    netCash,
    months,
    inflowByMonth,
    outflowByMonth,
    weeklyInflow,
    weeklyOutflow,
    weeklyNetBurn,
    currentBalance,
    forecastWeeks,
    runwayWeeks,
  }
}

function MetricCard({
  label,
  value,
  trend,
  sub,
}: {
  label: string
  value: number
  trend: "up" | "down" | "neutral"
  sub?: string
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold tabular-nums">{formatCurrency(value)}</p>
        {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500 mb-1" />}
        {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500 mb-1" />}
        {trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground mb-1" />}
      </div>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default async function CashForecastPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const data = await getCashData(session.user.organizationId)
  const hasData = data.months.length > 0
  const hasForecast = data.weeklyOutflow > 0

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Cash Forecast</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cash position and 13-week forward projection based on historical burn rate.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Inflows (Posted)"
          value={data.totalInflow}
          trend="up"
          sub="from all connected platforms"
        />
        <MetricCard
          label="Total Outflows (Posted)"
          value={data.totalOutflow}
          trend="down"
          sub="Ramp, Gusto, AP bills"
        />
        <MetricCard
          label="Net Cash Position"
          value={data.netCash}
          trend={data.netCash >= 0 ? "up" : "down"}
          sub="inflows minus outflows"
        />
        {data.runwayWeeks != null ? (
          <div className="rounded-xl border bg-card p-5 space-y-2">
            <p className="text-sm text-muted-foreground">Estimated Runway</p>
            <p className={`text-2xl font-bold tabular-nums ${data.runwayWeeks < 12 ? "text-red-500" : data.runwayWeeks < 26 ? "text-orange-500" : "text-emerald-600"}`}>
              {data.runwayWeeks}w
            </p>
            <p className="text-xs text-muted-foreground">
              {data.runwayWeeks < 12 ? "Critical - under 3 months" : data.runwayWeeks < 26 ? "Watch - under 6 months" : "Healthy"}
            </p>
          </div>
        ) : (
          <MetricCard label="Weekly Net Burn" value={data.weeklyNetBurn} trend="down" sub="13-week average" />
        )}
      </div>

      {hasForecast && (
        <div className="rounded-xl border bg-card">
          <div className="p-5 border-b">
            <h3 className="font-semibold">13-Week Cash Runway Projection</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Based on avg weekly inflow of {formatCurrency(data.weeklyInflow)} and outflow of {formatCurrency(data.weeklyOutflow)}. Connect more platforms for accuracy.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Week</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Proj. Inflow</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Proj. Outflow</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Projected Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.forecastWeeks.map((w) => {
                  const isLow = w.projectedBalance < data.currentBalance * 0.2
                  const isCritical = w.projectedBalance <= 0
                  return (
                    <tr key={w.week} className={`hover:bg-muted/20 transition-colors ${isCritical ? "bg-red-50/50 dark:bg-red-950/10" : isLow ? "bg-orange-50/50 dark:bg-orange-950/10" : ""}`}>
                      <td className="px-5 py-3 font-medium">
                        <span className="text-xs text-muted-foreground mr-2">W{w.week}</span>
                        {w.label}
                        {isCritical && <span className="ml-2 text-xs text-red-500 font-semibold">Cash out</span>}
                        {isLow && !isCritical && <span className="ml-2 text-xs text-orange-500">Low</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 text-xs">
                        {formatCurrency(w.inflow)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-red-500 text-xs">
                        ({formatCurrency(w.outflow)})
                      </td>
                      <td className={`px-5 py-3 text-right tabular-nums font-semibold ${
                        isCritical ? "text-red-500" : isLow ? "text-orange-500" : "text-foreground"
                      }`}>
                        {isCritical ? `(${formatCurrency(Math.abs(w.projectedBalance))})` : formatCurrency(w.projectedBalance)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card">
        <div className="p-5 border-b">
          <h3 className="font-semibold">Monthly Cash Flow (Actuals)</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Based on posted financial events. Connect more platforms for a complete picture.
          </p>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No posted events yet.</p>
            <p className="text-xs text-muted-foreground">
              Events appear here once they are approved and posted to your accounting system.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Month</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Inflows</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Outflows</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wide">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.months.map((month) => {
                  const inflow = data.inflowByMonth[month] ?? 0
                  const outflow = data.outflowByMonth[month] ?? 0
                  const net = inflow - outflow
                  return (
                    <tr key={month} className="hover:bg-muted/20 transition-colors">
                      <td className="px-5 py-3.5 font-medium">
                        {new Date(month + "-01").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-emerald-600">
                        {formatCurrency(inflow)}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-red-500">
                        ({formatCurrency(outflow)})
                      </td>
                      <td className={`px-5 py-3.5 text-right tabular-nums font-semibold ${net >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {formatCurrency(net)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
