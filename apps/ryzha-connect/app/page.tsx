import { getSession } from "@/lib/session"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = "force-dynamic"

import { PillarsTabs } from "@/components/marketing/pillars-tabs"
import {
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
} from "lucide-react"

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect("/overview")

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
              <span className="font-display font-bold text-primary-foreground text-[12px] tracking-tight">R</span>
            </div>
            <span className="font-display font-semibold text-[16px] tracking-tight">ryzha</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#product" className="hover:text-gray-900 transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/onboarding"
              className="text-sm font-medium bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shadow-sm shadow-primary/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="pt-28 pb-20 px-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-700 mb-8">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              AI-native financial infrastructure for hyper-growth startups
            </div>

            <h1 className="font-display text-5xl md:text-[3.75rem] font-bold tracking-tight text-gray-900 leading-[1.05] mb-6">
              Your startup&apos;s<br />
              <span className="text-primary">financial OS</span>,<br />
              maintained by AI
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Connect Stripe, QuickBooks, Mercury, Ramp and 50+ tools. Ryzha reconciles continuously, closes the books in hours, and gives every stakeholder real-time financial intelligence.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
              <Link
                href="/onboarding"
                className="flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
              >
                Start free — connect in 5 minutes
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors py-3"
              >
                See how it works →
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-5 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No CSV imports</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> SOC 2 compliant</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-xl shadow-gray-200/60">
              <div className="flex items-center gap-2 mb-5">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-gray-400 font-mono">reconciliation · live</span>
              </div>
              <div className="space-y-3 font-mono text-sm">
                {[
                  { label: "Stripe $10,000", status: "PAYMENT_RECEIVED", dot: "bg-blue-400" },
                  { label: "Revenue Agent", status: "AR posted → ASC 606", dot: "bg-emerald-400" },
                  { label: "Cash Agent", status: "Mercury match T+1 ✓", dot: "bg-emerald-400" },
                  { label: "Pipeline Agent", status: "Salesforce deal matched ✓", dot: "bg-emerald-400" },
                  { label: "Commission Agent", status: "$800 accrual posted ✓", dot: "bg-emerald-400" },
                  { label: "Exceptions", status: "0 flagged", dot: "bg-gray-300" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-4 py-2.5 border border-gray-100">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${row.dot}`} />
                      <span className="text-xs text-gray-700 font-semibold truncate">{row.label}</span>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 ml-3">{row.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Agents running · last sync 30s ago
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 px-6 border-y border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-8">
            Built for companies running
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {[
              { name: "Stripe", abbr: "S", bg: "bg-violet-500" },
              { name: "QuickBooks", abbr: "QB", bg: "bg-green-600" },
              { name: "Mercury", abbr: "M", bg: "bg-teal-600" },
              { name: "Ramp", abbr: "R", bg: "bg-gray-800" },
              { name: "Gusto", abbr: "G", bg: "bg-pink-500" },
              { name: "Chargebee", abbr: "CB", bg: "bg-orange-500" },
              { name: "Rippling", abbr: "RP", bg: "bg-amber-600" },
              { name: "Salesforce", abbr: "SF", bg: "bg-blue-600" },
            ].map((tool) => (
              <div key={tool.name} className="flex items-center gap-2.5 opacity-60 hover:opacity-100 transition-opacity">
                <div className={`h-7 w-7 rounded-md ${tool.bg} flex items-center justify-center`}>
                  <span className="text-white font-bold text-[10px]">{tool.abbr}</span>
                </div>
                <span className="text-sm text-gray-600 font-medium">{tool.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">The Problem</p>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
                Your finance team is drowning in CSVs
              </h2>
            </div>
            <div className="flex items-end">
              <p className="text-gray-500 leading-relaxed">
                A Series A startup runs 15–25 disconnected financial tools. None of them share a data model. Every month is a manual reconciliation war fought in spreadsheets.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-8">
              <p className="text-sm font-semibold text-red-600 mb-5 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Without Ryzha — every month
              </p>
              <ul className="space-y-3">
                {[
                  "Week 1: Download 15 CSVs and import into Excel",
                  "Week 2: Manual reconciliation, chase missing data",
                  "Week 3: Fix errors, post journal entries by hand",
                  "Week 4: Present 30-day-old numbers to the board",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-red-700">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-red-100/60 px-4 py-2.5 text-xs text-red-600 font-medium">
                3-week close · stale board data · finance team burnout
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-8">
              <p className="text-sm font-semibold text-emerald-700 mb-5 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                With Ryzha — every month
              </p>
              <ul className="space-y-3">
                {[
                  "Continuous reconciliation runs every 15 minutes",
                  "Revenue, cash, payroll reconciled automatically",
                  "Month-end close takes 2 hours, not 3 weeks",
                  "Board gets real-time numbers, not last month's",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 text-emerald-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 rounded-xl bg-emerald-100/60 px-4 py-2.5 text-xs text-emerald-700 font-medium">
                2-hour close · real-time board data · finance team on strategy
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="py-24 px-6 bg-gray-50 border-y border-gray-100">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">The Platform</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Five pillars. One coherent financial OS.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Each pillar is powered by AI agents that run autonomously — continuously reconciling, reporting, and evolving your financial architecture.
            </p>
          </div>
          <PillarsTabs />
        </div>
      </section>

      <section id="how-it-works" className="py-24 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">How It Works</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              A Stripe payment, fully resolved in seconds
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Every financial event flows through Ryzha&apos;s agent stack automatically — no human touch until an exception needs judgment.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                step: "01",
                label: "Connect Agent",
                action: "Stripe payment received: $10,000",
                detail: "Normalised into a Financial Event: PAYMENT_RECEIVED · customer · currency · contract ID",
                accent: "border-l-violet-400 bg-violet-50/50",
                tag: "bg-violet-100 text-violet-700",
              },
              {
                step: "02",
                label: "Architect Agent",
                action: "Looks up ASC 606 policy for this contract",
                detail: "Annual SaaS · 12-month term → ratable recognition: $833/mo recognised, $9,167 deferred",
                accent: "border-l-blue-400 bg-blue-50/50",
                tag: "bg-blue-100 text-blue-700",
              },
              {
                step: "03",
                label: "Revenue Agent",
                action: "Posts journal entries to QuickBooks",
                detail: "DR Cash $10,000 · CR Deferred Revenue $9,167 · CR SaaS Revenue $833",
                accent: "border-l-teal-400 bg-teal-50/50",
                tag: "bg-teal-100 text-teal-700",
              },
              {
                step: "04",
                label: "Cash Agent",
                action: "Verifies payment appears in Mercury bank feed",
                detail: "T+1 match confirmed · QB cash account updated · no exception",
                accent: "border-l-emerald-400 bg-emerald-50/50",
                tag: "bg-emerald-100 text-emerald-700",
              },
              {
                step: "05",
                label: "Report Layer",
                action: "Dashboard updated in real-time",
                detail: "MRR +$833 · ARR +$10,000 · Deferred Revenue +$9,167 · Cash +$10,000",
                accent: "border-l-orange-400 bg-orange-50/50",
                tag: "bg-orange-100 text-orange-700",
              },
            ].map(({ step, label, action, detail, accent, tag }) => (
              <div key={step} className={`rounded-xl border-l-4 ${accent} border border-gray-100 px-6 py-5 flex items-start gap-5`}>
                <span className="font-mono text-xs font-bold text-gray-300 shrink-0 mt-0.5 w-6">{step}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${tag}`}>{label}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">{action}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 px-6 border-y border-gray-100">
        <div className="mx-auto max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { stat: "2 hrs", label: "Average month-end close", sub: "down from 3 weeks" },
            { stat: "15 min", label: "Reconciliation cycle", sub: "continuous, not monthly" },
            { stat: "50+", label: "Native connectors", sub: "webhooks, not CSV" },
            { stat: "Real-time", label: "Board-ready metrics", sub: "not last month's" },
          ].map(({ stat, label, sub }) => (
            <div key={label} className="space-y-1">
              <p className="font-display text-3xl font-bold text-primary">{stat}</p>
              <p className="text-sm font-semibold text-gray-800">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">Pricing</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Grows with your company, not your headcount
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Stage-based pricing tied to company complexity — not per seat.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                tier: "Seed",
                stage: "Pre-seed · Seed",
                price: "$299",
                description: "The right financial architecture from day one. Avoid building financial tech debt before it starts.",
                highlight: false,
                features: [
                  "Connect up to 5 sources",
                  "Revenue + Cash reconciliation",
                  "Real-time P&L dashboard",
                  "Basic SaaS metrics (MRR, ARR, churn)",
                  "Architect Agent onboarding",
                  "ASC 606 revenue recognition",
                ],
                cta: "Start with Seed",
              },
              {
                tier: "Series A",
                stage: "Series A",
                price: "$999",
                description: "Real-time reporting, automated close, clean reconciled books for a fast-moving company.",
                highlight: true,
                features: [
                  "Connect up to 15 sources",
                  "Full reconciliation suite — Revenue, Cash, AP, Payroll, Pipeline",
                  "All SaaS metrics + cohort analysis",
                  "Close automation — hours not weeks",
                  "Board report drafts",
                  "Anomaly detection",
                  "Approval workflows",
                ],
                cta: "Start with Series A",
              },
              {
                tier: "Series B",
                stage: "Series B+",
                price: "$2,999",
                description: "Full cross-platform reconciliation, multi-entity, departmental P&L, and audit-grade data.",
                highlight: false,
                features: [
                  "Unlimited connectors",
                  "Multi-entity + FX reconciliation",
                  "Department-level P&L",
                  "Intercompany eliminations",
                  "Audit trail with AI rationale",
                  "Full Architect Agent",
                  "SOC 2 Type II",
                  "Budget vs actuals tracking",
                ],
                cta: "Start with Series B",
              },
            ].map(({ tier, stage, price, description, highlight, features, cta }) => (
              <div
                key={tier}
                className={`relative rounded-2xl flex flex-col ${
                  highlight
                    ? "bg-primary text-white shadow-2xl shadow-primary/20 border border-primary"
                    : "bg-white border border-gray-200"
                }`}
              >
                {highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-primary text-[11px] font-bold px-4 py-1.5 rounded-full border border-primary/20 shadow-sm whitespace-nowrap">
                    Most Popular
                  </div>
                )}
                <div className="p-8 flex-1 flex flex-col">
                  <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${highlight ? "text-blue-200" : "text-gray-400"}`}>
                    {stage}
                  </p>
                  <p className={`font-display text-xl font-bold mb-1 ${highlight ? "text-white" : "text-gray-900"}`}>{tier}</p>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className={`font-display text-4xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{price}</span>
                    <span className={`text-sm ${highlight ? "text-blue-200" : "text-gray-400"}`}>/month</span>
                  </div>
                  <p className={`text-sm leading-relaxed mb-6 ${highlight ? "text-blue-100" : "text-gray-500"}`}>
                    {description}
                  </p>
                  <ul className="space-y-2.5 flex-1 mb-8">
                    {features.map((f) => (
                      <li key={f} className={`flex items-start gap-2.5 text-xs ${highlight ? "text-blue-100" : "text-gray-600"}`}>
                        <CheckCircle2 className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${highlight ? "text-blue-300" : "text-emerald-500"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/onboarding"
                    className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      highlight
                        ? "bg-white text-primary hover:bg-blue-50"
                        : "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20"
                    }`}
                  >
                    {cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Pre-IPO or public company?{" "}
            <a href="mailto:founders@ryzha.com" className="text-primary font-medium hover:underline">
              Talk to us about Scale →
            </a>
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-4xl text-center">
          <div className="rounded-3xl bg-primary px-10 py-16 shadow-2xl shadow-primary/20">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-medium text-blue-100 mb-8">
              <TrendingUp className="h-3.5 w-3.5" />
              The ideal first customer: a Series A SaaS company on Stripe + QuickBooks
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-5">
              Connect Stripe and QuickBooks in 5 minutes.<br />
              Close the books this month in 2 hours.
            </h2>
            <p className="text-blue-100 text-base mb-10 max-w-xl mx-auto leading-relaxed">
              Revenue reconciliation from Stripe → ASC 606 → QuickBooks is the single most painful, manual task in startup finance. Ryzha automates it completely.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/onboarding"
                className="flex items-center gap-2 bg-white text-primary font-bold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all text-sm shadow-lg"
              >
                Get started free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <Clock className="h-4 w-4" />
                <span>5-minute setup · no credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-12 px-6 bg-white">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-primary-foreground text-[11px]">R</span>
            </div>
            <span className="font-display font-semibold text-[15px] tracking-tight">ryzha</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-gray-400">
            <a href="mailto:founders@ryzha.com" className="hover:text-gray-700 transition-colors">Contact</a>
            <a href="/login" className="hover:text-gray-700 transition-colors">Sign in</a>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Ryzha. Financial architecture for hyper-growth.
          </p>
        </div>
      </footer>
    </div>
  )
}
