import type { ConnectorDef } from "../types"

export const stripeConnector: ConnectorDef = {
  slug: "stripe",
  name: "Stripe",
  description: "Trigger on Stripe payment events and manage charges, invoices, and subscriptions.",
  category: "commerce",
  color: "#635bff",
  authType: "apikey",
  sortOrder: 40,
  triggers: [
    {
      slug: "payment_succeeded",
      name: "Payment Succeeded",
      description: "Fires when a payment_intent or charge succeeds.",
      inputSchema: [],
      outputSchema: {
        payment: { id: "string", amount: "number", currency: "string", customerId: "string", customerEmail: "string", description: "string", metadata: "object" },
      },
      sampleOutput: {
        payment: { id: "pi_abc123", amount: 4500, currency: "usd", customerId: "cus_abc", customerEmail: "billing@acme.com", description: "SaaS subscription", metadata: {} },
      },
      sortOrder: 0,
    },
    {
      slug: "invoice_paid",
      name: "Invoice Paid",
      description: "Fires when a Stripe invoice is paid.",
      inputSchema: [],
      outputSchema: {
        invoice: { id: "string", number: "string", amount: "number", currency: "string", customerId: "string", customerEmail: "string", subscriptionId: "string" },
      },
      sampleOutput: {
        invoice: { id: "in_abc", number: "DRF-0001", amount: 9900, currency: "usd", customerId: "cus_abc", customerEmail: "billing@acme.com", subscriptionId: "sub_abc" },
      },
      sortOrder: 1,
    },
    {
      slug: "customer_created",
      name: "Customer Created",
      description: "Fires when a new Stripe customer is created.",
      inputSchema: [],
      outputSchema: {
        customer: { id: "string", email: "string", name: "string", metadata: "object" },
      },
      sampleOutput: {
        customer: { id: "cus_new", email: "new@acme.com", name: "Acme Corp", metadata: {} },
      },
      sortOrder: 2,
    },
  ],
  actions: [
    {
      slug: "retrieve_balance",
      name: "Retrieve Balance",
      description: "Get the current Stripe account balance.",
      inputSchema: [],
      outputSchema: { available: "number", pending: "number", currency: "string" },
      sampleOutput: { available: 125000, pending: 3500, currency: "usd" },
      sortOrder: 0,
    },
    {
      slug: "create_invoice",
      name: "Create Invoice",
      description: "Create and optionally finalize a Stripe invoice.",
      inputSchema: [
        { key: "customerId", label: "Stripe Customer ID", type: "text", required: true, supportsDataPills: true },
        { key: "amount", label: "Amount (in cents)", type: "number", required: true, supportsDataPills: true },
        { key: "currency", label: "Currency", type: "text", placeholder: "usd", supportsDataPills: true },
        { key: "description", label: "Description", type: "text", supportsDataPills: true },
        { key: "autoFinalize", label: "Auto-finalize", type: "boolean" },
      ],
      outputSchema: { invoice: { id: "string", number: "string", status: "string", hostedInvoiceUrl: "string" } },
      sampleOutput: { invoice: { id: "in_new", number: "DRF-0002", status: "draft", hostedInvoiceUrl: "https://invoice.stripe.com/..." } },
      sortOrder: 1,
    },
  ],
}
