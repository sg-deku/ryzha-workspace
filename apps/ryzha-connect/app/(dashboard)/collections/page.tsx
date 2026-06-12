import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import { formatCurrency, formatRelative } from "@/lib/utils"
import { Users, AlertCircle } from "lucide-react"

async function getCollectionsData(organizationId: string) {
  const arEvents = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      eventType: { in: ["INVOICE_PAID", "PAYMENT_RECEIVED", "REFUND_ISSUED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      aiDecisionLogs: {
        where: { agentName: "Collections" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  const now = new Date()

  function daysSince(date: Date) {
    return Math.floor((now.getTime() - date.getTime()) / 86_400_000)
  }

  const outstanding = arEvents.filter((e) => e.status !== "POSTED")

  let bucket0_30 = 0
  let bucket31_60 = 0
  let bucket61_90 = 0
  let bucket90plus = 0

  for (const e of outstanding) {
    const days = daysSince(e.createdAt)
    const amt = e.amount ?? 0
    if (days <= 30) bucket0_30 += amt
    else if (days <= 60) bucket31_60 += amt
    else if (days <= 90) bucket61_90 += amt
    else bucket90plus += amt
  }

  const totalOutstanding = outstanding.reduce((s, e) => s + (e.amount ?? 0), 0)

  const overdueEvents = outstanding.filter((e) => {
    const normalised = e.normalisedData as Record<string, unknown>
    if (normalised?.dueDate) return new Date(normalised.dueDate as string) < now
    return daysSince(e.createdAt) > 30
  })

  return {
    arEvents,
    totalOutstanding,
    overdueEvents,
    bucket0_30,
    bucket31_60,
    bucket61_90,
    bucket90plus,
  }
}

function AgingBucket({
  label,
  amount,
  sub,
  cls,
}: {
  label: string
  amount: number
  sub?: string
  cls?: string
}) {
  return (
    <div className={`rounded-xl border p-5 space-y-1 bg-card ${cls ?? ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{formatCurrency(amount)}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

export default async function CollectionsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  const data = await getCollectionsData(session.user.organizationId)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Collections</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Accounts receivable aging and AI-assisted collections follow-up.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AgingBucket
          label="Total Outstanding"
          amount={data.totalOutstanding}
          sub={`${data.overdueEvents.length} overdue`}
        />
        <AgingBucket
          label="Current (0-30 days)"
          amount={data.bucket0_30}
          cls="border-emerald-200 dark:border-emerald-900/40"
        />
        <AgingBucket
          label="30-60 Days"
          amount={data.bucket31_60}
          cls="border-orange-200 dark:border-orange-900/40"
        />
        <AgingBucket
          label="60+ Days"
          amount={data.bucket61_90 + data.bucket90plus}
          sub={data.bucket90plus > 0 ? `${formatCurrency(data.bucket90plus)} over 90 days` : undefined}
          cls="border-red-300 dark:border-red-800/40"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between p-5 border-b">
          <h3 className="font-semibold">Receivables Activity</h3>
          <span className="text-xs text-muted-foreground">{data.arEvents.length} events</span>
        </div>
        <div className="divide-y">
          {data.arEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <Users className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No receivables data yet. Connect Stripe or Chargebee to populate.
              </p>
            </div>
          ) : (
            data.arEvents.map((event) => {
              const normalised = event.normalisedData as Record<string, unknown>
              const aiLog = event.aiDecisionLogs[0]
              const daysPast = Math.floor(
                (new Date().getTime() - event.createdAt.getTime()) / 86_400_000
              )
              return (
                <div
                  key={event.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {event.source.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {(normalised?.customerName as string) ?? event.eventType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.source} · {formatRelative(event.createdAt)}
                        {normalised?.dueDate ? (
                          <> · Due {new Date(normalised.dueDate as string).toLocaleDateString()}</>
                        ) : null}
                        {event.status !== "POSTED" && daysPast > 30 && (
                          <span className={`ml-1 ${daysPast > 60 ? "text-red-500" : "text-orange-500"}`}>
                            · {daysPast}d outstanding
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {aiLog?.reasoning ? (
                      <p className="text-xs text-muted-foreground max-w-[180px] truncate hidden sm:block">
                        {aiLog.reasoning}
                      </p>
                    ) : null}
                    {event.amount != null && (
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(event.amount, event.currency)}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/10 p-5 flex items-start gap-3">
        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <strong>AI Collections agent</strong> - Connect your billing platform (Stripe, Chargebee) to enable
          automated follow-up drafts, aging analysis, and escalation recommendations.
        </div>
      </div>
    </div>
  )
}
