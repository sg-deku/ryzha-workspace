export type AuthType = "oauth" | "apikey" | "coming_soon"

export interface ProviderField {
  name: string
  label: string
  type: "text" | "password"
  placeholder: string
  helpText?: string
}

export interface ProviderConfig {
  id: string
  name: string
  category: string
  description: string
  logo: string
  color: string
  docsUrl: string
  authType: AuthType
  syncPoints: string[]
  fields?: ProviderField[]
  oauthNote?: string
}

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "QUICKBOOKS",
    name: "QuickBooks Online",
    category: "Accounting",
    description: "System of record. Ryzha pushes journal entries, bills and expenses here.",
    logo: "QB",
    color: "bg-green-500",
    docsUrl: "https://developer.intuit.com/app/developer/qbo/docs/get-started",
    authType: "oauth",
    oauthNote: "You'll be redirected to Intuit to authorise access. Ryzha requests read/write access to your QuickBooks company.",
    syncPoints: [
      "Chart of Accounts (synced on connect)",
      "Push journal entries from AI-processed events",
      "Push bills and expenses from AP workflow",
      "Pull AR/AP aging for reconciliation",
      "Pull bank balances",
    ],
  },
  {
    id: "XERO",
    name: "Xero",
    category: "Accounting",
    description: "Accounting platform alternative to QuickBooks.",
    logo: "XE",
    color: "bg-sky-500",
    docsUrl: "https://developer.xero.com/documentation/",
    authType: "coming_soon",
    syncPoints: [
      "Chart of Accounts",
      "Journal entry push",
      "Invoice and bill sync",
    ],
  },
  {
    id: "STRIPE_CONNECT",
    name: "Stripe",
    category: "Revenue",
    description: "Pull payment intents, subscriptions and invoice events for revenue recognition.",
    logo: "ST",
    color: "bg-violet-500",
    docsUrl: "https://stripe.com/docs/api",
    authType: "apikey",
    syncPoints: [
      "Payment intents → PAYMENT_RECEIVED events",
      "Invoice paid → INVOICE_PAID events",
      "Subscription created / cancelled / updated",
      "Refunds → REFUND_ISSUED events",
    ],
    fields: [
      {
        name: "apiKey",
        label: "Secret Key",
        type: "password",
        placeholder: "sk_live_...",
        helpText: "Found in Stripe Dashboard → Developers → API keys. Use a restricted key with read-only charges and subscriptions.",
      },
      {
        name: "webhookSecret",
        label: "Webhook Signing Secret (optional)",
        type: "password",
        placeholder: "whsec_...",
        helpText: "For real-time event ingestion. Create a webhook endpoint pointing to /api/webhooks/stripe.",
      },
    ],
  },
  {
    id: "CHARGEBEE",
    name: "Chargebee",
    category: "Revenue",
    description: "Subscription billing - pull MRR, churn, renewals and upgrades.",
    logo: "CB",
    color: "bg-orange-500",
    docsUrl: "https://apidocs.chargebee.com/",
    authType: "apikey",
    syncPoints: [
      "Subscription lifecycle events (MRR movements)",
      "Invoice paid and overdue",
      "Credit notes",
      "Customer churn signals",
    ],
    fields: [
      {
        name: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "your_chargebee_api_key",
        helpText: "Found in Chargebee Dashboard → Settings → API Keys.",
      },
      {
        name: "siteName",
        label: "Site Name",
        type: "text",
        placeholder: "your-company",
        helpText: "Your Chargebee subdomain (e.g. acme → acme.chargebee.com).",
      },
    ],
  },
  {
    id: "GUSTO",
    name: "Gusto",
    category: "Payroll",
    description: "Pull payroll runs and headcount data for expense categorisation.",
    logo: "GU",
    color: "bg-pink-500",
    docsUrl: "https://docs.gusto.com/",
    authType: "coming_soon",
    syncPoints: [
      "Payroll runs → PAYROLL_PROCESSED events",
      "Headcount changes per department",
      "Benefit deductions for GL coding",
    ],
  },
  {
    id: "RIPPLING",
    name: "Rippling",
    category: "Payroll & HR",
    description: "HR and payroll - headcount, department changes, payroll runs.",
    logo: "RI",
    color: "bg-yellow-500",
    docsUrl: "https://developer.rippling.com/",
    authType: "coming_soon",
    syncPoints: [
      "Payroll runs",
      "Department and role changes",
      "Headcount reporting",
    ],
  },
  {
    id: "RAMP",
    name: "Ramp",
    category: "Spend",
    description: "Pull corporate card transactions and receipts for auto-coding.",
    logo: "RA",
    color: "bg-slate-600",
    docsUrl: "https://docs.ramp.com/",
    authType: "apikey",
    syncPoints: [
      "Card transactions → EXPENSE_CREATED events",
      "Merchant category codes for GL auto-coding",
      "Receipt attachments",
      "Employee spend by department",
    ],
    fields: [
      {
        name: "apiKey",
        label: "API Token",
        type: "password",
        placeholder: "ramp_tok_...",
        helpText: "Found in Ramp Dashboard → Settings → Developers → API tokens.",
      },
    ],
  },
  {
    id: "MERCURY",
    name: "Mercury",
    category: "Banking",
    description: "Pull bank transactions and balances for cash position tracking.",
    logo: "ME",
    color: "bg-teal-500",
    docsUrl: "https://docs.mercury.com/",
    authType: "apikey",
    syncPoints: [
      "Bank account balances",
      "Transactions → BANK_TRANSACTION events",
      "Wire transfers and ACH",
      "Real-time cash position",
    ],
    fields: [
      {
        name: "apiKey",
        label: "API Token",
        type: "password",
        placeholder: "mercury_sandbox_...",
        helpText: "Found in Mercury Dashboard → Settings → API → Generate token.",
      },
    ],
  },
  {
    id: "SALESFORCE",
    name: "Salesforce",
    category: "CRM",
    description: "Pull opportunity data for deferred revenue and pipeline reporting.",
    logo: "SF",
    color: "bg-blue-500",
    docsUrl: "https://developer.salesforce.com/docs",
    authType: "coming_soon",
    syncPoints: [
      "Closed-won opportunities → bookings",
      "Pipeline for ARR forecasting",
      "Contract start dates for deferred revenue",
    ],
  },
  {
    id: "HUBSPOT",
    name: "HubSpot",
    category: "CRM",
    description: "Pull deal stages and closed-won for ARR/bookings tracking.",
    logo: "HS",
    color: "bg-orange-600",
    docsUrl: "https://developers.hubspot.com/docs/api/overview",
    authType: "apikey",
    syncPoints: [
      "Closed-won deals → bookings events",
      "Deal pipeline for ARR forecast",
      "Contact and company revenue attribution",
    ],
    fields: [
      {
        name: "apiKey",
        label: "Private App Token",
        type: "password",
        placeholder: "pat-na1-...",
        helpText: "Create a Private App in HubSpot → Settings → Integrations → Private Apps. Grant CRM read scopes.",
      },
    ],
  },
]

export const PROVIDER_MAP = Object.fromEntries(PROVIDERS.map((p) => [p.id, p]))
