"use client"

import * as React from "react"
import { toast } from "sonner"
import { formatCurrency, formatRelative } from "@/lib/utils"
import { CheckCircle2, XCircle, Clock, UserCheck, Loader2 } from "lucide-react"

interface FinancialEvent {
  id: string
  eventType: string
  source: string
  externalId: string
  amount: number | null
  currency: string
  createdAt: string
}

interface Approval {
  id: string
  status: string
  requestedBy: string
  requestedAt: string
  decidedAt: string | null
  dueDate: string | null
  financialEvent: FinancialEvent
}

function DueDateLabel({ date }: { date: string | null }) {
  if (!date) return <span className="text-xs text-muted-foreground">No due date</span>
  const now = new Date()
  const diff = new Date(date).getTime() - now.getTime()
  const days = Math.ceil(diff / 86_400_000)
  const cls =
    days < 0
      ? "text-red-500"
      : days === 0
      ? "text-orange-500"
      : days <= 2
      ? "text-yellow-600"
      : "text-muted-foreground"
  return (
    <span className={`text-xs ${cls} flex items-center gap-1`}>
      <Clock className="h-3 w-3" />
      {days < 0
        ? `${Math.abs(days)}d overdue`
        : days === 0
        ? "Due today"
        : `Due in ${days}d`}
    </span>
  )
}

function ApprovalCard({
  approval,
  onDecision,
}: {
  approval: Approval
  onDecision: (id: string, action: "approve" | "reject") => void
}) {
  const [loading, setLoading] = React.useState<"approve" | "reject" | null>(null)
  const event = approval.financialEvent

  async function handleAction(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch(`/api/approvals/${approval.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        onDecision(approval.id, action)
        toast.success(action === "approve" ? "Approved and pushed to books" : "Rejected successfully")
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? `Failed to ${action}`)
      }
    } catch {
      toast.error(`Network error - could not ${action}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="rounded-xl border bg-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold">
            {event.eventType.replace(/_/g, " ")}
          </span>
          <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono uppercase">
            {event.source}
          </span>
          <DueDateLabel date={approval.dueDate} />
        </div>
        <p className="text-xs text-muted-foreground font-mono">{event.externalId}</p>
        {event.amount != null && (
          <p className="text-lg font-bold tabular-nums">
            {formatCurrency(event.amount, event.currency)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Requested by {approval.requestedBy} · {formatRelative(new Date(approval.requestedAt))}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          disabled={loading !== null}
          onClick={() => handleAction("reject")}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "reject" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Reject
        </button>
        <button
          disabled={loading !== null}
          onClick={() => handleAction("approve")}
          className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === "approve" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Approve
        </button>
      </div>
    </div>
  )
}

export default function ApprovalsPage() {
  const [pending, setPending] = React.useState<Approval[]>([])
  const [recent, setRecent] = React.useState<Approval[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/approvals")
      .then((r) => r.json())
      .then((data) => {
        setPending(data.pending ?? [])
        setRecent(data.recent ?? [])
      })
      .catch(() => setError("Failed to load approvals"))
      .finally(() => setLoading(false))
  }, [])

  function handleDecision(id: string, action: "approve" | "reject") {
    const approval = pending.find((a) => a.id === id)
    if (!approval) return
    setPending((prev) => prev.filter((a) => a.id !== id))
    setRecent((prev) => [
      {
        ...approval,
        status: action === "approve" ? "APPROVED" : "REJECTED",
        decidedAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 20))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-sm text-destructive">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Approvals</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Financial events flagged by AI agents that require human authorisation before posting.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 gap-3 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="font-semibold">All caught up</p>
          <p className="text-sm text-muted-foreground">No pending approvals at this time.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Pending ({pending.length})</h3>
          </div>
          <div className="space-y-3">
            {pending.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onDecision={handleDecision}
              />
            ))}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-muted-foreground" />
            Recent Decisions
          </h3>
          <div className="rounded-xl border bg-card divide-y overflow-hidden">
            {recent.map((approval) => {
              const event = approval.financialEvent
              const isApproved = approval.status === "APPROVED"
              return (
                <div
                  key={approval.id}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                        isApproved
                          ? "bg-emerald-100 dark:bg-emerald-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {isApproved ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {event.eventType.replace(/_/g, " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {event.source} · {approval.decidedAt ? formatRelative(new Date(approval.decidedAt)) : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {event.amount != null && (
                      <span className="text-sm font-medium tabular-nums">
                        {formatCurrency(event.amount, event.currency)}
                      </span>
                    )}
                    <span
                      className={`text-xs font-medium ${
                        isApproved ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {approval.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
