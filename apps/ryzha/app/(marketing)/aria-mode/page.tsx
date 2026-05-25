import Link from "next/link"
import {
  Zap, ArrowRight, FileText, DollarSign, Users, Package,
  BarChart3, Search, CheckCircle2, MessageSquare, ShoppingCart,
  Sparkles, ArrowLeft, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const capabilities = [
  { icon: FileText,      color: "text-primary bg-primary/10",                                     label: "Create Invoices",             desc: "Generate client invoices with line items, tax, and due dates — just describe what you need." },
  { icon: DollarSign,    color: "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",        label: "Log Expenses",                desc: "Record and categorise expenses instantly without navigating any form." },
  { icon: Users,         color: "text-blue-600 bg-blue-500/10 dark:text-blue-400",                label: "Manage Customers & Vendors",  desc: "Add new customers or vendors with payment terms in a single sentence." },
  { icon: Package,       color: "text-violet-600 bg-violet-500/10 dark:text-violet-400",          label: "Purchase & Sales Orders",     desc: "Draft purchase orders and sales orders linked to existing vendors and customers." },
  { icon: Search,        color: "text-amber-600 bg-amber-500/10 dark:text-amber-400",             label: "Query Financial Data",        desc: "Ask for overdue invoices, expense lists, or vendor data — Aria fetches real data live." },
  { icon: BarChart3,     color: "text-rose-600 bg-rose-500/10 dark:text-rose-400",               label: "Financial Overview",          desc: "Get a snapshot of cash balance, outstanding AR, monthly burn rate, and runway on demand." },
  { icon: ShoppingCart,  color: "text-indigo-600 bg-indigo-500/10 dark:text-indigo-400",         label: "Revenue & Cost Analysis",     desc: "Understand where money comes from and where it goes, without opening a single report." },
  { icon: MessageSquare, color: "text-teal-600 bg-teal-500/10 dark:text-teal-400",               label: "Persistent Conversation",     desc: "Aria remembers context for your entire session — no re-explaining, no context loss." },
]

const howItWorks = [
  {
    step: "01",
    title: "Switch into Aria mode",
    desc: "Hit the Launch Aria button in the top bar from anywhere inside Ryzha. The full-screen AI mode opens instantly — no setup, no configuration.",
    example: "Available on every page via the header — included in your Ryzha account.",
  },
  {
    step: "02",
    title: "Tell Aria what you need",
    desc: "Type in plain language. No forms, no menus. Aria parses your intent and executes directly against your live financial data.",
    example: "\"Create an invoice for Acme Corp — 5 hours consulting at $200/hr, due in 30 days\"",
  },
  {
    step: "03",
    title: "Review and continue",
    desc: "Aria confirms every action with a direct link to the created record. Follow up, query related data, or jump to the next task — the conversation flows naturally.",
    example: "✓  Invoice INV-0004 created — $1,000 due 23 Jun 2026  →  View Invoice",
  },
]

export default function AriaModeDetailPage() {
  return (
    <div className="flex flex-col items-center w-full">

      {/* ─── Hero ─── */}
      <section className="w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="container relative px-4 md:px-6 pt-8 pb-20 lg:pb-28">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-10">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Ryzha
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: copy */}
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Included in every Ryzha account
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                  Meet Aria, Ryzha's
                  <br />
                  <span className="text-primary">AI mode</span>
                </h1>
                <p className="text-lg text-muted-foreground max-w-[480px] leading-relaxed">
                  Aria is not a separate product. It's how you interact with Ryzha when you want to move faster — run your entire accounting workflow through a single conversation.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" asChild className="font-semibold">
                  <Link href="/signup">
                    Get started with Ryzha
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="font-semibold">
                  <Link href="/login">Log in</Link>
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {["No setup required", "Full-screen focus mode", "Session memory", "Live financial data"].map((badge) => (
                  <span key={badge} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Aria chat mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="absolute -inset-4 bg-primary/10 blur-3xl rounded-3xl opacity-30" />
              <div className="relative w-full max-w-[420px] rounded-2xl border bg-background shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b bg-card">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-card" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Aria</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ryzha AI Mode · Active</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">Online</span>
                </div>

                <div className="p-5 space-y-4 bg-background min-h-[340px]">
                  {/* Message 1 */}
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[85%]">
                      Create an invoice for Acme Corp — 5 hours consulting at $200/hr
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 text-sm max-w-[85%] space-y-2">
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
                  {/* Message 2 */}
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[85%]">
                      Show me all overdue invoices
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-card border px-4 py-3 text-sm max-w-[85%] space-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 w-fit mb-1">
                        <span>🔍</span><span>query invoices · overdue</span>
                      </div>
                      <div className="space-y-1.5">
                        {[["Beta Ltd", "$3,200", "12 days"], ["Stark Inc", "$8,750", "5 days"]].map(([name, amt, days]) => (
                          <div key={name} className="flex items-center justify-between gap-4 text-xs">
                            <span className="font-medium">{name}</span>
                            <span className="text-muted-foreground">{amt}</span>
                            <span className="text-red-500 font-semibold">{days} overdue</span>
                          </div>
                        ))}
                      </div>
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
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section className="w-full py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Zap className="h-3.5 w-3.5" />
              How it works
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              Three steps to zero friction
            </h2>
            <p className="text-muted-foreground text-lg">
              Launch Aria from anywhere inside Ryzha. No separate account, no configuration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {howItWorks.map(({ step, title, desc, example }) => (
              <div key={step} className="flex flex-col gap-4 p-6 rounded-2xl bg-background border hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                <span className="text-5xl font-black text-primary/10 leading-none">{step}</span>
                <h3 className="text-lg font-bold -mt-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="mt-auto rounded-xl bg-muted px-3.5 py-3 text-xs text-muted-foreground font-mono leading-relaxed border-l-2 border-primary/40">
                  {example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Capabilities grid ─── */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-3.5 w-3.5" />
              Full capabilities
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
              What you can do with Aria
            </h2>
            <p className="text-muted-foreground text-lg">
              Every core accounting action, accessible through a single conversational interface.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="group flex flex-col gap-3 p-5 rounded-2xl border bg-background hover:border-primary/30 hover:shadow-lg transition-all duration-200">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Details + Prompts ─── */}
      <section className="w-full py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start max-w-5xl mx-auto">

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                <Zap className="h-3.5 w-3.5" />
                Designed for speed
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Built to eliminate friction
              </h2>
              <div className="space-y-5">
                {[
                  { title: "Full-screen focus mode",     desc: "Aria takes over the screen so you can focus entirely on your finances without distractions." },
                  { title: "Persistent session memory",  desc: "Your conversation persists for the duration of your session — follow-up questions just work." },
                  { title: "Embedded entity links",      desc: "Every created record includes a direct link so you can jump to the invoice, expense, or customer immediately." },
                  { title: "Uses your org's AI provider",desc: "Aria runs on the AI provider configured by your admin — no separate key or setup needed." },
                  { title: "No training required",       desc: "Just describe what you want in plain English. Aria handles the rest." },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border bg-background shadow-sm p-6 space-y-3">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <p className="text-sm font-bold">Example prompts</p>
              </div>
              {[
                "Create an invoice for Acme Corp for 5 hours of consulting at $200/hr",
                "Add an expense: $180 Figma subscription, category Software",
                "Show me all overdue invoices",
                "What's our financial overview?",
                "Add a new customer: TechStart Inc, email cfo@techstart.com",
                "Create a vendor: AWS cloud services, NET30 payment terms",
                "Show me expenses from last month",
              ].map((prompt) => (
                <div key={prompt} className="flex items-start gap-2.5 rounded-xl bg-muted px-3.5 py-2.5 text-sm text-muted-foreground hover:bg-muted/80 transition-colors">
                  <Zap className="h-3.5 w-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{prompt}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>



    </div>
  )
}
