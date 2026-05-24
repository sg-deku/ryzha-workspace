import Link from "next/link"
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
  ArrowLeft,
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

      {/* Breadcrumb */}
      <div className="w-full container px-4 md:px-6 pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Ryzha
        </Link>
      </div>

      {/* Hero — no standalone CTAs */}
      <section className="w-full py-16 lg:py-24 flex flex-col items-center text-center px-4">
        <div className="max-w-2xl space-y-5">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Zap className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-background" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Included in every Ryzha account
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            Aria — Ryzha's <span className="text-primary">AI mode</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-[540px] mx-auto">
            Aria is not a separate product. It's how you interact with Ryzha when you want to move faster — run your entire accounting workflow through a single conversation.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="w-full py-16 bg-muted/40">
        <div className="container px-4 md:px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">How it works</h2>
            <p className="text-muted-foreground">Launch Aria from anywhere inside Ryzha. No separate account, no configuration.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {howItWorks.map(({ step, title, desc, example }) => (
              <div key={step} className="flex flex-col gap-4 p-6 rounded-xl bg-background border">
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

      {/* Capabilities Grid */}
      <section className="w-full py-16">
        <div className="container px-4 md:px-6 space-y-10">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">What you can do with Aria</h2>
            <p className="text-muted-foreground">
              Every core accounting action, accessible through a single conversational interface — inside Ryzha.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {capabilities.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex flex-col gap-3 p-5 rounded-xl border bg-background hover:shadow-md transition-shadow">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <h3 className="font-semibold text-sm">{label}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Details + Prompts */}
      <section className="w-full py-16 bg-muted/40">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold tracking-tight">Designed for speed</h2>
              <div className="space-y-4">
                {[
                  { title: "Full-screen focus mode", desc: "Aria takes over the screen so you can focus entirely on your finances without distractions." },
                  { title: "Persistent session memory", desc: "Your conversation persists for the duration of your session — follow-up questions just work." },
                  { title: "Embedded entity links", desc: "Every created record includes a direct link so you can jump to the invoice, expense, or customer immediately." },
                  { title: "Uses your org's AI provider", desc: "Aria runs on the AI provider configured by your admin — no separate key or setup needed." },
                  { title: "No training required", desc: "Just describe what you want in plain English. Aria handles the rest." },
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

            <div className="rounded-2xl border bg-background p-6 space-y-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Example prompts</p>
              {[
                "Create an invoice for Acme Corp for 5 hours of consulting at $200/hr",
                "Add an expense: $180 Figma subscription, category Software",
                "Show me all overdue invoices",
                "What's our financial overview?",
                "Add a new customer: TechStart Inc, email cfo@techstart.com",
                "Create a vendor: AWS cloud services, NET30 payment terms",
                "Show me expenses from last month",
              ].map((prompt) => (
                <div
                  key={prompt}
                  className="flex items-start gap-2.5 rounded-lg bg-muted px-3.5 py-2.5 text-sm text-muted-foreground"
                >
                  <Zap className="h-3.5 w-3.5 text-primary/60 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{prompt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA — back to Ryzha, not to Aria */}
      <section className="w-full py-16 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <h2 className="text-2xl font-bold">Aria is available the moment you sign in</h2>
          <p className="text-muted-foreground">
            No extra steps. Once you're in Ryzha, the <strong>Launch Aria</strong> button is in the top bar — ready whenever you need it.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Get started with Ryzha
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border px-6 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Back to Ryzha homepage
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
