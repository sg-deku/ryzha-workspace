import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, Building2, AlertCircle } from "lucide-react"

async function getDepartmentPL(organizationId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)

  const [architecture, settings, expenseEvents, revenueThisMonth] = await Promise.all([
    prisma.financialArchitecture.findUnique({ where: { organizationId } }),
    prisma.financialSettings.findUnique({ where: { organizationId }, select: { monthlyBudget: true } }),
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] },
        status: { in: ["POSTED", "APPROVED"] },
        createdAt: { gte: startOfMonth },
      },
      select: { amount: true, normalisedData: true, eventType: true, source: true },
    }),
    prisma.financialEvent.aggregate({
      where: {
        organizationId,
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
        status: "POSTED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
  ])

  const departments: string[] =
    (architecture?.departmentStructure as any)?.departments ?? [
      "Engineering",
      "Sales",
      "Marketing",
      "G&A",
    ]

  const monthlyBudget = settings?.monthlyBudget ?? null
  const perDeptBudget = monthlyBudget ? monthlyBudget / departments.length : null

  const deptActuals: Record<string, number> = {}
  for (const dept of departments) deptActuals[dept] = 0

  for (const event of expenseEvents) {
    const normData = event.normalisedData as any
    const dept =
      normData?.department ??
      normData?.costCenter ??
      normData?.team ??
      (event.eventType === "PAYROLL_PROCESSED" ? "Engineering" : "G&A")

    const matchedDept = departments.find((d) =>
      d.toLowerCase() === dept?.toLowerCase()
    ) ?? "G&A"

    deptActuals[matchedDept] = (deptActuals[matchedDept] ?? 0) + (event.amount ?? 0)
  }

  const totalRevenue = revenueThisMonth._sum.amount ?? 0
  const totalExpenses = Object.values(deptActuals).reduce((a, b) => a + b, 0)

  const rows = departments.map((dept) => {
    const actual = deptActuals[dept] ?? 0
    const budgeted = perDeptBudget ?? 0
    const variance = actual - budgeted
    const variancePct = budgeted > 0 ? (variance / budgeted) * 100 : 0
    return {
      department: dept,
      actual,
      budgeted,
      variance,
      variancePct,
      status: variancePct > 20 ? "over" : variancePct > 5 ? "risk" : "ok",
    }
  })

  return {
    rows,
    totalRevenue,
    totalExpenses,
    grossMargin: totalRevenue - totalExpenses,
    grossMarginPct: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : null,
    hasBudget: !!monthlyBudget,
    period: `${now.toLocaleString("default", { month: "long" })} ${now.getFullYear()}`,
  }
}

export default async function DepartmentPLPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const data = await getDepartmentPL(session.user.organizationId)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Department P&L</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Cost allocation by department · {data.period}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Revenue",
            value: formatCurrency(data.totalRevenue, "USD"),
            icon: TrendingUp,
            color: "text-emerald-600",
          },
          {
            label: "Total Expenses",
            value: formatCurrency(data.totalExpenses, "USD"),
            icon: TrendingDown,
            color: "text-red-500",
          },
          {
            label: "Gross Margin",
            value: formatCurrency(data.grossMargin, "USD"),
            icon: data.grossMargin >= 0 ? TrendingUp : TrendingDown,
            color: data.grossMargin >= 0 ? "text-emerald-600" : "text-red-500",
          },
          {
            label: "Margin %",
            value: data.grossMarginPct !== null ? `${data.grossMarginPct.toFixed(1)}%` : "—",
            icon: Minus,
            color: (data.grossMarginPct ?? 0) > 50 ? "text-emerald-600" : "text-amber-600",
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center gap-3 p-5 border-b">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold">Cost by Department</h3>
          {!data.hasBudget && (
            <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              Set a monthly budget in Settings to see variance analysis
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-5 py-3 font-medium text-muted-foreground">Department</th>
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">Actual</th>
                {data.hasBudget && (
                  <>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">Budget</th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">Variance</th>
                    <th className="text-right px-5 py-3 font-medium text-muted-foreground">% Used</th>
                    <th className="text-center px-5 py-3 font-medium text-muted-foreground">Status</th>
                  </>
                )}
                <th className="text-right px-5 py-3 font-medium text-muted-foreground">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.rows.map((row) => (
                <tr key={row.department} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{row.department}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {formatCurrency(row.actual, "USD")}
                  </td>
                  {data.hasBudget && (
                    <>
                      <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(row.budgeted, "USD")}
                      </td>
                      <td className={`px-5 py-3.5 text-right tabular-nums font-medium ${row.variance > 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {row.variance > 0 ? "+" : ""}{formatCurrency(row.variance, "USD")}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                        {row.budgeted > 0 ? `${Math.round((row.actual / row.budgeted) * 100)}%` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.status === "over"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                            : row.status === "risk"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        }`}>
                          {row.status === "over" ? "Over budget" : row.status === "risk" ? "At risk" : "On track"}
                        </span>
                      </td>
                    </>
                  )}
                  <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                    {data.totalExpenses > 0
                      ? `${((row.actual / data.totalExpenses) * 100).toFixed(1)}%`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/20 font-semibold">
                <td className="px-5 py-3.5">Total</td>
                <td className="px-5 py-3.5 text-right tabular-nums">
                  {formatCurrency(data.totalExpenses, "USD")}
                </td>
                {data.hasBudget && (
                  <>
                    <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                      {formatCurrency(data.rows.reduce((s, r) => s + r.budgeted, 0), "USD")}
                    </td>
                    <td className="px-5 py-3.5" colSpan={3} />
                  </>
                )}
                <td className="px-5 py-3.5 text-right">100%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {!data.hasBudget && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              No monthly budget configured
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/70 mt-0.5">
              Set a monthly operating budget in{" "}
              <a href="/settings" className="underline">Settings</a>{" "}
              to see budget vs actuals variance analysis per department.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <p className="text-sm font-semibold mb-4">Expense breakdown by type</p>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <p className="flex justify-between">
            <span>Corporate card expenses (Ramp, Brex, etc.)</span>
            <span>routed via AP Agent · GL coded automatically</span>
          </p>
          <p className="flex justify-between">
            <span>Payroll (Gusto, Rippling, etc.)</span>
            <span>allocated by department on payroll run</span>
          </p>
          <p className="flex justify-between">
            <span>Vendor bills (BILL, Ramp bills)</span>
            <span>3-way match via AP Agent</span>
          </p>
        </div>
      </div>
    </div>
  )
}
