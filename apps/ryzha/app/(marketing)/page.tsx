import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { ArrowRight, BarChart3, ShieldCheck, Zap, Workflow, MessageSquareText, ArrowLeftRight, Tag, FilePenLine, BellRing } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const session = await getServerSession(authOptions)

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
            <div className="relative rounded-xl border bg-background/50 shadow-2xl flex flex-col min-h-[400px] overflow-hidden">
              {/* Terminal Header */}
              <div className="flex items-center px-4 py-3 border-b bg-muted/50 backdrop-blur-sm">
                <div className="flex gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                </div>
                <div className="mx-auto text-xs font-mono text-muted-foreground flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> agent-orchestrator.log
                </div>
              </div>
              
              {/* Terminal Content */}
              <div className="flex-1 p-6 font-mono text-sm bg-zinc-950 text-zinc-300 flex flex-col gap-4">
                <div className="flex items-start gap-3 opacity-80">
                  <span className="text-emerald-500 mt-0.5">▶</span>
                  <div>
                    <div className="text-zinc-500">[10:42:54.120] Orchestrator</div>
                    <div className="text-zinc-100">Workflow started | Transaction ID: tx_12984 | Amount: $12,500</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">▶</span>
                  <div className="w-full">
                    <div className="text-zinc-500">[10:42:54.850] P2P Agent</div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-zinc-300">Matching invoice INV-1779268...</span>
                      <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded text-xs">MATCHED</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">▶</span>
                  <div className="w-full">
                    <div className="text-zinc-500">[10:42:55.210] R2R Agent</div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-zinc-300">Reconciling Stripe charge ch_3TZ5...</span>
                      <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded text-xs">DONE</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">▶</span>
                  <div className="w-full">
                    <div className="text-zinc-500">[10:42:56.050] FP&A Agent</div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-zinc-300">Calculating new runway forecast...</span>
                      <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-0.5 rounded text-xs">UPDATED</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-auto pt-4 border-t border-zinc-800">
                  <span className="text-blue-400 animate-pulse">●</span>
                  <span className="text-zinc-500 italic">Waiting for next event...</span>
                  <span className="inline-block w-2 h-4 bg-zinc-500 animate-pulse ml-1"></span>
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
