import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-static'

export default function ApiDocsPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-5xl">
      <div className="space-y-4 mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">API Documentation</h1>
        <p className="text-xl text-muted-foreground">
          Integrate Ryzha's financial operations directly into your own applications using our system-agnostic REST API.
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
                <li><a href="#contracts" className="hover:text-primary transition-colors">Contracts</a></li>
                <li><a href="#invoices" className="hover:text-primary transition-colors">Invoices</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Intelligence</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#reports" className="hover:text-primary transition-colors">AI Reports</a></li>
                <li><a href="#dashboard" className="hover:text-primary transition-colors">Analytics</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-span-3 space-y-16">
          {/* Authentication */}
          <section id="authentication" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Authentication</h2>
            <p className="text-muted-foreground">
              Authenticate your API requests by including your secret API key in the Authorization header. Manage your API keys in the Ryzha Dashboard under Settings &gt; Developers.
            </p>
            <div className="bg-muted p-4 rounded-md overflow-x-auto">
              <pre className="text-sm"><code>Authorization: Bearer rzh_live_xxxxxxxxxxxxxxxxx</code></pre>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Do not share your secret API keys in publicly accessible areas such as GitHub, client-side code, etc.
            </p>
          </section>

          {/* Webhooks */}
          <section id="webhooks" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Webhooks</h2>
            <p className="text-muted-foreground">
              Ryzha can receive real-time events from any billing system (Stripe, Chargebee, custom billing) to trigger internal agents like Order-to-Cash and Procure-to-Pay.
            </p>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary uppercase">POST</Badge>
                  <CardTitle className="font-mono text-base">/api/webhooks/events</CardTitle>
                </div>
                <CardDescription>System-agnostic endpoint to ingest financial events.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Example Payload</h4>
                  <div className="bg-muted p-4 rounded-md overflow-x-auto">
                    <pre className="text-sm"><code>{`{
  "event_type": "payment.succeeded",
  "source_system": "custom_billing",
  "data": {
    "transaction_id": "txn_89123",
    "amount": 10000,
    "currency": "usd",
    "customer_email": "jane@company.com",
    "metadata": {
      "contract_id": "ctr_9012"
    }
  }
}`}</code></pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Pagination & Errors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section id="pagination" className="space-y-4 scroll-mt-24">
              <h3 className="text-2xl font-bold tracking-tight">Pagination</h3>
              <p className="text-muted-foreground text-sm">
                All top-level API resources have support for bulk fetches via "list" API methods. These list API methods share a common pagination structure utilizing <code>limit</code> and <code>cursor</code> parameters.
              </p>
            </section>

            <section id="errors" className="space-y-4 scroll-mt-24">
              <h3 className="text-2xl font-bold tracking-tight">Errors</h3>
              <p className="text-muted-foreground text-sm">
                Ryzha uses conventional HTTP response codes to indicate the success or failure of an API request. Codes in the <code>2xx</code> range indicate success, <code>4xx</code> indicate client errors, and <code>5xx</code> indicate server errors.
              </p>
            </section>
          </div>

          <hr className="border-muted" />

          {/* Transactions */}
          <section id="transactions" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
            <p className="text-muted-foreground">
              Transactions represent a single movement of money. They are automatically reconciled by our AI agents against contracts and invoices.
            </p>
            
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 uppercase">GET</Badge>
                  <CardTitle className="font-mono text-base">/api/v1/transactions</CardTitle>
                </div>
                <CardDescription>List all transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm"><code>{`{
  "data": [
    {
      "id": "tx_123",
      "amount": 5000,
      "status": "reconciled",
      "recognized_revenue": 416.66,
      "deferred_revenue": 4583.34
    }
  ],
  "has_more": false
}`}</code></pre>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Contracts */}
          <section id="contracts" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Contracts</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary uppercase">POST</Badge>
                  <CardTitle className="font-mono text-base">/api/v1/contracts</CardTitle>
                </div>
                <CardDescription>Create a new contract</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm"><code>{`{
  "customer_id": "cus_891",
  "title": "Enterprise Annual Subscription",
  "total_value": 120000,
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}`}</code></pre>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Invoices */}
          <section id="invoices" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">Invoices</h2>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary uppercase">POST</Badge>
                  <CardTitle className="font-mono text-base">/api/v1/invoices</CardTitle>
                </div>
                <CardDescription>Create a new invoice and automatically trigger the Order-to-Cash workflow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm"><code>{`{
  "customer_id": "cus_891",
  "due_date": "2024-02-01",
  "line_items": [
    {
      "description": "Software Engineering Services",
      "quantity": 100,
      "unit_price": 150.00
    }
  ],
  "status": "draft"
}`}</code></pre>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Reports API */}
          <section id="reports" className="space-y-4 scroll-mt-24">
            <h2 className="text-3xl font-bold tracking-tight">AI Reports API</h2>
            <p className="text-muted-foreground">
              Interact with the Ryzha Financial Brain directly to generate natural language insights and structured data.
            </p>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-500 uppercase">POST</Badge>
                  <CardTitle className="font-mono text-base">/api/reports/ask</CardTitle>
                </div>
                <CardDescription>Ask natural language questions about your financial data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2">Request</h4>
                  <div className="bg-muted p-4 rounded-md overflow-x-auto">
                    <pre className="text-sm"><code>{`{
  "query": "Show me revenue by month",
}`}</code></pre>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2">Response</h4>
                  <div className="bg-muted p-4 rounded-md overflow-x-auto">
                    <pre className="text-sm"><code>{`{
  "data": [...],
  "summary": "Revenue has increased by 15% month-over-month...",
  "chartType": "line"
}`}</code></pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

        </div>
      </div>
    </div>
  )
}
