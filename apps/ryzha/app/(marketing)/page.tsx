import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/session"
import {
  ArrowRight, BarChart3, ShieldCheck, Zap, Workflow, MessageSquareText,
  ArrowLeftRight, Tag, FilePenLine, BellRing, CheckCircle2, Sparkles,
  TrendingUp, Smartphone, Bell, LayoutDashboard, Wallet, Bot,
  ChevronRight, Check, X, Minus,
} from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const session = await getSession()

  return (
    <div className="flex flex-col items-center">

      {/* ─── Hero ─── */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="container relative px-4 md:px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Zap className="h-3 w-3" />
                AI-powered financial intelligence
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                  The financial brain
                  <br />
                  <span className="text-primary">for startups</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-[480px] leading-relaxed">
                  Replace your finance team's manual work with AI agents that handle accounting, reconciliation, and runway forecasting — end to end.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                {session ? (
                  <Button size="lg" asChild className="font-semibold">
                    <Link href="/dashboard">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="font-semibold">
                      <Link href="/signup">
                        Start free trial
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="font-semibold">
                      <Link href="/login">Log in</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  "Stripe native",
                  "ASC 606 built in",
                  "SOC 2 ready",
                  "GDPR compliant",
                ].map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: floating metric cards + pipeline */}
            <div className="relative flex flex-col gap-8 justify-center">
              <div className="absolute -inset-8 bg-primary/8 blur-3xl rounded-3xl opacity-60 pointer-events-none" />

              {/* Floating metric cards (Option B) */}
              <div className="relative h-[220px]">
                {/* Card 1 — back-left */}
                <div className="absolute top-0 left-0 w-[180px] -rotate-3 rounded-2xl border bg-card shadow-xl px-4 py-3.5 z-10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Cash Balance</p>
                  <p className="text-xl font-black">$142,500</p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 mt-1">
                    <TrendingUp className="h-3 w-3" /> +12.4% this month
                  </span>
                </div>
                {/* Card 2 — back-right */}
                <div className="absolute top-2 right-0 w-[172px] rotate-2 rounded-2xl border bg-card shadow-xl px-4 py-3.5 z-10">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Runway</p>
                  <p className="text-xl font-black">5.0 months</p>
                  <div className="flex gap-0.5 mt-2">
                    {[7, 5, 6, 5, 4, 5, 4].map((h, i) => (
                      <div key={i} className={`flex-1 rounded-sm ${i < 4 ? "bg-primary/60" : "bg-border"}`} style={{ height: `${h * 3}px` }} />
                    ))}
                  </div>
                </div>
                {/* Card 3 — front-center */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200px] -rotate-1 rounded-2xl border bg-card shadow-2xl px-4 py-3.5 z-20 ring-1 ring-primary/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Revenue Recognised</p>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">ASC 606</span>
                  </div>
                  <p className="text-xl font-black">$1,041</p>
                  <p className="text-[11px] text-muted-foreground mt-1">of $12,500 · deferred over 12 mo</p>
                </div>
              </div>

              {/* O2C Pipeline diagram (Option C) */}
              <div className="relative rounded-2xl border bg-card/80 backdrop-blur px-5 py-4 shadow-lg">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Order-to-Cash · Automated</p>
                <div className="flex items-center gap-0">
                  {[
                    { icon: FilePenLine, label: "Invoice", color: "text-primary bg-primary/10", active: true },
                    { icon: ArrowLeftRight, label: "Payment", color: "text-blue-600 bg-blue-500/10 dark:text-blue-400", active: true },
                    { icon: ShieldCheck, label: "Reconcile", color: "text-violet-600 bg-violet-500/10 dark:text-violet-400", active: true },
                    { icon: TrendingUp, label: "Forecast", color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400", active: false },
                  ].map(({ icon: Icon, label, color, active }, i, arr) => (
                    <div key={label} className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} ${active ? "ring-2 ring-offset-2 ring-offset-card ring-current" : "opacity-50"}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={`text-[10px] font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
                        {active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      {i < arr.length - 1 && (
                        <div className="flex-1 mx-1 flex items-center mb-5">
                          <div className={`h-px flex-1 ${active ? "bg-primary/30" : "bg-border"}`} style={{ backgroundImage: active ? "repeating-linear-gradient(90deg,transparent,transparent 4px,currentColor 4px,currentColor 8px)" : undefined }} />
                          <ArrowRight className={`h-3 w-3 flex-shrink-0 ${active ? "text-primary/50" : "text-border"}`} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 mt-3 pt-3 border-t">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] text-muted-foreground">3 of 4 stages complete · Forecast updating…</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── Features grid ─── */}
      <section className="w-full py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <BarChart3 className="h-3.5 w-3.5" />
              Everything in one platform
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Built for modern finance teams
            </h2>
            <p className="text-muted-foreground text-lg">
              From invoices to audit trails — Ryzha's AI handles the entire financial stack so your team doesn't have to.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Workflow,
                color: "text-primary bg-primary/10",
                title: "Autonomous Workflows",
                desc: "Visual AI agents that automatically handle your Procure-to-Pay and Order-to-Cash pipelines from end to end.",
              },
              {
                icon: MessageSquareText,
                color: "text-violet-600 bg-violet-500/10 dark:text-violet-400",
                title: "Natural Language Reporting",
                desc: "Stop wrestling with spreadsheets. Ask complex financial questions in plain English and get instant, data-backed narratives.",
              },
              {
                icon: ArrowLeftRight,
                color: "text-blue-600 bg-blue-500/10 dark:text-blue-400",
                title: "Continuous Reconciliation",
                desc: "Connect Stripe and let Ryzha automatically recognize revenue, calculate deferred schedules, and match every transaction.",
              },
              {
                icon: Tag,
                color: "text-amber-600 bg-amber-500/10 dark:text-amber-400",
                title: "Smart Expense Categorization",
                desc: "AI automatically categorizes expenses, flags anomalies, and disputes invoice mismatches before they cost you money.",
              },
              {
                icon: FilePenLine,
                color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
                title: "Contract & Revenue Management",
                desc: "Track deferred vs. recognized revenue effortlessly with built-in subscription and contract management.",
              },
              {
                icon: BellRing,
                color: "text-rose-600 bg-rose-500/10 dark:text-rose-400",
                title: "Proactive Risk Alerts",
                desc: "Stay ahead with AI-driven churn risk predictions and automated overdue invoice warnings.",
              },
            ].map(({ icon: Icon, color, title, desc }, i) => (
              <div
                key={title}
                className="group flex flex-col gap-4 p-6 bg-background rounded-2xl border hover:border-primary/30 hover:shadow-lg transition-all duration-200"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1.5">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Autonomous Workflows (detail) ─── */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Workflow timeline card */}
            <div className="rounded-2xl border bg-background shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b bg-card">
                <div>
                  <p className="text-sm font-semibold">Payment Received — $12,500</p>
                  <p className="text-xs text-muted-foreground">Acme Corp · Stripe · just now</p>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-2.5 py-1">
                  <CheckCircle2 className="h-3 w-3" /> Processed
                </span>
              </div>
              <div className="p-5 space-y-0">
                {[
                  { icon: Workflow,    color: "text-primary bg-primary/10 border-primary/20",                                                                                                   label: "Workflow Manager",     msg: "Payment received from Acme Corp · $12,500 · initiating processing" },
                  { icon: TrendingUp,  color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/40",                                        label: "Revenue Recording",    msg: "Revenue of $12,500 recorded · recognition type: deferred (12 months)" },
                  { icon: BarChart3,   color: "text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/40 dark:border-violet-800/40",                            label: "Revenue Policy",       msg: "ASC 606 applied · $1,041.67 recognised · $11,458.33 deferred over contract" },
                  { icon: ShieldCheck, color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/40",                                  label: "Audit & Verification", msg: "Contract matched · audit hash verified · no discrepancies found" },
                  { icon: TrendingUp,  color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/40",                      label: "Financial Forecast",   msg: "Runway updated to 8.4 months · financial model refreshed" },
                ].map(({ icon: Icon, color, label, msg }, i, arr) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border ${color}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      {i < arr.length - 1 && <div className="w-px flex-1 bg-border my-1 min-h-[10px]" />}
                    </div>
                    <div className="pb-3.5 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold">{label}</span>
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{msg}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Workflow className="h-3.5 w-3.5" />
                Autonomous Workflows
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                An autonomous finance team
              </h2>
              <p className="text-muted-foreground text-lg">
                Ryzha replaces manual data entry with AI agents that handle your Procure-to-Pay and Order-to-Cash workflows end-to-end.
              </p>
              <div className="space-y-3">
                {[
                  "Visually build and monitor AI agent workflows in real-time",
                  "Match invoices, dispute anomalies, and predict churn risks automatically",
                  "Ask questions in plain English — get instant, data-backed answers",
                  "Stripe-connected revenue recognition with ASC 606 compliance built in",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ─── Lyla Section ─── */}
      <section className="w-full py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Built into Ryzha
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Meet Lyla, Ryzha's AI mode
              </h2>
              <p className="text-muted-foreground text-lg">
                Switch into Lyla mode and run your entire accounting workflow through conversation. No forms, no menus — just tell Ryzha what needs to happen.
              </p>
              <div className="space-y-3">
                {[
                  "Create invoices, expenses, and orders in plain language",
                  "Query live financial data — overdue invoices, burn rate, runway",
                  "Every action links directly to the created record",
                  "Persistent session memory — Lyla follows the conversation",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/lyla-mode" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                See everything Lyla can do
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-2xl border bg-background shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b bg-card">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-card" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Lyla</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ryzha AI Mode</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4 bg-background min-h-[300px]">
                <div className="flex gap-3 flex-row-reverse">
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[82%]">
                    Create an invoice for Acme Corp — 5 hours consulting at $200/hr
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 text-sm max-w-[82%] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 w-fit">
                      <span>🧾</span><span>create invoice</span>
                    </div>
                    <p>Invoice <strong>INV-0004</strong> created for <strong>Acme Corp</strong> — $1,000.00 due 23 Jun.</p>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-1 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3 w-3" /><span>Invoice created</span>
                      </div>
                      <span className="text-xs text-primary font-medium">View →</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[82%]">
                    What's our runway?
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 text-sm max-w-[82%] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 w-fit mb-1.5">
                      <span>📊</span><span>query financial summary</span>
                    </div>
                    <p><strong>Cash:</strong> $142,500 &nbsp;·&nbsp; <strong>Burn:</strong> $28,400/mo</p>
                    <p className="text-muted-foreground">Runway: ~<strong className="text-foreground">5.0 months</strong> at current rate.</p>
                  </div>
                </div>
              </div>
              <div className="border-t bg-card px-4 py-3">
                <div className="flex items-center gap-3 bg-background border rounded-xl px-4 py-2 opacity-50">
                  <Sparkles className="h-4 w-4 text-primary/50" />
                  <span className="text-xs text-muted-foreground">Tell Lyla what to do...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Mobile App Section ─── */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Phone mockup */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 translate-y-8" />
                <div className="relative w-[260px] rounded-[44px] border-[7px] border-foreground/10 bg-[#0F172A] shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0F172A] rounded-b-2xl z-10" />
                  <div className="bg-[#0F172A] min-h-[520px] pt-8 pb-16 flex flex-col">
                    <div className="flex items-center justify-between px-6 pb-3">
                      <span className="text-[10px] text-white/60 font-medium">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 bg-white/50 rounded-[2px]" />
                        <div className="w-3 h-1.5 bg-white/50 rounded-[2px]" />
                        <div className="w-4 h-1.5 bg-white/70 rounded-[2px]" />
                      </div>
                    </div>
                    <div className="px-5 pb-4">
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Good morning</p>
                      <p className="text-white text-lg font-black tracking-tight leading-tight">Alex Johnson</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 px-4 mb-3">
                      {[
                        { label: "Cash Balance", val: "$142.5K", up: true },
                        { label: "Runway", val: "5.0 mo", up: false },
                        { label: "MRR", val: "$28.4K", up: true },
                        { label: "Pending", val: "3 exp", up: null },
                      ].map(({ label, val, up }) => (
                        <div key={label} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                          <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-1">{label}</p>
                          <p className="text-white text-sm font-black">{val}</p>
                          {up !== null && (
                            <p className={`text-[9px] font-semibold mt-0.5 ${up ? "text-emerald-400" : "text-red-400"}`}>
                              {up ? "↑ 12%" : "↓ 3%"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mx-4 mb-3 bg-gradient-to-r from-primary/30 to-violet-600/20 rounded-2xl p-3 border border-primary/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
                          <Zap className="h-2.5 w-2.5 text-white" />
                        </div>
                        <p className="text-white text-xs font-bold">Lyla AI · This Month</p>
                      </div>
                      <div className="flex gap-2">
                        {[["14.2K", "Tokens"], ["48", "Requests"], ["31", "Messages"]].map(([v, l]) => (
                          <div key={l} className="flex-1 bg-white/5 rounded-lg p-1.5 text-center">
                            <p className="text-white text-xs font-black">{v}</p>
                            <p className="text-white/40 text-[8px] uppercase tracking-wide">{l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="mx-4">
                      <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold mb-1.5">Recent Invoices</p>
                      {[
                        { name: "Acme Corp", amt: "$12,500", status: "PAID", color: "bg-emerald-500/20 text-emerald-400" },
                        { name: "Beta Ltd", amt: "$3,200", status: "SENT", color: "bg-blue-500/20 text-blue-400" },
                      ].map(({ name, amt, status, color }) => (
                        <div key={name} className="flex items-center justify-between py-1.5 border-b border-white/5">
                          <div>
                            <p className="text-white text-[11px] font-semibold">{name}</p>
                            <p className="text-white/40 text-[9px]">{amt}</p>
                          </div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${color}`}>{status}</span>
                        </div>
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-4 py-2.5 border-t border-white/10 bg-[#0F172A]">
                      {[
                        { icon: LayoutDashboard, label: "Home", active: true },
                        { icon: Wallet, label: "Finance", active: false },
                        { icon: Bot, label: "Lyla", active: false },
                        { icon: Bell, label: "Menu", active: false },
                      ].map(({ icon: Icon, label, active }) => (
                        <div key={label} className="flex flex-col items-center gap-0.5">
                          <Icon className={`h-4 w-4 ${active ? "text-primary" : "text-white/30"}`} />
                          <span className={`text-[8px] font-bold ${active ? "text-primary" : "text-white/30"}`}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute bottom-[18px] left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full" />
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-6 order-1 lg:order-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
                <Smartphone className="h-3.5 w-3.5" />
                Coming Soon — iOS & Android
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Ryzha in your pocket
              </h2>
              <p className="text-muted-foreground text-lg">
                The full power of Ryzha's financial intelligence, now on mobile. Monitor runway, manage invoices, chat with Lyla, and stay on top of your finances — anywhere.
              </p>
              <div className="space-y-4">
                {[
                  { icon: LayoutDashboard, title: "Live Dashboard", desc: "Cash balance, burn rate, runway, and KPIs at a glance with real-time data." },
                  { icon: Wallet, title: "Finance & Operations", desc: "Create invoices, manage customers, vendors, expenses and payments on the go." },
                  { icon: Bot, title: "Lyla on Mobile", desc: "Chat with Lyla for instant financial insights, queries, and AI-assisted actions." },
                  { icon: Bell, title: "Smart Notifications", desc: "Instant alerts for overdue invoices, payment receipts, and runway warnings." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <div className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-foreground/5 opacity-60 cursor-not-allowed select-none">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Coming soon on</p>
                    <p className="text-sm font-bold leading-none">App Store</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border rounded-xl px-4 py-3 bg-foreground/5 opacity-60 cursor-not-allowed select-none">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M3.18 23.76c.3.17.63.24.97.2l12.64-12.64L13.16 7.7 3.18 23.76zm17.69-11.35-3.12-1.81-3.48 3.48 3.48 3.48 3.14-1.82c.9-.52.9-1.82-.02-2.33zM2.08 1.25C2.03 1.41 2 1.59 2 1.79v20.42c0 .2.03.37.08.53l.12.11L14.46 10.6v-.2L2.2 1.14l-.12.11z"/></svg>
                  <div className="text-left">
                    <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Coming soon on</p>
                    <p className="text-sm font-bold leading-none">Google Play</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Competitor Comparison ─── */}
      <section className="w-full py-20 bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Why teams switch to Ryzha
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              The complete finance stack, without the complexity
            </h2>
            <p className="text-muted-foreground text-lg">
              Ryzha gives you enterprise ERP power at a fraction of the cost — full O2C, P2P, GL, and AI in one platform, ready in days.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border shadow-sm bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-6 py-4 font-semibold text-foreground w-64">Feature</th>
                  <th className="px-6 py-4 text-center w-36">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-black text-primary text-base">Ryzha</span>
                      <span className="text-[10px] text-muted-foreground font-normal">AI-native ERP</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center w-36">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-foreground">NetSuite</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Enterprise ERP</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center w-36">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-foreground">QuickBooks</span>
                      <span className="text-[10px] text-muted-foreground font-normal">SMB accounting</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center w-36">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-foreground">Rillet</span>
                      <span className="text-[10px] text-muted-foreground font-normal">Startup GL</span>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center w-36">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-foreground">Xentral</span>
                      <span className="text-[10px] text-muted-foreground font-normal">ERP platform</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "AI-native automation",
                    desc: "Natural language queries, auto-categorisation, anomaly detection",
                    ryzha: "yes", netsuite: "no", quickbooks: "partial", rillet: "partial", xentral: "no",
                  },
                  {
                    feature: "Full O2C + P2P + GL",
                    desc: "Order-to-cash, procure-to-pay, and general ledger in one platform",
                    ryzha: "yes", netsuite: "yes", quickbooks: "no", rillet: "no", xentral: "yes",
                  },
                  {
                    feature: "Startup-friendly pricing",
                    desc: "No per-module fees, no seat taxes, no hidden professional services",
                    ryzha: "yes", netsuite: "no", quickbooks: "partial", rillet: "yes", xentral: "no",
                  },
                  {
                    feature: "ASC 606 revenue recognition",
                    desc: "Built-in deferred revenue, multi-element arrangements, schedules",
                    ryzha: "yes", netsuite: "yes", quickbooks: "no", rillet: "partial", xentral: "no",
                  },
                  {
                    feature: "Real-time bank reconciliation",
                    desc: "Automatic matching with AI-assisted transaction categorisation",
                    ryzha: "yes", netsuite: "partial", quickbooks: "partial", rillet: "yes", xentral: "partial",
                  },
                  {
                    feature: "Chart of Accounts hierarchy",
                    desc: "Full sub-account tree, category mapping, and GL integration",
                    ryzha: "yes", netsuite: "yes", quickbooks: "partial", rillet: "partial", xentral: "yes",
                  },
                  {
                    feature: "AR & AP aging reports",
                    desc: "30/60/90+ day buckets with customer and vendor drill-down",
                    ryzha: "yes", netsuite: "yes", quickbooks: "partial", rillet: "no", xentral: "partial",
                  },
                  {
                    feature: "Mobile app (iOS & Android)",
                    desc: "Full ERP access, dashboard, Lyla AI chat, approvals on mobile",
                    ryzha: "partial", netsuite: "partial", quickbooks: "yes", rillet: "no", xentral: "no",
                  },
                  {
                    feature: "Natural language finance chat",
                    desc: "Ask 'What's our runway?' or 'Show overdue invoices' in plain English",
                    ryzha: "yes", netsuite: "no", quickbooks: "no", rillet: "no", xentral: "no",
                  },
                ].map(({ feature, desc, ryzha, netsuite, quickbooks, rillet, xentral }, i) => {
                  const Cell = ({ val }: { val: string }) => {
                    if (val === "yes") return (
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                            <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                      </td>
                    )
                    if (val === "partial") return (
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                            <Minus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                      </td>
                    )
                    return (
                      <td className="px-6 py-3.5 text-center">
                        <div className="flex justify-center">
                          <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <X className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                          </div>
                        </div>
                      </td>
                    )
                  }
                  return (
                    <tr key={feature} className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      <td className="px-6 py-3.5">
                        <p className="font-semibold text-sm text-foreground">{feature}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
                      </td>
                      <td className="px-6 py-3.5 text-center bg-primary/5">
                        <div className="flex justify-center">
                          {ryzha === "yes" ? (
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                              <Check className="h-3.5 w-3.5 text-primary" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                              <Minus className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      <Cell val={netsuite} />
                      <Cell val={quickbooks} />
                      <Cell val={rillet} />
                      <Cell val={xentral} />
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span>Fully supported</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Minus className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              </div>
              <span>Partial / add-on required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <X className="h-3 w-3 text-red-500 dark:text-red-400" />
              </div>
              <span>Not available</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="w-full py-20 px-4">
        <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to scale smarter?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Startups trust Ryzha's AI brain to manage their finances.
          </p>
          <Button size="lg" variant="secondary" asChild className="font-bold">
            <Link href="/signup">Get Started Now</Link>
          </Button>
        </div>
      </section>

    </div>
  )
}
