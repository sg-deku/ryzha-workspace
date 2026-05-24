import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Zap,
  ArrowRight,
  FileText,
  DollarSign,
  Users,
  Package,
  BarChart3,
  Search,
  CheckCircle2,
  MessageSquare,
  ShoppingCart,
  Sparkles,
} from "lucide-react"

const capabilities = [
  { icon: FileText, label: "Create Invoices", desc: "Generate client invoices with line items, tax, and due dates — just describe what you need." },
  { icon: DollarSign, label: "Log Expenses", desc: "Record and categorise expenses instantly without navigating any form." },
  { icon: Users, label: "Manage Customers & Vendors", desc: "Add new customers or vendors with payment terms in a single sentence." },
  { icon: Package, label: "Purchase & Sales Orders", desc: "Draft purchase orders and sales orders linked to existing vendors and customers." },
  { icon: Search, label: "Query Financial Data", desc: "Ask for overdue invoices, expense lists, or vendor data — Aria fetches real data live." },
  { icon: BarChart3, label: "Financial Overview", desc: "Get a snapshot of cash balance, outstanding AR, monthly burn rate, and runway on demand." },
  { icon: ShoppingCart, label: "Revenue & Cost Analysis", desc: "Understand where money comes from and where it goes, without opening a single report." },
  { icon: MessageSquare, label: "Persistent Conversation", desc: "Aria remembers context for your entire session — no re-explaining, no context loss." },
]

const howItWorks = [
  {
    step: "01",
    title: "Tell Aria what you need",
    desc: "Type in plain language. No forms, no menus. Just describe the action — Aria parses your intent and acts immediately.",
    example: "\"Create an invoice for Acme Corp — 5 hours consulting at $200/hr, due in 30 days\"",
  },
  {
    step: "02",
    title: "Aria executes and confirms",
    desc: "The action is performed directly against your live financial data. Aria shows you exactly what was created or retrieved, with a direct link to the entity.",
    example: "✓  Invoice INV-0004 created — $1,000 due 23 Jun 2026  →  View Invoice",
  },
  {
    step: "03",
    title: "Continue the conversation",
    desc: "Follow up, query related data, or start a new action. Aria holds the full context of your session so the conversation flows naturally.",
    example: "\"Now show me all outstanding invoices for Acme Corp\"",
  },
]

export default function AriaPage() {
  return (
    <div className="flex flex-col items-center w-full">

      {/* Hero */}
      <section className="w-full py-24 lg:py-36 flex flex-col items-center text-center px-4">
        <div className="max-w-3xl space-y-6 animate-fade-up">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Introducing Aria
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            Your AI accounting<br />
            <span className="text-primary">co-pilot</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-[580px] mx-auto">
            Run your entire accounting workflow through conversation. Create invoices, log expenses, query data, and understand your finances — without touching a single form.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button size="lg" asChild>
              <Link href="/signup">
                Try Aria free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Launch Aria</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Chat Demo */}
      <section className="w-full py-16 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="max-w-2xl mx-auto">
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
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">AI Accounting Co-pilot</p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>
              </div>

              <div className="p-5 space-y-4 bg-background min-h-[320px]">
                <div className="flex gap-3 flex-row-reverse">
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[80%]">
                    Create an invoice for Acme Corp — 5 hours consulting at $200/hr
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 text-sm max-w-[80%] space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 w-fit">
                      <span>🧾</span>
                      <span>create invoice</span>
                    </div>
                    <p>Creating invoice for <strong>Acme Corp</strong> — 5 hours at $200/hr.</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg px-3 py-1.5 text-xs text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Invoice created — $1,000.00</span>
                      </div>
                      <span className="text-xs text-primary font-medium cursor-pointer hover:underline">View →</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 flex-row-reverse">
                  <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-2.5 text-sm max-w-[80%]">
                    Show me all overdue invoices
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-card border border-border px-4 py-3 text-sm max-w-[80%] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted rounded px-2 py-1 w-fit mb-2">
                      <span>🔍</span>
                      <span>query invoices</span>
                    </div>
                    <p className="text-muted-foreground">• <span className="text-primary font-medium">INV-0001</span> — Beta Labs $3,200 (SENT)</p>
                    <p className="text-muted-foreground">• <span className="text-primary font-medium">INV-0003</span> — Nimbus Co $850 (PARTIAL)</p>
                  </div>
                </div>
              </div>

              <div className="border-t bg-card px-4 py-3">
                <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2.5 opacity-60">
                  <Sparkles className="h-4 w-4 text-primary/50" />
                  <span className="text-sm text-muted-foreground">Tell Aria what to do...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything you can do with Aria</h2>
            <p className="text-muted-foreground text-lg">
              Every core accounting action, available through a single conversational interface.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col gap-3 p-5 rounded-xl border bg-background hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                </div>
                <h3 className="font-semibold text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-20 bg-muted/40">
        <div className="container px-4 md:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">How Aria works</h2>
            <p className="text-muted-foreground text-lg">
              Three steps. No training. No configuration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {howItWorks.map(({ step, title, desc, example }) => (
              <div key={step} className="relative flex flex-col gap-4 p-6 rounded-xl bg-background border">
                <span className="text-5xl font-black text-primary/10 leading-none">{step}</span>
                <h3 className="text-lg font-bold -mt-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <div className="mt-auto rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground font-mono leading-relaxed border-l-2 border-primary/30">
                  {example}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key details */}
      <section className="w-full py-20">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Designed for founders, not accountants</h2>
              <div className="space-y-4">
                {[
                  { title: "Full-screen focus mode", desc: "Aria takes over the screen so you can focus entirely on your finances without distractions." },
                  { title: "Persistent session memory", desc: "Your conversation persists for the duration of your session — follow-up questions just work." },
                  { title: "Embedded entity links", desc: "Every created record includes a direct link so you can jump to the invoice, expense, or customer immediately." },
                  { title: "Powered by your AI provider", desc: "Aria uses the same AI provider and model configured by your admin — no separate setup needed." },
                ].map(({ title, desc }) => (
                  <div key={title} className="flex gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm">{title}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border bg-muted/30 p-8 space-y-5">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Try these prompts</p>
              {[
                "Create an invoice for Acme Corp for 5 hours of consulting at $200/hr",
                "Add an expense: $180 Figma subscription, category Software",
                "Show me all overdue invoices",
                "What's our financial overview?",
                "Add a new customer: TechStart Inc, email cfo@techstart.com",
                "Create a vendor: AWS cloud services, NET30 payment terms",
              ].map((prompt) => (
                <div
                  key={prompt}
                  className="flex items-start gap-2.5 rounded-lg bg-background border px-3.5 py-2.5 text-sm text-muted-foreground"
                >
                  <Zap className="h-3.5 w-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{prompt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-20 px-4">
        <div className="max-w-3xl mx-auto bg-primary text-primary-foreground rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-2xl">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Ready to meet Aria?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Sign up for Ryzha and launch Aria from the header — no configuration required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="font-bold">
              <Link href="/signup">
                Start free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/login">Already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}
