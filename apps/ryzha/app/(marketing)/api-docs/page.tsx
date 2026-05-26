import Link from "next/link"
import { type ComponentType } from "react"

import {
  ArrowRight,
  Bot,
  BookOpenText,
  CircleAlert,
  Code2,
  Database,
  FileText,
  Gauge,
  KeyRound,
  Layers3,
  Sparkles,
  Terminal,
  Users,
  Wallet,
  Webhook,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const dynamic = "force-static"

const quickFacts = [
  { label: "Transport", value: "REST + webhooks" },
  { label: "Payloads", value: "JSON" },
  { label: "Auth", value: "Bearer tokens" },
  { label: "Automation", value: "Lyla actions" },
]

const sidebarSections = [
  { id: "quickstart", label: "Quick start" },
  { id: "auth", label: "Authentication" },
  { id: "webhooks", label: "Webhooks" },
  { id: "reference", label: "API reference" },
  { id: "ai", label: "AI & insights" },
  { id: "examples", label: "Examples" },
  { id: "errors", label: "Errors" },
]

const groups = [
  {
    id: "transactions",
    title: "Transactions",
    description: "Track and rerun reconciliation workflows for cash movements.",
    icon: Wallet,
    endpoints: [
      {
        method: "GET",
        path: "/api/transactions",
        description: "List all transactions for the authenticated organization.",
        response: `{
  "data": [
    {
      "id": "tx_123",
      "amount": 5000,
      "currency": "usd",
      "workflowStatus": "completed",
      "auditStatus": "verified"
    }
  ],
  "has_more": false
}`,
      },
      {
        method: "GET",
        path: "/api/transactions/:id",
        description: "Fetch a single transaction with its reconciliation details.",
      },
      {
        method: "POST",
        path: "/api/transactions/:id/rerun",
        description: "Rerun the AI reconciliation pipeline for a transaction.",
        response: `{ "success": true, "transactionId": "tx_123" }`,
      },
    ],
  },
  {
    id: "invoices",
    title: "Invoices & payments",
    description: "Create invoices, record payments, and issue credit notes.",
    icon: FileText,
    endpoints: [
      {
        method: "GET",
        path: "/api/invoices",
        description: "List invoices for the organization.",
      },
      {
        method: "POST",
        path: "/api/invoices",
        description: "Create a new invoice and trigger the order-to-cash flow.",
        request: `{
  "clientName": "Acme Corp",
  "clientEmail": "billing@acme.com",
  "dueDate": "2026-06-24",
  "lineItems": [
    {
      "description": "Software Engineering Services",
      "quantity": 100,
      "unitPrice": 150
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/api/invoices/ai-suggest",
        description: "Generate invoice details from a plain-English prompt.",
      },
      {
        method: "POST",
        path: "/api/invoices/:id/payments",
        description: "Record a payment received against an invoice.",
      },
    ],
  },
  {
    id: "operations",
    title: "Expenses, customers, and vendors",
    description: "Create operational records directly through the API.",
    icon: Users,
    endpoints: [
      {
        method: "GET",
        path: "/api/customers",
        description: "List customers in the organization.",
      },
      {
        method: "POST",
        path: "/api/customers",
        description: "Create a customer record.",
      },
      {
        method: "GET",
        path: "/api/vendors",
        description: "List vendor records.",
      },
      {
        method: "POST",
        path: "/api/expenses",
        description: "Create an expense, then categorise or correct it with AI.",
      },
      {
        method: "POST",
        path: "/api/expenses/ai-categorize",
        description: "Suggest a category and confidence for a new expense.",
      },
    ],
  },
  {
    id: "automation",
    title: "Workflows and documents",
    description: "Support for purchases, vendor invoices, contracts, and sales orders.",
    icon: Layers3,
    endpoints: [
      {
        method: "GET",
        path: "/api/purchases",
        description: "List purchase orders.",
      },
      {
        method: "GET",
        path: "/api/vendor-invoices",
        description: "List vendor invoices.",
      },
      {
        method: "POST",
        path: "/api/contracts",
        description: "Create a contract for revenue recognition workflows.",
      },
      {
        method: "POST",
        path: "/api/sales-orders",
        description: "Create a sales order and link it to downstream finance automation.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & insights",
    description: "Natural-language actions, reporting, and dashboard intelligence.",
    icon: Bot,
    endpoints: [
      {
        method: "POST",
        path: "/api/lyla",
        description: "Send a prompt to Lyla and receive a structured action.",
        request: `{
  "message": "Create an invoice for Acme Corp for 5 hours of consulting at $200/hr"
}`,
      },
      {
        method: "POST",
        path: "/api/ai-suggest",
        description: "Extract structured data from natural language.",
      },
      {
        method: "POST",
        path: "/api/reports/ask",
        description: "Ask a financial question and get a data-backed narrative.",
      },
      {
        method: "GET",
        path: "/api/settings/ai-usage",
        description: "Inspect AI usage and consumption for the organization.",
      },
    ],
  },
]

function MethodBadge({ method }: { method: string }) {
  const classes: Record<string, string> = {
    GET: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    POST: "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    PUT: "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    DELETE: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
  }

  return (
    <Badge variant="outline" className={`font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-md ${classes[method] ?? ""}`}>
      {method}
    </Badge>
  )
}

function EndpointCard({
  method,
  path,
  description,
  request,
  response,
}: {
  method: string
  path: string
  description: string
  request?: string
  response?: string
}) {
  return (
    <div className="group relative flex flex-col gap-4 p-6 rounded-2xl border bg-background hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <MethodBadge method={method} />
          <code className="text-sm font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{path}</code>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {(request || response) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
          {request ? (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                Request Body
              </span>
              <div className="rounded-xl bg-slate-950 p-4 overflow-hidden border border-slate-800">
                <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
                  <code>{request}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Terminal className="h-3 w-3" />
                Request
              </span>
              <div className="flex items-center justify-center rounded-xl bg-muted/30 p-4 h-[120px] border border-dashed border-muted-foreground/20 text-[11px] text-muted-foreground italic">
                No request body required.
              </div>
            </div>
          )}
          {response ? (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Code2 className="h-3 w-3" />
                Response
              </span>
              <div className="rounded-xl bg-slate-950 p-4 overflow-hidden border border-slate-800">
                <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
                  <code>{response}</code>
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Code2 className="h-3 w-3" />
                Response
              </span>
              <div className="flex items-center justify-center rounded-xl bg-muted/30 p-4 h-[120px] border border-dashed border-muted-foreground/20 text-[11px] text-muted-foreground italic">
                Standard JSON response.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SnippetCard({
  title,
  icon: Icon,
  snippet,
  description,
}: {
  title: string
  icon: ComponentType<{ className?: string }>
  snippet: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-4 p-6 rounded-2xl border bg-background shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Icon className="h-4.5 w-4.5" />
        </div>
        <h3 className="font-bold text-sm">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      <div className="rounded-xl bg-slate-950 p-4 overflow-hidden border border-slate-800">
        <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto">
          <code>{snippet}</code>
        </pre>
      </div>
    </div>
  )
}

export default function ApiDocsPage() {
  return (
    <div className="flex flex-col items-center w-full min-h-screen bg-background">
      {/* ─── Hero ─── */}
      <section className="w-full relative overflow-hidden bg-background text-center border-b">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-violet-500/5 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-40 pointer-events-none" />

        <div className="container relative px-4 md:px-6 py-20 lg:py-28 flex flex-col items-center">
          <div className="space-y-7 max-w-4xl flex flex-col items-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <BookOpenText className="h-3.5 w-3.5" />
              Developer docs
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.08]">
                Build on Ryzha with a<br />
                <span className="text-primary">clean, modern API</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-[640px] leading-relaxed mx-auto">
                REST endpoints, webhooks, and AI-powered actions for teams that want to automate finance without leaving their product.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <Button asChild size="lg" className="font-semibold rounded-xl">
                <Link href="#reference">
                  Browse the reference
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold rounded-xl">
                <Link href="#auth">Authentication</Link>
              </Button>
            </div>

            <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 w-full mt-8">
              {quickFacts.map((fact) => (
                <div key={fact.label} className="rounded-2xl border bg-background/80 p-4 shadow-sm text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{fact.label}</p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{fact.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-14 border-b bg-muted/30">
        <div className="container px-4 md:px-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { icon: KeyRound, title: "Authentication", text: "Bearer tokens or session cookies for secure server-to-server and browser usage." },
              { icon: Webhook, title: "Webhooks", text: "Ingest Stripe and event-driven finance updates in real time." },
              { icon: Bot, title: "AI actions", text: "Lyla and AI Suggest expose natural-language automation endpoints." },
              { icon: Gauge, title: "Insight APIs", text: "Dashboards, usage metrics, and reports are available from dedicated routes." },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-border/70 bg-background/90 shadow-sm rounded-2xl">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 pb-20 md:px-6 pt-12">
        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="space-y-1">
              <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Documentation</p>
              <nav className="flex flex-col gap-1">
                {sidebarSections.map((section) => (
                  <Link
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-primary/5 hover:text-primary"
                  >
                    <span>{section.label}</span>
                    <ArrowRight className="h-3.5 w-3.5 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          <div className="space-y-20">
            <section id="quickstart" className="scroll-mt-24 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Getting Started</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Quick start</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Get up and running with the Ryzha API in minutes. Follow these three simple steps to start automating your financial workflows.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  {
                    title: "1. Create an API key",
                    description: "Generate a secure token in your organization settings for server-side access.",
                    icon: KeyRound,
                  },
                  {
                    title: "2. Send your first request",
                    description: "Call any endpoint with JSON and get back a predictable response shape.",
                    icon: Terminal,
                  },
                  {
                    title: "3. Connect webhooks",
                    description: "Subscribe to system events to keep your downstream workflows in sync.",
                    icon: Webhook,
                  },
                ].map(({ title, description, icon: Icon }) => (
                  <div key={title} className="p-6 rounded-2xl border bg-background shadow-sm hover:border-primary/30 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-bold text-base">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="auth" className="scroll-mt-24 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <KeyRound className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Security</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Authentication</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Ryzha uses Bearer tokens to authenticate requests. You can find your API key in the organization settings dashboard.
                </p>
              </div>
              
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="rounded-2xl border bg-background p-6 space-y-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      All API requests must be made over HTTPS. Calls made over plain HTTP will fail. API requests without authentication will also fail.
                    </p>
                    <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                      <pre className="text-[11px] text-slate-300">
                        <code>{`Authorization: Bearer rzh_live_xxx`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2">
                  {[
                    { title: "Base path", text: "/api" },
                    { title: "Content type", text: "application/json" },
                    { title: "Versioning", text: "2024-05-20" },
                    { title: "Security", text: "TLS 1.3" },
                  ].map((item) => (
                    <div key={item.title} className="rounded-2xl border bg-background p-4 flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{item.title}</p>
                      <p className="mt-1 text-sm font-bold text-foreground">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="webhooks" className="scroll-mt-24 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Webhook className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Events</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Webhooks</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Receive real-time notifications when important events happen in your Ryzha account.
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border bg-slate-950 p-6 border-slate-800">
                  <pre className="text-[11px] leading-relaxed text-slate-300">
                    <code>{`// Example Webhook Payload
{
  "id": "evt_12345",
  "type": "invoice.created",
  "created": 1716636228,
  "data": {
    "object": {
      "id": "inv_98765",
      "amount": 5000,
      "status": "draft"
    }
  }
}`}</code>
                  </pre>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">Event-driven workflows</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Webhooks allow you to build reactive systems that trigger when payments are received or invoices are created.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm">Secure delivery</h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Each webhook request is signed so you can verify that the request came from Ryzha.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="reference" className="scroll-mt-24 space-y-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <BookOpenText className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Endpoints</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">API reference</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Comprehensive documentation for every endpoint available in the Ryzha API.
                </p>
              </div>

              <div className="space-y-16">
                {groups.map((group) => {
                  const Icon = group.icon
                  return (
                    <div id={group.id} key={group.id} className="scroll-mt-24 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{group.title}</h3>
                          <p className="text-sm text-muted-foreground">{group.description}</p>
                        </div>
                      </div>
                      <div className="grid gap-6">
                        {group.endpoints.map((endpoint) => (
                          <EndpointCard key={`${endpoint.method}-${endpoint.path}`} {...endpoint} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section id="examples" className="scroll-mt-24 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <Code2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Library</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">SDK Examples</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Copy-pasteable snippets for the most common languages and frameworks.
                </p>
              </div>
              <div className="grid gap-6 xl:grid-cols-3">
                <SnippetCard
                  title="cURL"
                  icon={Terminal}
                  description="Use for quick tests and server-side integrations."
                  snippet={`curl -X POST https://api.ryzha.com/v1/ai-suggest \\
  -H "Authorization: Bearer rzh_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "expense",
    "prompt": "$250 Notion subscription"
  }'`}
                />
                <SnippetCard
                  title="JavaScript"
                  icon={Code2}
                  description="Fetch responses from a Next.js app or worker."
                  snippet={`const res = await fetch("/api/transactions", {
  headers: {
    Authorization: \`Bearer \${token}\`,
  },
})

const { data } = await res.json()`}
                />
                <SnippetCard
                  title="Python"
                  icon={Database}
                  description="Perfect for scripts and automation jobs."
                  snippet={`import requests

res = requests.get(
    "https://api.ryzha.com/v1/reports",
    headers={"Authorization": f"Bearer {token}"},
)
print(res.json())`}
                />
              </div>
            </section>

            <section id="errors" className="scroll-mt-24 space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <CircleAlert className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Conventions</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Errors</h2>
                <p className="text-muted-foreground max-w-2xl">
                  Ryzha uses standard HTTP response codes to indicate the success or failure of an API request.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="p-8 rounded-2xl border bg-background space-y-4">
                  <h3 className="font-bold text-lg">HTTP status codes</h3>
                  <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                    <p><span className="font-bold text-foreground text-emerald-600">2xx</span> Success. Everything worked as expected.</p>
                    <p><span className="font-bold text-foreground text-amber-600">4xx</span> Client Error. The request contains bad syntax or cannot be fulfilled.</p>
                    <p><span className="font-bold text-foreground text-rose-600">5xx</span> Server Error. Something went wrong on Ryzha's end.</p>
                  </div>
                </div>
                <div className="p-8 rounded-2xl border bg-background space-y-4">
                  <h3 className="font-bold text-lg">Response envelope</h3>
                  <div className="rounded-xl bg-slate-950 p-6 border border-slate-800">
                    <pre className="text-[11px] leading-relaxed text-slate-300">
                      <code>{`{
  "success": true,
  "data": {},
  "message": "Optional friendly note"
}`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}
