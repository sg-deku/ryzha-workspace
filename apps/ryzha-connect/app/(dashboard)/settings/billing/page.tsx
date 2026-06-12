"use client"

import * as React from "react"
import { CheckCircle2, Loader2, AlertCircle, CreditCard, Zap, Building2, ArrowRight, ExternalLink } from "lucide-react"
import { useSearchParams } from "next/navigation"

interface BillingStatus {
  plan: "FREE" | "PRO" | "SCALE"
  limits: { agents: number; connections: number; users: number }
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  subscriptionStatus: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

const PLANS = [
  {
    id: "FREE",
    name: "Seed",
    price: "$0",
    period: "",
    description: "Get started with the basics",
    features: [
      "3 connected platforms",
      "3 reconciliation agents",
      "2 team members",
      "30-day data history",
      "Monthly close checklist",
    ],
    cta: "Current plan",
    highlight: false,
  },
  {
    id: "PRO",
    name: "Series A",
    price: "$199",
    period: "/month",
    description: "Full agent suite for growing teams",
    features: [
      "15 connected platforms",
      "All 15 reconciliation agents",
      "10 team members",
      "12-month data history",
      "Real-time reconciliation",
      "SaaS metrics dashboard",
      "AI board narrative",
      "Department P&L",
    ],
    cta: "Upgrade to Series A",
    highlight: true,
  },
  {
    id: "SCALE",
    name: "Series B+",
    price: "$499",
    period: "/month",
    description: "Enterprise-grade for multi-entity orgs",
    features: [
      "Unlimited connections",
      "All agents + custom workflows",
      "Unlimited team members",
      "Full audit history",
      "Multi-entity consolidation",
      "Intercompany eliminations",
      "FX revaluation automation",
      "Priority support",
    ],
    cta: "Upgrade to Series B+",
    highlight: false,
  },
]

function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    FREE:  "bg-muted text-muted-foreground",
    PRO:   "bg-primary/10 text-primary",
    SCALE: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400",
  }
  const labels: Record<string, string> = { FREE: "Seed", PRO: "Series A", SCALE: "Series B+" }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[plan] ?? map.FREE}`}>
      {labels[plan] ?? plan}
    </span>
  )
}

export default function BillingPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = React.useState<BillingStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [upgrading, setUpgrading] = React.useState<string | null>(null)
  const [portalLoading, setPortalLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (searchParams.get("success") === "1") {
      setSuccessMsg("Subscription activated! Your plan has been upgraded.")
    }
    if (searchParams.get("cancelled") === "1") {
      setError("Checkout was cancelled. No changes were made.")
    }
  }, [searchParams])

  React.useEffect(() => {
    fetch("/api/billing/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setError("Failed to load billing status"))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(planId: string) {
    if (planId === "FREE" || planId === status?.plan) return
    setUpgrading(planId)
    setError(null)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Checkout failed")
      window.location.href = json.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUpgrading(null)
    }
  }

  async function handleManageBilling() {
    setPortalLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to open billing portal")
      window.location.href = json.url
    } catch (err: any) {
      setError(err.message)
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const currentPlan = status?.plan ?? "FREE"
  const planIndex = PLANS.findIndex((p) => p.id === currentPlan)

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Billing & Plan</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your Ryzha subscription and usage limits.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMsg}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900/40 p-4">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {status && (
        <div className="rounded-xl border bg-card p-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              {currentPlan === "FREE" && <Zap className="h-5 w-5 text-muted-foreground" />}
              {currentPlan === "PRO" && <Zap className="h-5 w-5 text-primary" />}
              {currentPlan === "SCALE" && <Building2 className="h-5 w-5 text-violet-600" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold">Current plan</p>
                <PlanBadge plan={currentPlan} />
                {status.subscriptionStatus && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.subscriptionStatus === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {status.subscriptionStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                <span>{status.limits.connections} connections</span>
                <span>·</span>
                <span>{status.limits.agents} agents</span>
                <span>·</span>
                <span>{status.limits.users} users</span>
                {status.currentPeriodEnd && (
                  <>
                    <span>·</span>
                    <span>Renews {new Date(status.currentPeriodEnd).toLocaleDateString()}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {status.stripeCustomerId && (
            <button
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted/60 transition-colors disabled:opacity-60 shrink-0"
            >
              {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
              Manage billing
            </button>
          )}
        </div>
      )}

      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">Choose your plan</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const isDowngrade = PLANS.findIndex((p) => p.id === plan.id) < planIndex
            const isPending = upgrading === plan.id

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border p-5 flex flex-col gap-4 transition-all ${
                  plan.highlight
                    ? "border-primary shadow-sm shadow-primary/10"
                    : isCurrent
                    ? "border-primary/30 bg-primary/3"
                    : "hover:border-primary/20"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold shadow-sm">
                      Most popular
                    </span>
                  </div>
                )}

                <div>
                  <p className="font-bold text-base">{plan.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground pb-0.5">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrent || isDowngrade || isPending || !!upgrading}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                    isCurrent
                      ? "bg-muted text-muted-foreground cursor-default"
                      : isDowngrade
                      ? "bg-muted text-muted-foreground cursor-not-allowed"
                      : plan.highlight
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border hover:bg-muted/60"
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Current plan
                    </>
                  ) : isDowngrade ? (
                    "Contact support to downgrade"
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
        <p>All plans include SSL encryption, SOC 2 Type II infrastructure, and 99.9% uptime SLA.</p>
        <p>Billing is processed securely by Stripe. You can cancel or change your plan at any time through the billing portal.</p>
        {!process.env.STRIPE_SECRET_KEY && (
          <p className="text-amber-600 dark:text-amber-400 font-medium mt-2">
            ⚠ Stripe billing is not yet configured. Set STRIPE_SECRET_KEY, STRIPE_PRICE_ID_PRO, and STRIPE_PRICE_ID_SCALE in your environment variables.
          </p>
        )}
      </div>
    </div>
  )
}
