"use client"

import { useState } from "react"
import { Link2, Cpu, RefreshCw, BarChart3, FileText, ShieldCheck, CheckCircle2, ChevronRight } from "lucide-react"

const pillars = [
  {
    id: "connect",
    label: "Connect",
    tagline: "50+ live data sources",
    icon: Link2,
    color: "text-violet-600",
    activeBg: "bg-violet-50 border-violet-200",
    dot: "bg-violet-500",
    title: "Universal Financial Data Ingestion",
    description:
      "Every financial system your company uses flows into one normalised event stream — in real-time via webhooks, not end-of-month CSV uploads. Source doesn't matter: Stripe, Mercury, Ramp, or any accounting system.",
    points: [
      "Stripe, QuickBooks, Mercury, Ramp — live on Day 1",
      "Chargebee, Rippling, Salesforce, HubSpot — Tier 2",
      "Real-time webhooks + full historical backfill",
      "Application-agnostic: swap providers without rebuilding",
    ],
    snippet: `{
  "eventType": "PAYMENT_RECEIVED",
  "source":    "stripe",
  "amount":    10000,
  "currency":  "USD",
  "entityType": "revenue",
  "glAccount": "4000 · SaaS Revenue"
}`,
  },
  {
    id: "architect",
    label: "Architect",
    tagline: "AI-designed financial blueprint",
    icon: Cpu,
    color: "text-blue-600",
    activeBg: "bg-blue-50 border-blue-200",
    dot: "bg-blue-500",
    title: "AI Designs Your Financial Blueprint",
    description:
      "Before a single transaction flows, Ryzha's Architect Agent interviews you — learning your business model, billing structure, entities and board metrics — then auto-generates your entire financial architecture.",
    points: [
      "Business model intake: SaaS, marketplace, usage-based, hybrid",
      "ASC 606 / IFRS 15 revenue recognition policy per contract",
      "Chart of Accounts tailored to your stage and model",
      "Auto-evolves when you open a new entity or product line",
    ],
    snippet: `Architecture generated:
  businessModel:  "saas"
  billingModel:   "annual"
  recognition:    "ratable / 12 months"
  departments:    ["Eng", "Sales", "G&A"]
  entities:       1 (USD)
  boardMetrics:   ARR, NRR, BurnMultiple`,
  },
  {
    id: "reconcile",
    label: "Reconcile",
    tagline: "Every 15 minutes, continuously",
    icon: RefreshCw,
    color: "text-teal-600",
    activeBg: "bg-teal-50 border-teal-200",
    dot: "bg-teal-500",
    title: "Continuous Cross-System Reconciliation",
    description:
      "Ryzha's agents run every 15 minutes — matching Stripe payments against QuickBooks AR, bank feeds against card transactions, payroll runs against department budgets. Auto-resolve where possible, surface exceptions where judgment is needed.",
    points: [
      "Revenue, Cash, AP, Payroll, Pipeline, Commission agents",
      "Auto-resolves timing differences and recognised vs deferred splits",
      "3-way match for AP: PO → bill → payment",
      "Anomaly detection flags outliers across all connected platforms",
    ],
    snippet: `Stripe $10,000 → reconciliation run:
  ✓ Revenue Agent:  AR entry posted (ASC 606)
  ✓ Cash Agent:     Mercury match confirmed T+1
  ✓ Pipeline Agent: Salesforce deal matched
  ✓ Commission:     $800 accrual posted
  ─ 0 exceptions flagged`,
  },
  {
    id: "report",
    label: "Report",
    tagline: "Real-time for every stakeholder",
    icon: BarChart3,
    color: "text-orange-600",
    activeBg: "bg-orange-50 border-orange-200",
    dot: "bg-orange-500",
    title: "Real-Time Financial Intelligence",
    description:
      "Every stakeholder gets their own live view — calculated from the Unified Financial Event Stream, not from a QuickBooks export. The FP&A Agent drafts board deck commentary automatically every month-end.",
    points: [
      "MRR/ARR movement table: new, expansion, contraction, churn",
      "Net Revenue Retention, Burn Multiple, Magic Number, Rule of 40",
      "AI board narrative — explains every variance in plain English",
      "13-week rolling cash forecast refreshed daily",
    ],
    snippet: `Board metrics · live:
  MRR:        $142,000  ↑ 8.4%
  ARR:      $1,704,000
  NRR:           112%
  Burn:         $94K/mo
  Runway:       18 months`,
  },
  {
    id: "close",
    label: "Close",
    tagline: "2 hours, not 3 weeks",
    icon: FileText,
    color: "text-emerald-600",
    activeBg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
    title: "Month-End Close in Hours, Not Weeks",
    description:
      "Since reconciliation runs continuously, month-end is nearly complete before Day 1 arrives. The Close Agent auto-generates prepayments, accruals, depreciation, FX revaluation — then surfaces only the exceptions that need human judgment.",
    points: [
      "Bank, AR, AP, Payroll reconciliation — continuous, not monthly",
      "Auto-generates prepayments, accruals, depreciation, FX entries",
      "Flux analysis explains every P&L variance vs prior month",
      "Total human time required: ~2 hours",
    ],
    snippet: `Close Agent · Day 1 of month:
  ✓ Revenue reconciliation   (continuous)
  ✓ Cash reconciliation      (continuous)
  ✓ AP reconciliation        (continuous)
  ✓ Prepayment amortisation  (auto)
  ✓ FX revaluation           (auto)
  ⚠ 2 GL coding decisions    (human)
  Total: ~2 hours`,
  },
  {
    id: "audit",
    label: "Audit Trail",
    tagline: "Immutable · AI-rationale attached",
    icon: ShieldCheck,
    color: "text-slate-600",
    activeBg: "bg-slate-50 border-slate-200",
    dot: "bg-slate-500",
    title: "Audit-Grade Immutable Decision Trail",
    description:
      "Every automated decision is logged with full AI rationale. Every journal entry carries a provenance chain back to the originating financial event. Auditors get a dedicated read-only view with confidence scores per decision.",
    points: [
      "Immutable decision log per transaction — cannot be edited",
      "AI reasoning attached to every automated journal entry",
      "Confidence score and input/output data per agent decision",
      "Auditor-facing view: read-only, filterable by agent and date",
    ],
    snippet: `AIDecisionLog:
  agent:       Revenue
  decision:    REV_REC
  confidence:  95%
  reasoning:   "Ratable ASC 606 over 12
                months. Recognised $833,
                deferred $9,167."
  linkedEvent: evt_abc123`,
  },
]

export function PillarsTabs() {
  const [active, setActive] = useState(0)
  const pillar = pillars[active]

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-8 items-start">
      <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {pillars.map((p, i) => {
          const Icon = p.icon
          const isActive = active === i
          return (
            <button
              key={p.id}
              onClick={() => setActive(i)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-200 shrink-0 lg:shrink w-full ${
                isActive
                  ? `${p.activeBg} shadow-sm`
                  : "border-transparent hover:bg-gray-50 hover:border-gray-100"
              }`}
            >
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${isActive ? "bg-white shadow-sm" : "bg-gray-100"}`}>
                <Icon className={`h-3.5 w-3.5 ${isActive ? p.color : "text-gray-400"}`} />
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${isActive ? "text-gray-900" : "text-gray-500"}`}>
                  {p.label}
                </p>
                <p className={`text-[11px] truncate hidden lg:block ${isActive ? "text-gray-500" : "text-gray-400"}`}>
                  {p.tagline}
                </p>
              </div>
              {isActive && <ChevronRight className={`h-3.5 w-3.5 ml-auto shrink-0 hidden lg:block ${p.color}`} />}
            </button>
          )
        })}
      </nav>

      <div className="rounded-2xl border bg-white p-7 lg:p-8 min-h-[380px] animate-slide-right">
        <div className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 ${pillar.activeBg} ${pillar.color}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${pillar.dot}`} />
          {pillar.label}
        </div>

        <div className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <h3 className="text-xl font-display font-700 text-gray-900 mb-3 text-balance">{pillar.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed mb-5">{pillar.description}</p>
            <ul className="space-y-2.5">
              {pillar.points.map((pt) => (
                <li key={pt} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {pt}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden md:block shrink-0 w-[220px] min-w-0">
            <div className="rounded-xl border border-gray-100 bg-gray-950 text-gray-300 p-4 code-block">
              {pillar.snippet}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
