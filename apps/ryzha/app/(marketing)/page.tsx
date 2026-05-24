import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/session"
import { ArrowRight, BarChart3, ShieldCheck, Zap, Workflow, MessageSquareText, ArrowLeftRight, Tag, FilePenLine, BellRing, CheckCircle2, Sparkles, TrendingUp } from "lucide-react"

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
      <section className="w-full py-20">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">An autonomous finance team</h2>
            <p className="text-xl text-muted-foreground">
              Ryzha replaces manual data entry with AI agents that handle your Procure-to-Pay and Order-to-Cash workflows end-to-end.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Workflow Studio</h3>
                <p className="text-muted-foreground">
                  Visually build and monitor AI agent workflows. Watch as our bots match invoices, dispute anomalies, and predict churn risks in real-time.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Natural Language Reports</h3>
                <p className="text-muted-foreground">
                  Stop wrestling with spreadsheets. Just ask "What's our runway if we hire two engineers?" and get an instant, data-backed answer and narrative.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Continuous Reconciliation</h3>
                <p className="text-muted-foreground">
                  Connect Stripe and let Ryzha automatically recognize revenue, calculate deferred schedules, and reconcile every transaction against contracts.
                </p>
              </div>
            </div>
            <div className="rounded-xl border bg-background shadow-2xl overflow-hidden">
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
