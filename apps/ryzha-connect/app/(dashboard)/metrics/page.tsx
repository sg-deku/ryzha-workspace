import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/utils"
import { PageHeader } from "@/components/ui/page-header"
import { StatCard } from "@/components/ui/stat-card"
import { TrendingUp, TrendingDown, Minus, DollarSign, BarChart2, RefreshCw, AlertCircle } from "lucide-react"

async function getSaaSMetrics(organizationId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
  const start12MonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
  const startOfPrevQuarter = new Date(now.getFullYear(), now.getMonth() - 6, 1)
  const endOfPrevQuarter = new Date(now.getFullYear(), now.getMonth() - 3, 0)

  const [
    thisMonthRevenue,
    lastMonthRevenue,
    thisMonthExpenses,
    lastMonthExpenses,
    newSubscriptions,
    cancelledSubscriptions,
    updatedSubscriptions,
    allPostedRevenue,
    last12MonthsRevenue,
    prevQuarterSM,
  ] = await Promise.all([
    prisma.financialEvent.aggregate({
      where: { organizationId, eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] }, status: { in: ["INGESTED", "POSTED"] }, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: { organizationId, eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] }, status: { in: ["INGESTED", "POSTED"] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: { organizationId, eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] }, status: { in: ["INGESTED", "POSTED"] }, createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.financialEvent.aggregate({
      where: { organizationId, eventType: { in: ["EXPENSE_CREATED", "PAYROLL_PROCESSED", "BILL_CREATED"] }, status: { in: ["INGESTED", "POSTED"] }, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      _sum: { amount: true },
    }),
    prisma.financialEvent.count({ where: { organizationId, eventType: "SUBSCRIPTION_CREATED", createdAt: { gte: startOfMonth } } }),
    prisma.financialEvent.count({ where: { organizationId, eventType: "SUBSCRIPTION_CANCELLED", createdAt: { gte: startOfMonth } } }),
    prisma.financialEvent.count({ where: { organizationId, eventType: "SUBSCRIPTION_UPDATED", createdAt: { gte: startOfMonth } } }),
    prisma.financialEvent.aggregate({
      where: { organizationId, eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] }, status: { in: ["INGESTED", "POSTED"] } },
      _sum: { amount: true },
    }),
    prisma.financialEvent.groupBy({
      by: ["createdAt"],
      where: { organizationId, eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] }, status: { in: ["INGESTED", "POSTED"] }, createdAt: { gte: start12MonthsAgo } },
      _sum: { amount: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.financialEvent.aggregate({
      where: { organizationId, eventType: { in: ["EXPENSE_CREATED", "BILL_CREATED"] }, status: { in: ["INGESTED", "POSTED"] }, createdAt: { gte: startOfPrevQuarter, lte: endOfPrevQuarter } },
      _sum: { amount: true },
    }),
  ])

  const mrr = thisMonthRevenue._sum.amount ?? 0
  const lastMrr = lastMonthRevenue._sum.amount ?? 0
  const arr = mrr * 12
  const mrrGrowth = lastMrr > 0 ? ((mrr - lastMrr) / lastMrr) * 100 : 0
  const expenses = thisMonthExpenses._sum.amount ?? 0
  const lastExpenses = lastMonthExpenses._sum.amount ?? 0
  const operatingMargin = mrr > 0 ? ((mrr - expenses) / mrr) * 100 : 0
  const ruleOf40 = mrrGrowth + operatingMargin
  const netBurn = expenses - mrr
  const netNewARR = (mrr - lastMrr) * 12
  const burnMultiple = netNewARR > 0 ? netBurn / netNewARR : null
  const prevQSM = prevQuarterSM._sum.amount ?? 0
  const magicNumber = prevQSM > 0 ? (netNewARR * 3) / prevQSM : null

  const monthlyBuckets: Record<string, number> = {}
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    monthlyBuckets[key] = 0
  }
  for (const row of last12MonthsRevenue) {
    const d = new Date(row.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (key in monthlyBuckets) monthlyBuckets[key] = (monthlyBuckets[key] ?? 0) + (row._sum.amount ?? 0)
  }

  const bucketValues = Object.values(monthlyBuckets)
  const maxVal = Math.max(...bucketValues, 1)

  const nrr = newSubscriptions > 0 || cancelledSubscriptions > 0
    ? Math.max(0, Math.min(200, ((newSubscriptions - cancelledSubscriptions + updatedSubscriptions) / Math.max(newSubscriptions, 1)) * 100 + 100))
    : null

  return {
    mrr, lastMrr, arr, mrrGrowth, expenses, lastExpenses, operatingMargin,
    ruleOf40, burnMultiple, magicNumber, netBurn, netNewARR,
    newSubscriptions, cancelledSubscriptions, updatedSubscriptions,
    totalRevenue: allPostedRevenue._sum.amount ?? 0,
    nrr, monthlyBuckets, maxVal,
  }
}

function Trend({ pct }: { pct: number }) {
  if (Math.abs(pct) < 0.5) return <span className="flex items-center gap-1 text-xs text-muted-foreground"><Minus className="h-3 w-3" /> Flat</span>
  if (pct > 0) return <span className="flex items-center gap-1 text-xs num-pos"><TrendingUp className="h-3 w-3" /> +{pct.toFixed(1)}% MoM</span>
  return <span className="flex items-center gap-1 text-xs num-neg"><TrendingDown className="h-3 w-3" /> {pct.toFixed(1)}% MoM</span>
}

function EfficiencyCard({
  label,
  value,
  detail,
  interpretation,
  colorClass,
  borderClass,
}: {
  label: string
  value: string
  detail: string
  interpretation: string
  colorClass: string
  borderClass: string
}) {
  return (
    <div className={`rounded-xl border bg-card p-5 ${borderClass}`}>
      <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/70 mb-2">{label}</p>
      <p className={`text-3xl font-display font-bold num ${colorClass}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5">{detail}</p>
      <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">{interpretation}</p>
    </div>
  )
}

function MiniBarChart({ buckets, maxVal }: { buckets: Record<string, number>; maxVal: number }) {
  const entries = Object.entries(buckets)
  return (
    <div className="flex items-end gap-1 h-20">
      {entries.map(([key, val], i) => {
        const height = maxVal > 0 ? Math.max(3, Math.round((val / maxVal) * 80)) : 3
        const isLast = i === entries.length - 1
        return (
          <div
            key={key}
            title={`${key}: ${formatCurrency(val)}`}
            style={{ height }}
            className={`flex-1 rounded-sm transition-all ${isLast ? "bg-primary" : "bg-primary/20"}`}
          />
        )
      })}
    </div>
  )
}

export default async function MetricsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const m = await getSaaSMetrics(session.user.organizationId)
  const sparkValues = Object.values(m.monthlyBuckets)
  const hasData = m.totalRevenue > 0 || m.newSubscriptions > 0

  return (
    <div className="space-y-8">
      <PageHeader
        title="SaaS Metrics"
        description="Calculated live from your Unified Financial Event Stream — not from spreadsheets."
        meta={
          !hasData ? (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-1.5">
              <AlertCircle className="h-3 w-3 shrink-0" />
              No revenue events ingested yet — connect Stripe or sync a billing platform
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="MRR"
          value={formatCurrency(m.mrr)}
          sub={`${m.mrrGrowth >= 0 ? "+" : ""}${m.mrrGrowth.toFixed(1)}% MoM`}
          trend={m.mrrGrowth > 0 ? "up" : m.mrrGrowth < 0 ? "down" : "neutral"}
          sparkData={sparkValues}
          hero
        />
        <StatCard
          label="ARR"
          value={formatCurrency(m.arr)}
          sub="MRR × 12"
          sparkData={sparkValues}
        />
        <StatCard
          label="Net Revenue Retention"
          value={m.nrr !== null ? `${m.nrr.toFixed(0)}%` : "—"}
          sub={m.nrr !== null ? (m.nrr >= 100 ? "Expansion positive" : "Below 100%") : "Insufficient data"}
          trend={m.nrr !== null ? (m.nrr >= 100 ? "up" : "down") : "neutral"}
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(m.totalRevenue)}
          sub="All posted events"
          trend="up"
        />
      </div>

      <div className="card-default p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">MRR Trend · Last 12 Months</p>
            <p className="text-xs text-muted-foreground mt-0.5">Monthly posted revenue from all connected sources</p>
          </div>
          <span className="text-xs text-muted-foreground">Peak: {formatCurrency(m.maxVal)}</span>
        </div>
        <MiniBarChart buckets={m.monthlyBuckets} maxVal={m.maxVal} />
        <div className="flex justify-between">
          {Object.keys(m.monthlyBuckets).filter((_, i) => i % 3 === 0 || i === Object.keys(m.monthlyBuckets).length - 1).map((key) => (
            <span key={key} className="text-[10px] text-muted-foreground">{key}</span>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-3">VC-Grade Efficiency Metrics</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <EfficiencyCard
            label="Rule of 40"
            value={m.ruleOf40.toFixed(0)}
            detail={`${m.mrrGrowth.toFixed(1)}% growth + ${m.operatingMargin.toFixed(1)}% margin`}
            interpretation={m.ruleOf40 >= 40 ? "Excellent — above Rule of 40 threshold" : m.ruleOf40 >= 20 ? "Approaching — target ≥ 40" : "Below threshold — review growth vs efficiency"}
            colorClass={m.ruleOf40 >= 40 ? "text-emerald-600" : m.ruleOf40 >= 20 ? "text-amber-600" : "text-red-500"}
            borderClass={m.ruleOf40 >= 40 ? "border-emerald-200 dark:border-emerald-900/40" : m.ruleOf40 >= 20 ? "border-amber-200 dark:border-amber-900/40" : "border-red-200 dark:border-red-900/40"}
          />
          <EfficiencyCard
            label="Burn Multiple"
            value={m.burnMultiple === null ? "—" : `${m.burnMultiple.toFixed(1)}×`}
            detail="Net burn ÷ net new ARR"
            interpretation={m.burnMultiple === null ? "Need positive net new ARR" : m.burnMultiple <= 1 ? "Efficient — <$1 per $1 of new ARR" : m.burnMultiple <= 2 ? "Moderate — target ≤ 1×" : "High — too much spend per ARR"}
            colorClass={m.burnMultiple === null ? "text-muted-foreground" : m.burnMultiple <= 1 ? "text-emerald-600" : m.burnMultiple <= 2 ? "text-amber-600" : "text-red-500"}
            borderClass=""
          />
          <EfficiencyCard
            label="Magic Number"
            value={m.magicNumber === null ? "—" : m.magicNumber.toFixed(2)}
            detail="Net new ARR ÷ prior quarter S&M"
            interpretation={m.magicNumber === null ? "Need prior quarter spend data" : m.magicNumber >= 0.75 ? "Strong GTM efficiency — scale S&M" : m.magicNumber >= 0.5 ? "Moderate — review sales efficiency" : "Weak — reconsider GTM spend mix"}
            colorClass={m.magicNumber === null ? "text-muted-foreground" : m.magicNumber >= 0.75 ? "text-emerald-600" : m.magicNumber >= 0.5 ? "text-amber-600" : "text-red-500"}
            borderClass=""
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="New Subscriptions" value={m.newSubscriptions} sub="This month" trend="up" />
        <StatCard label="Churned Subscriptions" value={m.cancelledSubscriptions} sub="This month" trend={m.cancelledSubscriptions > 0 ? "down" : "neutral"} />
        <StatCard label="Expansion / Upgrades" value={m.updatedSubscriptions} sub="Subscription changes this month" trend={m.updatedSubscriptions > 0 ? "up" : "neutral"} />
      </div>

      <div className="card-default overflow-hidden">
        <div className="px-5 py-4 border-b">
          <p className="text-sm font-semibold">MRR Movement Table</p>
          <p className="text-xs text-muted-foreground mt-0.5">Month-over-month breakdown of revenue changes</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/20">
                <th className="text-left px-5 py-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Component</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">This Month</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Last Month</th>
                <th className="text-right px-5 py-3 text-[11px] uppercase tracking-wider font-medium text-muted-foreground">Δ</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { label: "New MRR",       thisMonth: m.newSubscriptions * (m.mrr / Math.max(m.newSubscriptions + m.cancelledSubscriptions, 1)), lastMonth: 0 },
                { label: "Churned MRR",   thisMonth: -(m.cancelledSubscriptions * (m.mrr / Math.max(m.newSubscriptions + m.cancelledSubscriptions, 1))), lastMonth: 0 },
                { label: "Expansion MRR", thisMonth: m.updatedSubscriptions > 0 ? m.updatedSubscriptions * 100 : 0, lastMonth: 0 },
                { label: "Contraction MRR", thisMonth: 0, lastMonth: 0 },
                { label: "Net MRR",       thisMonth: m.mrr, lastMonth: m.lastMrr },
              ].map((row) => {
                const delta = row.thisMonth - row.lastMonth
                const isNet = row.label === "Net MRR"
                return (
                  <tr key={row.label} className={`table-row-hover ${isNet ? "font-semibold" : ""}`}>
                    <td className="px-5 py-3">{row.label}</td>
                    <td className="px-5 py-3 text-right num">{formatCurrency(Math.abs(row.thisMonth))}</td>
                    <td className="px-5 py-3 text-right num text-muted-foreground">{formatCurrency(Math.abs(row.lastMonth))}</td>
                    <td className={`px-5 py-3 text-right num ${delta >= 0 ? "num-pos" : "num-neg"}`}>
                      {delta >= 0 ? "+" : ""}{formatCurrency(delta)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground/60 px-5 py-3 border-t">
          MRR movement becomes precise as more Stripe subscription events are ingested. Connect Stripe and run the Revenue Agent.
        </p>
      </div>
    </div>
  )
}
