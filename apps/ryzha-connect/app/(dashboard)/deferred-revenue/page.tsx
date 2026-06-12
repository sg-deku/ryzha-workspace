import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { Clock, TrendingUp, DollarSign, Info } from "lucide-react"

interface DeferredScheduleRow {
  month: string
  toRecognise: number
  cumulativeRecognised: number
  remaining: number
}

async function getDeferredRevenueData(organizationId: string) {
  const architecture = await prisma.financialArchitecture.findUnique({
    where: { organizationId },
    select: { revenueRecognition: true },
  })

  const policy = (architecture?.revenueRecognition as any)?.defaultPolicy ?? "ratable"
  const termMonths = (architecture?.revenueRecognition as any)?.defaultTermMonths ?? 12

  const since = new Date(Date.now() - 365 * 24 * 3600 * 1000)

  const payments = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
      status: "POSTED",
      createdAt: { gte: since },
    },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      normalisedData: true,
    },
    orderBy: { createdAt: "asc" },
    take: 500,
  })

  const now = new Date()
  const monthlyRecognition: Record<string, number> = {}
  let totalDeferred = 0
  let totalRecognised = 0

  for (const payment of payments) {
    const amount = payment.amount ?? 0
    if (amount <= 0) continue

    const normData = payment.normalisedData as any
    const eventTermMonths = normData?.contractTermMonths ?? termMonths
    const eventPolicy = normData?.revenueRecognitionPolicy ?? policy

    if (eventPolicy === "point_in_time") {
      totalRecognised += amount
      continue
    }

    const monthlyAmount = amount / eventTermMonths
    const startDate = new Date(payment.createdAt)

    for (let m = 0; m < eventTermMonths; m++) {
      const recognitionMonth = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1)
      const key = recognitionMonth.toISOString().slice(0, 7)

      monthlyRecognition[key] = (monthlyRecognition[key] ?? 0) + monthlyAmount

      if (recognitionMonth <= now) {
        totalRecognised += monthlyAmount
      } else {
        totalDeferred += monthlyAmount
      }
    }
  }

  const futureMonths = Object.entries(monthlyRecognition)
    .filter(([key]) => key >= now.toISOString().slice(0, 7))
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(0, 24)

  let cumulative = 0
  const schedule: DeferredScheduleRow[] = futureMonths.map(([month, toRecognise]) => {
    cumulative += toRecognise
    return {
      month,
      toRecognise: Math.round(toRecognise),
      cumulativeRecognised: Math.round(cumulative),
      remaining: Math.round(totalDeferred - cumulative),
    }
  })

  const paymentsWithDeferred = payments.filter((p) => {
    const normData = p.normalisedData as any
    const eventPolicy = normData?.revenueRecognitionPolicy ?? policy
    return eventPolicy === "ratable" && (p.amount ?? 0) > 0
  })

  return {
    totalDeferred: Math.round(totalDeferred),
    totalRecognised: Math.round(totalRecognised),
    schedule,
    policy,
    termMonths,
    contractCount: paymentsWithDeferred.length,
  }
}

function formatMonth(monthStr: string) {
  const d = new Date(monthStr + "-01")
  return d.toLocaleString("default", { month: "short", year: "numeric" })
}

export default async function DeferredRevenuePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const data = await getDeferredRevenueData(session.user.organizationId)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Deferred Revenue</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Forward recognition schedule · {data.policy === "ratable" ? `Ratable over ${data.termMonths} months` : "Point in time"} · ASC 606
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            label: "Total Deferred Balance",
            value: formatCurrency(data.totalDeferred, "USD"),
            sub: "Revenue not yet recognised",
            icon: Clock,
            color: "text-primary",
          },
          {
            label: "Total Recognised (YTD)",
            value: formatCurrency(data.totalRecognised, "USD"),
            sub: "Posted to accounting system",
            icon: TrendingUp,
            color: "text-emerald-600",
          },
          {
            label: "Active Contracts",
            value: data.contractCount,
            sub: "With deferred revenue schedule",
            icon: DollarSign,
            color: "text-muted-foreground",
          },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-card p-5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      {data.schedule.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center">
          <Clock className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No deferred revenue schedule found</p>
          <p className="text-xs text-muted-foreground mt-1">
            Connect Stripe and set a ratable revenue recognition policy to see the waterfall schedule.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b">
            <h3 className="font-semibold">Recognition Waterfall</h3>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Projected 24-month schedule
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Month</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">To Recognise</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Cumulative</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Remaining Balance</th>
                  <th className="px-5 py-3 font-medium text-muted-foreground">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.schedule.map((row, i) => {
                  const total = data.totalDeferred
                  const progressPct = total > 0
                    ? Math.min(100, (row.cumulativeRecognised / total) * 100)
                    : 0
                  const isCurrentMonth = row.month === new Date().toISOString().slice(0, 7)

                  return (
                    <tr
                      key={row.month}
                      className={`hover:bg-muted/20 transition-colors ${isCurrentMonth ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-5 py-3.5 font-medium">
                        {formatMonth(row.month)}
                        {isCurrentMonth && (
                          <span className="ml-2 text-xs text-primary font-medium">← current</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-emerald-600 font-medium">
                        +{formatCurrency(row.toRecognise, "USD")}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-muted-foreground">
                        {formatCurrency(row.cumulativeRecognised, "USD")}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums">
                        {formatCurrency(Math.max(0, row.remaining), "USD")}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground tabular-nums w-8">
                            {progressPct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-card p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">How this works</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Ryzha calculates deferred revenue from every Stripe payment (or billing platform event) using your configured ASC 606 policy.</p>
          <p>For ratable recognition: each payment is spread evenly over the contract term. The table shows how much is recognised each month going forward.</p>
          <p>Journal entries (DR Deferred Revenue / CR Revenue) are auto-posted to your accounting system by the Revenue Agent.</p>
        </div>
      </div>
    </div>
  )
}
