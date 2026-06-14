/* eslint-disable @next/next/no-img-element */
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
  Sparkles,
  Zap,
} from "lucide-react"

const LIVE_INTEGRATIONS = [
  { name: "Stripe", logoUrl: "https://cdn.simpleicons.org/stripe/635BFF", bg: "#f5f3ff" },
  { name: "QuickBooks", logoUrl: "https://cdn.simpleicons.org/quickbooks/2CA01C", bg: "#f0fdf4" },
  { name: "Mercury", logoUrl: "https://logo.clearbit.com/mercury.com", bg: "#f0fdfa" },
  { name: "Ramp", logoUrl: "https://logo.clearbit.com/ramp.com", bg: "#f8fafc" },
  { name: "Gusto", logoUrl: "https://cdn.simpleicons.org/gusto/F45D48", bg: "#fff1f2" },
  { name: "Chargebee", logoUrl: "https://cdn.simpleicons.org/chargebee/FF6200", bg: "#fff7ed" },
  { name: "HubSpot", logoUrl: "https://cdn.simpleicons.org/hubspot/FF7A59", bg: "#fff7ed" },
]

const COMING_SOON = [
  { name: "Xero", logoUrl: "https://cdn.simpleicons.org/xero/13B5EA", bg: "#eff6ff" },
  { name: "Salesforce", logoUrl: "https://cdn.simpleicons.org/salesforce/00A1E0", bg: "#eff6ff" },
  { name: "Rippling", abbr: "RP", bg: "#fefce8", color: "#854d0e" },
  { name: "NetSuite", abbr: "NS", bg: "#fef2f2", color: "#991b1b" },
  { name: "Paddle", logoUrl: "https://cdn.simpleicons.org/paddle/000000", bg: "#f8fafc" },
  { name: "Deel", abbr: "DE", bg: "#f0fdf4", color: "#166534" },
  { name: "Zuora", abbr: "ZU", bg: "#faf5ff", color: "#6b21a8" },
]

function LogoChip({ name, logoUrl, abbr, bg, color, faded }: {
  name: string
  logoUrl?: string
  abbr?: string
  bg: string
  color?: string
  faded?: boolean
}) {
  return (
    <div
      className={`flex items-center gap-3.5 rounded-xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm whitespace-nowrap shrink-0 transition-opacity ${faded ? "opacity-40 grayscale" : "opacity-90 hover:opacity-100"}`}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
        style={{ background: bg }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={name} className="h-5 w-5 object-contain" />
        ) : (
          <span className="text-[11px] font-extrabold" style={{ color }}>{abbr}</span>
        )}
      </div>
      <span className="text-sm font-semibold text-gray-700">{name}</span>
    </div>
  )
}

export default async function RootPage() {
  const session = await getSession()
  if (session) redirect("/overview")

  const liveDouble = [...LIVE_INTEGRATIONS, ...LIVE_INTEGRATIONS]
  const soonDouble = [...COMING_SOON, ...COMING_SOON]

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Ryzha" className="h-8 w-8 object-contain" />
            <span className="font-display font-semibold text-[16px] tracking-tight">ryzha</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-500">
            <a href="#product" className="hover:text-gray-900 transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-gray-900 transition-colors">How it works</a>
            <a href="#founders" className="hover:text-gray-900 transition-colors">About</a>
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

      {/* ── Hero ── */}
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

      {/* ── Integrations marquee ── */}
      <section className="py-14 border-y border-gray-100 bg-gray-50/60 overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 mb-7">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400">Already integrated</p>
              <p className="text-lg font-bold text-gray-900 mt-0.5">Connect your stack in minutes</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 border border-gray-200 bg-white rounded-full px-4 py-1.5">
              <Zap className="h-3 w-3 text-amber-500" />
              50+ connectors in roadmap
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-gray-50/80 to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-gray-50/80 to-transparent z-10 pointer-events-none" />

          <div className="flex animate-marquee gap-8 mb-4" style={{ width: "max-content" }}>
            {liveDouble.map((app, i) => (
              <LogoChip key={i} {...app} />
            ))}
          </div>

          <div className="flex gap-8" style={{ width: "max-content" }}>
            <div className="animate-marquee-reverse flex gap-8" style={{ width: "max-content" }}>
              {soonDouble.map((app, i) => (
                <LogoChip key={i} {...app} faded />
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 mt-6 flex items-center gap-6 text-xs text-gray-400">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Live integrations
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
            Coming soon
          </span>
        </div>
      </section>

      {/* ── Problem: drowning in CSVs ── */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">The Problem</p>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
              Your finance team&apos;s month.<br />Every month.
            </h2>
            <p className="text-gray-500 leading-relaxed">
              A Series A startup runs 15–25 disconnected financial tools. None share a data model. Every month-end is a manual war fought in spreadsheets — while the business moves at startup speed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-red-100 bg-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-[6rem]" />
              <p className="text-sm font-semibold text-red-500 mb-6 flex items-center gap-2 relative">
                <AlertCircle className="h-4 w-4" />
                Without Ryzha — every month
              </p>
              <div className="space-y-0 relative">
                {[
                  { week: "Week 1", task: "Download 15 CSVs, paste into Excel" },
                  { week: "Week 2", task: "Manual reconciliation, chase missing data" },
                  { week: "Week 3", task: "Fix errors, post journal entries by hand" },
                  { week: "Week 4", task: "Present 30-day-old numbers to the board" },
                ].map(({ week, task }, i) => (
                  <div key={i} className="flex gap-4 pb-5 last:pb-0 relative">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-7 w-7 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center z-10">
                        <span className="text-[9px] font-bold text-red-500">{i + 1}</span>
                      </div>
                      {i < 3 && <div className="w-px flex-1 bg-red-100 mt-1" />}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-0.5">{week}</p>
                      <p className="text-sm text-gray-700">{task}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-xs text-red-600 font-semibold flex items-center gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                3-week close · stale board data · finance team burnout
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[6rem]" />
              <p className="text-sm font-semibold text-emerald-600 mb-6 flex items-center gap-2 relative">
                <CheckCircle2 className="h-4 w-4" />
                With Ryzha — every month
              </p>
              <div className="space-y-0 relative">
                {[
                  { moment: "Always on", task: "Agents reconcile every 15 minutes, continuously" },
                  { moment: "Event-driven", task: "Revenue, cash, payroll reconciled the moment they happen" },
                  { moment: "Day 1 of close", task: "90% of checklist already done — agents ran it live" },
                  { moment: "Board day", task: "Real-time numbers, not last month's — ready in 2 hours" },
                ].map(({ moment, task }, i) => (
                  <div key={i} className="flex gap-4 pb-5 last:pb-0 relative">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="h-7 w-7 rounded-full bg-emerald-100 border-2 border-emerald-200 flex items-center justify-center z-10">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      </div>
                      {i < 3 && <div className="w-px flex-1 bg-emerald-100 mt-1" />}
                    </div>
                    <div className="pt-0.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-0.5">{moment}</p>
                      <p className="text-sm text-gray-700">{task}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                2-hour close · real-time board data · finance team on strategy
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Product pillars ── */}
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

      {/* ── How it works ── */}
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

      {/* ── Stats ── */}
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
              <p className="text-sm font-semibold text-gray-700">{label}</p>
              <p className="text-xs text-gray-400">{sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Founders ── */}
      <section id="founders" className="py-24 px-6 bg-gray-50 border-t border-gray-100">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              The founders
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Built by founders,<br />for founders.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Ryzha was born from a simple frustration — founders spending too many hours on accounting instead of building their companies. A two-person team with a clear belief: financial intelligence should be accessible to every founder.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto mb-14">
            {[
              {
                name: "Karina Rocha",
                role: "CEO & Founder",
                initials: "KR",
                gradientFrom: "#7c3aed",
                gradientTo: "#3b82f6",
                bio: "The visionary behind Ryzha. Karina combines deep industry knowledge with a clear vision for the future of financial intelligence for startups. She drives the product strategy, customer insight, and the core belief that founders deserve better financial tooling.",
              },
              {
                name: "Sushmit Ghosh",
                role: "CTO & Lead Engineer",
                initials: "SG",
                gradientFrom: "#3b82f6",
                gradientTo: "#0ea5e9",
                bio: "The technical powerhouse making Ryzha a reality. Sushmit architects and builds the AI-driven systems, workflow orchestrators, and integrations that give Ryzha its capabilities. He turns Karina's vision into production-grade software.",
              },
            ].map(({ name, role, initials, gradientFrom, gradientTo, bio }) => (
              <div key={name} className="flex flex-col gap-6 p-8 rounded-2xl border border-gray-200 bg-white hover:border-primary/30 hover:shadow-xl transition-all duration-200">
                <div className="flex items-center gap-5">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})` }}
                  >
                    <span className="text-white text-xl font-black">{initials}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{name}</h3>
                    <span className="inline-flex items-center text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full mt-1">
                      {role}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{bio}</p>
              </div>
            ))}
          </div>

          {/* ── Get in touch ── */}
          <div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Want to talk to us directly?</h3>
            <p className="text-gray-500 mb-6 leading-relaxed">
              We read every message. If you have questions, feedback, or just want to say hello — reach out. We&apos;re building Ryzha in the open and love talking to founders.
            </p>
            <a
              href="mailto:founders@ryzha.com"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 text-sm"
            >
              Get in touch →
            </a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-white border-t border-gray-100">
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
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Ryzha" className="h-7 w-7 object-contain" />
            <span className="font-display font-semibold text-[15px] tracking-tight">ryzha</span>
          </div>
          <div className="flex items-center gap-8 text-xs text-gray-400">
            <a href="#product" className="hover:text-gray-700 transition-colors">Product</a>
            <a href="#founders" className="hover:text-gray-700 transition-colors">About</a>
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
