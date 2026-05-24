import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-static'

function Method({ method }: { method: string }) {
  const colours: Record<string, string> = {
    GET: "bg-green-500/10 text-green-600 dark:text-green-400",
    POST: "bg-primary/10 text-primary",
    PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    DELETE: "bg-destructive/10 text-destructive",
  }
  return (
    <Badge variant="outline" className={`uppercase font-mono ${colours[method] ?? ""}`}>
      {method}
    </Badge>
  )
}

function Endpoint({ method, path, description, request, response }: {
  method: string; path: string; description: string; request?: string; response?: string
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Method method={method} />
          <CardTitle className="font-mono text-base">{path}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {(request || response) && (
        <CardContent className="space-y-4">
          {request && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Request Body</h4>
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm"><code>{request}</code></pre>
              </div>
            </div>
          )}
          {response && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Response</h4>
              <div className="bg-muted p-4 rounded-md overflow-x-auto">
                <pre className="text-sm"><code>{response}</code></pre>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">API Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Integrate Ryzha's financial operations directly into your own applications using our REST API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="hidden md:block col-span-1">
          <div className="sticky top-24 space-y-6">
            <div>
              <h4 className="font-semibold mb-2">Getting Started</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#authentication" className="hover:text-primary transition-colors">Authentication</a></li>
                <li><a href="#webhooks" className="hover:text-primary transition-colors">Webhooks</a></li>
                <li><a href="#pagination" className="hover:text-primary transition-colors">Pagination</a></li>
                <li><a href="#errors" className="hover:text-primary transition-colors">Errors</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Core Endpoints</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#transactions" className="hover:text-primary transition-colors">Transactions</a></li>
                <li><a href="#invoices" className="hover:text-primary transition-colors">Invoices</a></li>
                <li><a href="#payments" className="hover:text-primary transition-colors">Payments</a></li>
                <li><a href="#credit-notes" className="hover:text-primary transition-colors">Credit Notes</a></li>
                <li><a href="#expenses" className="hover:text-primary transition-colors">Expenses</a></li>
                <li><a href="#contracts" className="hover:text-primary transition-colors">Contracts</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Intelligence</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#aria" className="hover:text-primary transition-colors">Aria Co-pilot</a></li>
                <li><a href="#ai-suggest" className="hover:text-primary transition-colors">AI Suggest</a></li>
                <li><a href="#reports" className="hover:text-primary transition-colors">AI Reports</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-16">
          <section id="authentication" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Authentication</h2>
            <p className="text-muted-foreground">
              All API requests require a valid session cookie (cookie-based auth via NextAuth) or a Bearer token for server-to-server calls. Manage API keys under Settings → Developers.
            </p>
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-sm"><code>Authorization: Bearer rzh_live_xxxxxxxxxxxxxxxxx</code></pre>
            </div>
            <p className="text-sm text-muted-foreground">
              Do not expose secret keys in client-side code or public repositories.
            </p>
          </section>

          <section id="webhooks" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Webhooks</h2>
            <p className="text-muted-foreground">
              Ryzha receives real-time events from any billing system (Stripe, Chargebee, custom billing) to trigger internal agents like Order-to-Cash and Procure-to-Pay.
            </p>
            <Endpoint
              method="POST"
              path="/api/webhooks/events"
              description="System-agnostic endpoint to ingest financial events."
              request={`{
  "event_type": "payment.succeeded",
  "source_system": "custom_billing",
  "data": {
    "transaction_id": "txn_89123",
    "amount": 10000,
    "currency": "usd",
    "customer_email": "jane@company.com",
    "metadata": { "contract_id": "ctr_9012" }
  }
}`}
            />
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section id="pagination" className="space-y-4 scroll-mt-24">
              <h3 className="text-2xl font-bold tracking-tight">Pagination</h3>
              <p className="text-muted-foreground text-sm">
                List endpoints support <code>limit</code> (default 20, max 100) and <code>cursor</code> parameters for cursor-based pagination. Responses include a <code>has_more</code> flag and <code>next_cursor</code>.
              </p>
            </section>
            <section id="errors" className="space-y-4 scroll-mt-24">
              <h3 className="text-2xl font-bold tracking-tight">Errors</h3>
              <p className="text-muted-foreground text-sm">
                HTTP <code>2xx</code> = success. <code>4xx</code> = client error (validation, auth, not found). <code>5xx</code> = server error. All errors return <code>{"{ \"error\": \"message\" }"}</code>.
              </p>
            </section>
          </div>

          <hr className="border-muted" />

          <section id="transactions" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              Transactions represent a single movement of money. They are automatically reconciled by AI agents against contracts and invoices.
            </p>
            <div className="space-y-4">
              <Endpoint
                method="GET"
                path="/api/transactions"
                description="List all transactions for the authenticated organization."
                response={`{
  "data": [
    {
      "id": "tx_123",
      "amount": 5000,
      "currency": "usd",
      "workflowStatus": "completed",
      "auditStatus": "verified",
      "recognizedRevenue": 416.66,
      "deferredRevenue": 4583.34
    }
  ],
  "has_more": false
}`}
              />
              <Endpoint
                method="GET"
                path="/api/transactions/:id"
                description="Get a single transaction with full agent logs."
              />
              <Endpoint
                method="POST"
                path="/api/transactions/:id/rerun"
                description="Re-run the AI pipeline (R2R → O&M → Auditor) for a transaction. Resets logs and status."
                response={`{ "success": true, "transactionId": "tx_123" }`}
              />
            </div>
          </section>

          <section id="invoices" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <div className="space-y-4">
              <Endpoint
                method="GET"
                path="/api/invoices"
                description="List all invoices for the organization."
              />
              <Endpoint
                method="POST"
                path="/api/invoices"
                description="Create a new invoice and automatically trigger the Order-to-Cash workflow."
                request={`{
  "clientName": "Acme Corp",
  "clientEmail": "billing@acme.com",
  "clientAddress": "123 Main St",
  "dueDate": "2024-02-01",
  "lineItems": [
    {
      "description": "Software Engineering Services",
      "quantity": 100,
      "unitPrice": 150.00,
      "taxRate": 0
    }
  ]
}`}
              />
              <Endpoint
                method="POST"
                path="/api/invoices/ai-suggest"
                description="Use AI to extract invoice details from a natural language description."
                request={`{
  "description": "Invoice Acme Corp for 10 days of consulting at $1500/day"
}`}
                response={`{
  "clientName": "Acme Corp",
  "lineItems": [{ "description": "Consulting", "quantity": 10, "unitPrice": 1500 }],
  "dueDate": "2024-02-01"
}`}
              />
            </div>
          </section>

          <section id="payments" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Payments</h2>
            <p className="text-muted-foreground">Record payments received against an invoice.</p>
            <div className="space-y-4">
              <Endpoint
                method="GET"
                path="/api/invoices/:id/payments"
                description="List all payments for a specific invoice."
              />
              <Endpoint
                method="POST"
                path="/api/invoices/:id/payments"
                description="Record a payment received against an invoice."
                request={`{
  "amount": 5000.00,
  "paymentDate": "2024-01-15",
  "method": "bank_transfer",
  "referenceNumber": "TXN-001",
  "notes": "Q1 partial payment"
}`}
              />
            </div>
          </section>

          <section id="credit-notes" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Credit Notes</h2>
            <p className="text-muted-foreground">Issue credit notes and refunds against invoices.</p>
            <div className="space-y-4">
              <Endpoint
                method="GET"
                path="/api/invoices/:id/credit-notes"
                description="List all credit notes for a specific invoice."
              />
              <Endpoint
                method="POST"
                path="/api/invoices/:id/credit-notes"
                description="Issue a credit note against an invoice."
                request={`{
  "amount": 500.00,
  "reason": "Service was partially not delivered",
  "reasonCategory": "service_not_delivered",
  "refundMethod": "bank_transfer",
  "issueDate": "2024-01-20"
}`}
              />
            </div>
          </section>

          <section id="expenses" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Expenses</h2>
            <div className="space-y-4">
              <Endpoint
                method="GET"
                path="/api/expenses"
                description="List all expenses for the organization."
              />
              <Endpoint
                method="POST"
                path="/api/expenses"
                description="Create a new expense record."
                request={`{
  "description": "Figma subscription",
  "amount": 180.00,
  "category": "Software",
  "date": "2024-01-01",
  "notes": "Annual design tool subscription"
}`}
              />
            </div>
          </section>

          <section id="contracts" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
            <div className="space-y-4">
              <Endpoint
                method="GET"
                path="/api/contracts"
                description="List all contracts for the organization."
              />
              <Endpoint
                method="POST"
                path="/api/contracts"
                description="Create a new contract. Used by the Auditor agent for transaction verification."
                request={`{
  "stripePaymentIntentId": "pi_3abc...",
  "customerEmail": "ceo@startup.com",
  "amount": 120000,
  "status": "signed",
  "startDate": "2024-01-01",
  "endDate": "2024-12-31"
}`}
              />
            </div>
          </section>

          <hr className="border-muted" />

          <section id="aria" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Aria Co-pilot</h2>
            <p className="text-muted-foreground">
              Aria is Ryzha's natural language accounting co-pilot. It can create invoices, expenses, customers, vendors, and query your financial data through conversation.
            </p>
            <div className="space-y-4">
              <Endpoint
                method="POST"
                path="/api/aria"
                description="Send a message to Aria and receive a structured financial action + response."
                request={`{
  "message": "Create an invoice for Acme Corp for 5 hours of consulting at $200/hr",
  "history": [
    { "role": "user", "content": "previous message" },
    { "role": "assistant", "content": "previous response" }
  ]
}`}
                response={`{
  "action": "create_invoice",
  "message": "Invoice INV-0001 created for Acme Corp — $1,000.00 due 24 Jun 2024",
  "result": {
    "success": true,
    "entityType": "invoice",
    "entityId": "clm_...",
    "link": "/invoices/clm_...",
    "summary": "..."
  }
}`}
              />
              <Endpoint
                method="GET"
                path="/api/aria"
                description="Retrieve the last 100 Aria conversation messages for the current user."
              />
              <Endpoint
                method="DELETE"
                path="/api/aria"
                description="Clear Aria conversation history for the current user."
              />
            </div>
          </section>

          <section id="ai-suggest" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">AI Suggest</h2>
            <p className="text-muted-foreground">
              Extract structured data from natural language descriptions for pre-filling forms.
            </p>
            <Endpoint
              method="POST"
              path="/api/ai-suggest"
              description="Extract structured form data from a natural language prompt."
              request={`{
  "type": "expense",
  "prompt": "$250 Notion subscription for product team, monthly"
}`}
              response={`{
  "description": "Notion subscription – product team",
  "amount": 250,
  "category": "Software",
  "date": "2024-01-24",
  "notes": "Monthly recurring"
}`}
            />
          </section>

          <section id="reports" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">AI Reports</h2>
            <p className="text-muted-foreground">
              Query your financial data in natural language to generate insights, summaries and structured data.
            </p>
            <Endpoint
              method="POST"
              path="/api/reports/ask"
              description="Ask natural language questions about your financial data."
              request={`{
  "query": "Show me revenue by month for Q1"
}`}
              response={`{
  "data": [...],
  "summary": "Revenue has increased by 15% month-over-month...",
  "chartType": "line"
}`}
            />
          </section>
        </div>
      </div>
    </div>
  )
}
