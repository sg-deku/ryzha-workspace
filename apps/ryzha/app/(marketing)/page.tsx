import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/session"
import { ArrowRight, BarChart3, ShieldCheck, Zap, Workflow, MessageSquareText, ArrowLeftRight, Tag, FilePenLine, BellRing, CheckCircle2, Sparkles, TrendingUp, Smartphone, Bell, LayoutDashboard, Wallet, Bot } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const session = await getSession()

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 lg:py-32 flex flex-col items-center text-center px-4">
        <div className="max-w-3xl space-y-6 animate-fade-up">
          <div className="flex justify-center mb-6">
            <div className="h-32 w-32 md:h-48 md:w-48 bg-primary logo-mask" />
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Financial brain for <span className="text-primary">startups</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[600px] mx-auto">
            AI‑powered accounting, audit, and runway forecasting. 
            Real-time financial intelligence for modern founders.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {session ? (
              <Button size="lg" asChild>
                <Link href="/dashboard">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start free trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-xl shadow-sm border animate-fade-up" style={{ animationDelay: "0.1s" }}>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Workflow className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Autonomous Workflows</h3>
              <p className="text-muted-foreground">
                Visual AI agents that automatically handle your Procure-to-Pay and Order-to-Cash pipelines from end to end.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-xl shadow-sm border animate-fade-up" style={{ animationDelay: "0.2s" }}>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <MessageSquareText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Natural Language Reporting</h3>
              <p className="text-muted-foreground">
                Stop wrestling with spreadsheets. Ask complex financial questions in plain English and get instant, data-backed narratives.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-xl shadow-sm border animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Continuous Reconciliation</h3>
              <p className="text-muted-foreground">
                Connect Stripe and let Ryzha automatically recognize revenue, calculate deferred schedules, and match every transaction.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-xl shadow-sm border animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Tag className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Smart Expense Categorization</h3>
              <p className="text-muted-foreground">
                AI automatically categorizes expenses, flags anomalies, and disputes invoice mismatches before they cost you money.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-xl shadow-sm border animate-fade-up" style={{ animationDelay: "0.5s" }}>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <FilePenLine className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Contract & Revenue Management</h3>
              <p className="text-muted-foreground">
                Track deferred vs. recognized revenue effortlessly with built-in subscription and contract management.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4 p-6 bg-background rounded-xl shadow-sm border animate-fade-up" style={{ animationDelay: "0.6s" }}>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <BellRing className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold">Proactive Risk Alerts</h3>
              <p className="text-muted-foreground">
                Stay ahead of the curve with AI-driven churn risk predictions and automated overdue invoice warnings.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Aria Section */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Built into Ryzha
              </div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Aria — Ryzha's AI mode
              </h2>
              <p className="text-muted-foreground text-lg">
                Switch into Aria mode and run your entire accounting workflow through conversation. No forms, no menus — just tell Ryzha what needs to happen.
              </p>
              <div className="space-y-3">
                {[
                  "Create invoices, expenses, and orders in plain language",
                  "Query live financial data — overdue invoices, burn rate, runway",
                  "Every action links directly to the created record",
                  "Persistent session memory — Aria follows the conversation",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
              <Link href="/aria-mode" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                See everything Aria can do
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
                    <p className="text-sm font-semibold">Aria</p>
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
                  <span className="text-xs text-muted-foreground">Tell Aria what to do...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="w-full py-20 bg-muted/50">
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
                  { icon: Workflow,    color: "text-primary bg-primary/10 border-primary/20",           label: "Workflow Manager",     msg: "Payment received from Acme Corp · $12,500 · initiating processing", done: true },
                  { icon: TrendingUp,  color: "text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800/40",   label: "Revenue Recording",    msg: "Revenue of $12,500 recorded · recognition type: deferred (12 months)", done: true },
                  { icon: BarChart3,   color: "text-violet-600 bg-violet-50 border-violet-200 dark:text-violet-400 dark:bg-violet-950/40 dark:border-violet-800/40", label: "Revenue Policy",       msg: "ASC 606 applied · $1,041.67 recognised · $11,458.33 deferred over contract", done: true },
                  { icon: ShieldCheck, color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950/40 dark:border-amber-800/40",  label: "Audit & Verification", msg: "Contract matched · audit hash verified · no discrepancies found", done: true },
                  { icon: TrendingUp,  color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-800/40", label: "Financial Forecast",   msg: "Runway updated to 8.4 months · financial model refreshed", done: true },
                ].map(({ icon: Icon, color, label, msg, done }, i, arr) => (
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
                        {done && <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />}
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
              <Link href="/signup" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                Start automating your finances
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Phone mockup */}
            <div className="flex justify-center order-2 lg:order-1">
              <div className="relative">
                {/* Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 translate-y-8" />
                {/* Phone shell */}
                <div className="relative w-[260px] rounded-[44px] border-[7px] border-foreground/10 bg-[#0F172A] shadow-2xl overflow-hidden">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0F172A] rounded-b-2xl z-10" />
                  {/* Screen */}
                  <div className="bg-[#0F172A] min-h-[520px] pt-8 pb-16 flex flex-col">
                    {/* Status bar */}
                    <div className="flex items-center justify-between px-6 pb-3">
                      <span className="text-[10px] text-white/60 font-medium">9:41</span>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-1.5 bg-white/50 rounded-[2px]" />
                        <div className="w-3 h-1.5 bg-white/50 rounded-[2px]" />
                        <div className="w-4 h-1.5 bg-white/70 rounded-[2px]" />
                      </div>
                    </div>
                    {/* Header */}
                    <div className="px-5 pb-4">
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Good morning</p>
                      <p className="text-white text-lg font-black tracking-tight leading-tight">Alex Johnson</p>
                    </div>
                    {/* KPI cards */}
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
                    {/* Aria card */}
                    <div className="mx-4 mb-3 bg-gradient-to-r from-primary/30 to-violet-600/20 rounded-2xl p-3 border border-primary/30">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-5 h-5 rounded-md bg-primary flex items-center justify-center">
                          <Zap className="h-2.5 w-2.5 text-white" />
                        </div>
                        <p className="text-white text-xs font-bold">Aria AI · This Month</p>
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
                    {/* Recent invoices */}
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
                    {/* Bottom nav */}
                    <div className="absolute bottom-0 left-0 right-0 flex items-center justify-around px-4 py-2.5 border-t border-white/10 bg-[#0F172A]">
                      {[
                        { icon: LayoutDashboard, label: "Home", active: true },
                        { icon: Wallet, label: "Finance", active: false },
                        { icon: Bot, label: "Aria", active: false },
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
                {/* Home indicator */}
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
                The full power of Ryzha's financial intelligence, now on mobile. Monitor runway, manage invoices, chat with Aria, and stay on top of your finances — anywhere.
              </p>
              <div className="space-y-4">
                {[
                  { icon: LayoutDashboard, title: "Live Dashboard", desc: "Cash balance, burn rate, runway, and KPIs at a glance with real-time data." },
                  { icon: Wallet, title: "Finance & Operations", desc: "Create invoices, manage customers, vendors, expenses and payments on the go." },
                  { icon: Bot, title: "Aria on Mobile", desc: "Chat with Aria for instant financial insights, queries, and AI-assisted actions." },
                  { icon: Bell, title: "Smart Notifications", desc: "Instant alerts for overdue invoices, payment receipts, and runway warnings." },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-4">
                    <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                      <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Store buttons — disabled */}
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

      {/* CTA Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-4xl mx-auto bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-2xl animate-fade-up">
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
