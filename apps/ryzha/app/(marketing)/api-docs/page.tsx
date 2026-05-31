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
  Package,
  Sparkles,
  Terminal,
  Users,
  Wallet,
  Webhook,
  ShoppingCart,
  Banknote,
  BarChart3,
  Shield,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export const dynamic = "force-static"

const quickFacts = [
  { label: "Transport", value: "REST + webhooks" },
  { label: "Payloads", value: "JSON" },
  { label: "Auth", value: "Bearer tokens" },
  { label: "Automation", value: "Lyla AI actions" },
]

const sidebarSections = [
  { id: "quickstart", label: "Quick start" },
  { id: "auth", label: "Authentication" },
  { id: "errors", label: "Errors & Status Codes" },
  { id: "o2c", label: "Order-to-Cash" },
  { id: "p2p", label: "Procure-to-Pay" },
  { id: "products", label: "Products & Catalog" },
  { id: "bank", label: "Bank Reconciliation" },
  { id: "transactions", label: "Transactions & GL" },
  { id: "webhooks", label: "Webhooks" },
  { id: "ai", label: "AI & Insights" },
  { id: "admin", label: "Admin" },
  { id: "examples", label: "SDK Examples" },
]

interface ApiParam { name: string; type: string; required?: boolean; desc: string }

interface Endpoint {
  method: string
  path: string
  description: string
  auth?: boolean
  params?: ApiParam[]
  body?: ApiParam[]
  request?: string
  response?: string
  notes?: string
}

interface ApiGroup {
  id: string
  title: string
  description: string
  icon: ComponentType<{ className?: string }>
  endpoints: Endpoint[]
}

const groups: ApiGroup[] = [
  {
    id: "o2c",
    title: "Order-to-Cash",
    description: "Manage the full customer revenue cycle: customers, sales orders, invoices, payments, and credit notes.",
    icon: FileText,
    endpoints: [
      {
        method: "GET",
        path: "/api/customers",
        description: "Returns all customers for the authenticated organization, ordered by name.",
        params: [
          { name: "status", type: "string", desc: "Filter by status: ACTIVE or FLAGGED" },
          { name: "search", type: "string", desc: "Search by name or email (partial match)" },
        ],
        response: `[
  {
    "id": "cuid",
    "name": "Google LLC",
    "email": "billing@google.com",
    "creditLimit": 50000,
    "paymentTerms": "NET30",
    "status": "ACTIVE",
    "createdAt": "2026-01-15T00:00:00.000Z"
  }
]`,
      },
      {
        method: "POST",
        path: "/api/customers",
        description: "Create a new customer. Email must be unique within the organization.",
        body: [
          { name: "name", type: "string", required: true, desc: "Customer display name" },
          { name: "email", type: "string", desc: "Billing email — must be unique per org" },
          { name: "creditLimit", type: "number", desc: "Credit limit in base currency (default: 5000)" },
          { name: "paymentTerms", type: "string", desc: "e.g. NET30, NET60 (default: NET30)" },
          { name: "taxId", type: "string", desc: "Customer tax or VAT ID" },
        ],
        request: `{
  "name": "Google LLC",
  "email": "billing@google.com",
  "creditLimit": 50000,
  "paymentTerms": "NET30"
}`,
        response: `{
  "id": "cuid",
  "name": "Google LLC",
  "email": "billing@google.com",
  "creditLimit": 50000,
  "status": "ACTIVE"
}`,
      },
      {
        method: "GET",
        path: "/api/sales-orders",
        description: "List all sales orders. Ordered by creation date descending.",
        params: [
          { name: "customerId", type: "string", desc: "Filter by customer ID" },
          { name: "status", type: "string", desc: "DRAFT, APPROVED, INVOICED, PAID" },
        ],
        response: `[{
  "id": "cuid",
  "orderNumber": "SO-123456",
  "totalAmount": 5000,
  "status": "APPROVED",
  "customerId": "cuid",
  "lineItems": [...]
}]`,
      },
      {
        method: "POST",
        path: "/api/sales-orders",
        description: "Create a new sales order. Order number is auto-generated (SO-XXXXXX). Triggers the O2C agent pipeline asynchronously after creation.",
        body: [
          { name: "customerId", type: "string", required: true, desc: "ID of an existing customer" },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, discount, accountCode, productId }" },
          { name: "notes", type: "string", desc: "Internal order notes" },
        ],
        request: `{
  "customerId": "cuid",
  "lineItems": [
    {
      "description": "Cloud Hosting — Monthly",
      "quantity": 12,
      "unitPrice": 500,
      "taxRate": 8.5
    }
  ]
}`,
        response: `{
  "id": "cuid",
  "orderNumber": "SO-147582",
  "status": "DRAFT",
  "totalAmount": 6000,
  "customerId": "cuid"
}`,
        notes: "The O2C agent pipeline runs asynchronously. The returned workflowStatus will initially be pending.",
      },
      {
        method: "GET",
        path: "/api/invoices",
        description: "List all customer invoices. Returns nextNumber and defaultTaxRate for the new invoice form.",
        params: [
          { name: "status", type: "string", desc: "DRAFT, SENT, PAID, OVERDUE, VOID" },
          { name: "customerId", type: "string", desc: "Filter by customer" },
        ],
        response: `{
  "invoices": [...],
  "nextNumber": "INV-2026-0042",
  "defaultTaxRate": 8.5
}`,
      },
      {
        method: "POST",
        path: "/api/invoices",
        description: "Create a new invoice. Invoice number is auto-generated. The clientEmail must match an existing customer in the org — free-text email is rejected.",
        body: [
          { name: "clientEmail", type: "string", required: true, desc: "Must match an existing customer email" },
          { name: "issueDate", type: "string", required: true, desc: "ISO date string (e.g. 2026-05-30)" },
          { name: "dueDate", type: "string", desc: "ISO date. Defaults to issueDate + 30 days" },
          { name: "lineItems", type: "array", required: true, desc: "Array of line item objects" },
          { name: "subtotal", type: "number", required: true, desc: "Sum of line amounts before tax" },
          { name: "totalTax", type: "number", required: true, desc: "Sum of all line taxes" },
          { name: "total", type: "number", required: true, desc: "subtotal + totalTax" },
        ],
        request: `{
  "clientEmail": "billing@google.com",
  "issueDate": "2026-05-30",
  "lineItems": [
    {
      "description": "Software Engineering Services",
      "quantity": 100,
      "unitPrice": 150,
      "taxRate": 8.5
    }
  ],
  "subtotal": 15000,
  "totalTax": 1275,
  "total": 16275
}`,
        response: `{
  "id": "cuid",
  "invoiceNumber": "INV-2026-0042",
  "status": "DRAFT",
  "total": 16275,
  "clientEmail": "billing@google.com"
}`,
      },
      {
        method: "POST",
        path: "/api/invoices/:id/generate-pdf",
        description: "Generate a PDF for the invoice using org letterhead. Returns a signed download URL valid for 24 hours.",
        response: `{ "url": "https://storage.example.com/signed-url..." }`,
      },
      {
        method: "GET",
        path: "/api/payments",
        description: "List all customer payments (Stripe and manual) for the organization.",
        params: [
          { name: "invoiceId", type: "string", desc: "Filter payments for a specific invoice" },
          { name: "method", type: "string", desc: "stripe, bank_transfer, check, cash" },
        ],
        response: `[{
  "id": "cuid",
  "amount": 5000,
  "paymentDate": "2026-05-29",
  "method": "stripe",
  "referenceNumber": "pi_3Tc...",
  "invoiceId": "cuid",
  "transactionId": "cuid"
}]`,
      },
      {
        method: "POST",
        path: "/api/credit-notes",
        description: "Create a credit note against an existing invoice. Triggers a GL reversal journal entry.",
        body: [
          { name: "invoiceId", type: "string", required: true, desc: "Invoice being credited" },
          { name: "amount", type: "number", required: true, desc: "Credit amount (must be ≤ invoice total)" },
          { name: "reason", type: "string", required: true, desc: "Reason for the credit" },
        ],
        request: `{
  "invoiceId": "cuid",
  "amount": 500,
  "reason": "Service not delivered as specified"
}`,
        response: `{
  "id": "cuid",
  "creditNoteNumber": "CN-2026-0003",
  "amount": 500,
  "status": "ISSUED"
}`,
      },
    ],
  },
  {
    id: "p2p",
    title: "Procure-to-Pay",
    description: "Manage the full AP cycle: vendors, purchase orders, vendor invoices, debit memos, and outbound payments.",
    icon: ShoppingCart,
    endpoints: [
      {
        method: "GET",
        path: "/api/vendors",
        description: "List all vendors for the organization.",
        params: [
          { name: "status", type: "string", desc: "ACTIVE or FLAGGED" },
        ],
        response: `[{ "id", "name", "email", "taxId", "paymentTerms", "status" }]`,
      },
      {
        method: "POST",
        path: "/api/vendors",
        description: "Create a new vendor.",
        body: [
          { name: "name", type: "string", required: true, desc: "Vendor display name" },
          { name: "email", type: "string", desc: "Contact email" },
          { name: "paymentTerms", type: "string", desc: "e.g. NET30 (default: NET30)" },
          { name: "taxId", type: "string", desc: "Tax or VAT identification number" },
        ],
        request: `{
  "name": "Cloudify Inc.",
  "email": "billing@cloudify.com",
  "paymentTerms": "NET30",
  "taxId": "US-12345678"
}`,
        response: `{ "id": "cuid", "name": "Cloudify Inc.", "status": "ACTIVE" }`,
      },
      {
        method: "GET",
        path: "/api/purchases",
        description: "List all purchase orders.",
        params: [
          { name: "vendorId", type: "string", desc: "Filter POs by vendor" },
          { name: "status", type: "string", desc: "DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ROUTED" },
        ],
        response: `[{
  "id": "cuid",
  "poNumber": "PO-147582",
  "totalAmount": 6000,
  "status": "ROUTED",
  "vendorId": "cuid",
  "lineItems": [...]
}]`,
      },
      {
        method: "POST",
        path: "/api/purchases",
        description: "Create a purchase order. PO number is auto-generated (PO-XXXXXX).",
        body: [
          { name: "vendorId", type: "string", required: true, desc: "ID of an existing vendor" },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, discount, accountCode, productId }" },
        ],
        request: `{
  "vendorId": "cuid",
  "lineItems": [
    {
      "description": "Cloud hosting",
      "quantity": 12,
      "unitPrice": 500
    }
  ]
}`,
        response: `{
  "id": "cuid",
  "poNumber": "PO-147582",
  "status": "DRAFT",
  "totalAmount": 6000
}`,
      },
      {
        method: "GET",
        path: "/api/vendor-invoices",
        description: "List all vendor invoices.",
        params: [
          { name: "vendorId", type: "string", desc: "Filter by vendor" },
          { name: "status", type: "string", desc: "PENDING, RECEIVED, MATCHED, DISPUTED, APPROVED" },
        ],
        response: `[{
  "id": "cuid",
  "invoiceNumber": "INV-397817",
  "totalAmount": 6000,
  "status": "APPROVED",
  "vendorId": "cuid",
  "purchaseOrderId": "cuid"
}]`,
      },
      {
        method: "POST",
        path: "/api/vendor-invoices",
        description: "Create a vendor invoice. Invoice number is auto-generated. When purchaseOrderId is supplied, PO line items are carried forward as editable defaults. The three-way match agent compares invoice lines to PO lines.",
        body: [
          { name: "vendorId", type: "string", required: true, desc: "ID of an existing vendor" },
          { name: "purchaseOrderId", type: "string", desc: "Links to a PO for three-way match. PO lines carry forward." },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, accountCode, productId }" },
          { name: "dueDate", type: "string", desc: "ISO date. Defaults to today + vendor payment terms." },
        ],
        request: `{
  "vendorId": "cuid",
  "purchaseOrderId": "cuid",
  "lineItems": [
    {
      "description": "Cloud hosting",
      "quantity": 12,
      "unitPrice": 500
    }
  ]
}`,
        response: `{
  "id": "cuid",
  "invoiceNumber": "INV-397817",
  "status": "PENDING",
  "totalAmount": 6000
}`,
      },
      {
        method: "POST",
        path: "/api/vendor-payments",
        description: "Record a vendor payment. Triggers the 6-agent P2P pipeline: Three-Way Match → Duplicate Check → AP Policy → Payment Scheduler → Treasury → P2P Auditor. A Transaction row is created immediately and the pipeline runs asynchronously.",
        body: [
          { name: "vendorInvoiceId", type: "string", required: true, desc: "ID of the vendor invoice being paid" },
          { name: "amount", type: "number", required: true, desc: "Payment amount in base currency" },
          { name: "paymentMethod", type: "string", required: true, desc: "bank_transfer, check, ach, wire" },
          { name: "reference", type: "string", desc: "Bank reference or check number" },
          { name: "notes", type: "string", desc: "Internal payment notes" },
        ],
        request: `{
  "vendorInvoiceId": "cuid",
  "amount": 6000,
  "paymentMethod": "bank_transfer",
  "reference": "WIRE-2026-0042"
}`,
        response: `{
  "id": "cuid",
  "amount": 6000,
  "paymentMethod": "bank_transfer",
  "transactionId": "cuid",
  "vendorInvoice": { "status": "APPROVED" }
}`,
        notes: "Poll GET /api/transactions/:id to track the pipeline workflowStatus.",
      },
    ],
  },
  {
    id: "products",
    title: "Products & Catalog",
    description: "Shared catalog of products, services, and tax items. Items are scoped to Sales, Purchasing, or both and auto-fill line items on all document types.",
    icon: Package,
    endpoints: [
      {
        method: "GET",
        path: "/api/products",
        description: "List products. Use scope to filter items valid for a specific document type.",
        params: [
          { name: "scope", type: "string", desc: "sales — usedInSales=true items (excluding tax). purchasing — usedInPurchasing=true items (excluding tax)." },
          { name: "type", type: "string", desc: "service, product, or tax" },
          { name: "active", type: "boolean", desc: "Default true. Pass false to include archived items." },
        ],
        response: `[{
  "id": "cuid",
  "code": "SVC-0001",
  "name": "Cloud Hosting — Monthly",
  "type": "service",
  "unitPrice": 500,
  "taxRate": 8.5,
  "accountCode": "4000",
  "usedInSales": true,
  "usedInPurchasing": false
}]`,
      },
      {
        method: "POST",
        path: "/api/products",
        description: "Create a product or service. Code must be unique per organization. Use GET /api/products/next-code to get a suggested code before submitting.",
        body: [
          { name: "code", type: "string", required: true, desc: "Unique code per org. Immutable after creation. Use next-code endpoint to auto-generate." },
          { name: "name", type: "string", required: true, desc: "Display name on line item dropdowns" },
          { name: "type", type: "string", required: true, desc: "service, product, or tax" },
          { name: "unitPrice", type: "number", desc: "Default line item price (default: 0)" },
          { name: "taxRate", type: "number", desc: "Default tax rate percentage (e.g. 8.5)" },
          { name: "accountCode", type: "string", desc: "Default GL account code applied to every line using this item" },
          { name: "usedInSales", type: "boolean", desc: "Appears on Sales Orders and Invoices (default: true)" },
          { name: "usedInPurchasing", type: "boolean", desc: "Appears on Purchase Orders and Vendor Invoices (default: true)" },
        ],
        request: `{
  "code": "SVC-0001",
  "name": "Cloud Hosting — Monthly",
  "type": "service",
  "unitPrice": 500,
  "taxRate": 8.5,
  "accountCode": "4000",
  "usedInSales": false,
  "usedInPurchasing": true
}`,
        response: `{
  "id": "cuid",
  "code": "SVC-0001",
  "name": "Cloud Hosting — Monthly",
  "type": "service",
  "usedInSales": false,
  "usedInPurchasing": true
}`,
      },
      {
        method: "GET",
        path: "/api/products/next-code",
        description: "Returns the next available auto-generated product code based on type and scope. Prefix logic: TAX→TAX, sales service→SVC, sales product→ITEM, purchasing service→EXP, purchasing product→COGS.",
        params: [
          { name: "type", type: "string", desc: "service, product, or tax" },
          { name: "usedInSales", type: "boolean", desc: "Affects prefix" },
          { name: "usedInPurchasing", type: "boolean", desc: "Affects prefix" },
        ],
        response: `{ "code": "SVC-0003", "prefix": "SVC" }`,
      },
      {
        method: "PUT",
        path: "/api/products/:id",
        description: "Update a product. Code cannot be changed after creation. All other fields including scope, pricing, and GL mapping are editable.",
        body: [
          { name: "name", type: "string", desc: "Updated display name" },
          { name: "unitPrice", type: "number", desc: "Updated unit price" },
          { name: "usedInSales", type: "boolean", desc: "Toggle sales scope" },
          { name: "usedInPurchasing", type: "boolean", desc: "Toggle purchasing scope" },
          { name: "isActive", type: "boolean", desc: "false to archive the product" },
        ],
        response: `{ "id", "code", "name", "isActive", "usedInSales", "usedInPurchasing" }`,
      },
      {
        method: "DELETE",
        path: "/api/products/:id",
        description: "Delete a product. If referenced on any document, it is archived (isActive=false) instead of deleted.",
        response: `{ "deleted": true }
// or if in use:
{ "archived": true, "message": "Product archived — referenced on existing documents." }`,
      },
    ],
  },
  {
    id: "bank",
    title: "Bank Reconciliation",
    description: "Import bank statements, run AI-powered matching against open payments, and manage the reconciliation queue.",
    icon: Banknote,
    endpoints: [
      {
        method: "GET",
        path: "/api/bank-reconciliation",
        description: "Returns reconciliation summary with KPI counts and all bank transactions with their match status.",
        response: `{
  "summary": {
    "unmatched": 14,
    "autoMatched": 28,
    "manuallyMatched": 6,
    "percentReconciled": 71
  },
  "transactions": [...]
}`,
      },
      {
        method: "POST",
        path: "/api/bank-reconciliation/import",
        description: "Import a CSV bank statement. Auto-detects headers across common bank export formats. Deduplicates rows by date + amount + description hash. Accepts multipart/form-data with a file field named file.",
        body: [
          { name: "file", type: "File", required: true, desc: "CSV via multipart/form-data. Headers auto-detected from first row." },
          { name: "closingBalance", type: "number", desc: "Optional closing balance for verification." },
        ],
        response: `{ "imported": 42, "skipped": 3, "total": 45 }`,
      },
      {
        method: "POST",
        path: "/api/bank-reconciliation/match",
        description: "Run the AI Reconciliation Agent. Scores each unmatched bank transaction against open vendor payments and customer payments using amount tolerance (±2%), date proximity (±14 days), and keyword overlap. High-confidence matches (≥0.85) are auto-confirmed.",
        response: `{
  "matched": 12,
  "autoConfirmed": 8,
  "reviewQueue": 4,
  "skipped": 30
}`,
      },
      {
        method: "POST",
        path: "/api/bank-reconciliation/confirm",
        description: "Manually confirm a match from the review queue.",
        body: [
          { name: "bankTransactionId", type: "string", required: true, desc: "ID of the BankTransaction to reconcile" },
          { name: "matchType", type: "string", required: true, desc: "vendor_payment or invoice_payment" },
          { name: "matchedId", type: "string", required: true, desc: "ID of the VendorPayment or Payment being matched" },
        ],
        request: `{
  "bankTransactionId": "cuid",
  "matchType": "vendor_payment",
  "matchedId": "cuid"
}`,
        response: `{
  "id": "cuid",
  "matchStatus": "matched",
  "reconciledAt": "2026-05-30T10:00:00.000Z"
}`,
      },
    ],
  },
  {
    id: "transactions",
    title: "Transactions & GL",
    description: "Unified ledger of all inbound and outbound transactions, journal entries, and GL reports.",
    icon: BarChart3,
    endpoints: [
      {
        method: "GET",
        path: "/api/transactions",
        description: "List all transactions (inbound Stripe payments and outbound vendor payments). Ordered by creation date descending.",
        params: [
          { name: "direction", type: "string", desc: "inbound or outbound" },
          { name: "status", type: "string", desc: "workflowStatus: pending, running, completed, error, flagged" },
          { name: "limit", type: "number", desc: "Page size (default: 50)" },
          { name: "offset", type: "number", desc: "Pagination offset (default: 0)" },
        ],
        response: `[{
  "id": "cuid",
  "amount": 5000,
  "direction": "inbound",
  "transactionType": "StripePayment",
  "workflowStatus": "completed",
  "auditStatus": "APPROVED",
  "counterparty": "billing@google.com",
  "createdAt": "2026-05-30T10:00:00.000Z"
}]`,
      },
      {
        method: "GET",
        path: "/api/transactions/:id",
        description: "Get a single transaction with full agent log, journal entry lines, and pipeline step details.",
        response: `{
  "id": "cuid",
  "amount": 5000,
  "workflowStatus": "completed",
  "agentLogs": [...],
  "journalEntry": {
    "jeNumber": "JE-00042",
    "lines": [
      { "accountCode": "1010", "debit": 4706.51, "credit": 0 },
      { "accountCode": "5010", "debit": 293.49, "credit": 0 },
      { "accountCode": "1200", "debit": 0, "credit": 5000 }
    ]
  }
}`,
      },
      {
        method: "POST",
        path: "/api/transactions/:id/rerun",
        description: "Re-run the full agent pipeline for a transaction. Idempotency guards prevent duplicate journal entries on re-runs.",
        response: `{ "workflowStatus": "running" }`,
      },
      {
        method: "GET",
        path: "/api/journal-entries",
        description: "List all journal entries with their lines. Includes both manual entries and system-generated entries.",
        params: [
          { name: "status", type: "string", desc: "DRAFT or POSTED" },
          { name: "type", type: "string", desc: "REGULAR, ADJUSTING, CLOSING, REVERSING" },
          { name: "isSystem", type: "boolean", desc: "true for auto-generated entries only" },
        ],
        response: `[{
  "id": "cuid",
  "jeNumber": "JE-00042",
  "date": "2026-05-30",
  "type": "REGULAR",
  "status": "POSTED",
  "isSystem": true,
  "lines": [{ "accountCode": "1010", "debit": 4706.51, "credit": 0 }]
}]`,
      },
      {
        method: "GET",
        path: "/api/reports/general-ledger",
        description: "Returns the General Ledger grouped by account with per-account debit total, credit total, and running balance.",
        params: [
          { name: "startDate", type: "string", desc: "ISO date — include entries from this date" },
          { name: "endDate", type: "string", desc: "ISO date — include entries up to this date" },
          { name: "accountCode", type: "string", desc: "Filter to a single account" },
        ],
        response: `[{
  "accountCode": "1200",
  "accountName": "Accounts Receivable",
  "accountType": "Asset",
  "totalDebit": 25000,
  "totalCredit": 18000,
  "balance": 7000,
  "entries": [...]
}]`,
      },
      {
        method: "GET",
        path: "/api/chart-of-accounts",
        description: "Returns all accounts in the Chart of Accounts. System accounts have isSystem: true and cannot be edited or deleted.",
        response: `[{
  "id": "cuid",
  "code": "1200",
  "name": "Accounts Receivable",
  "type": "Asset",
  "isSystem": true
}]`,
      },
    ],
  },
  {
    id: "webhooks",
    title: "Webhooks",
    description: "Inbound webhook endpoints. Stripe sends payment events here and the route validates signatures before triggering the O2C pipeline.",
    icon: Webhook,
    endpoints: [
      {
        method: "POST",
        path: "/api/webhooks/stripe",
        description: "Stripe webhook receiver. Validates Stripe-Signature against stripeWebhookSecret from FinancialSettings. Handles payment_intent.succeeded (triggers O2C pipeline), charge.refunded (creates credit note + GL reversal), and payout.paid (clears Stripe Clearing).",
        auth: false,
        body: [
          { name: "Stripe-Signature", type: "header", required: true, desc: "Webhook signature header from Stripe" },
          { name: "type", type: "string", required: true, desc: "payment_intent.succeeded | charge.refunded | payout.paid" },
          { name: "data.object", type: "object", required: true, desc: "Stripe PaymentIntent, Charge, or Payout object" },
        ],
        response: `{ "received": true }`,
        notes: "Only customer PaymentIntents are processed through this endpoint. Vendor payments are recorded via the P2P flow and do not go through this route.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI & Insights",
    description: "Natural-language AI actions, reporting endpoints, and dashboard intelligence via Lyla.",
    icon: Bot,
    endpoints: [
      {
        method: "POST",
        path: "/api/lyla",
        description: "Send a plain-English prompt to Lyla and receive a structured action or financial answer.",
        request: `{
  "message": "Create an invoice for Google for 100 hours of consulting at $200/hr"
}`,
        response: `{
  "action": "create_invoice",
  "data": {
    "clientEmail": "billing@google.com",
    "lineItems": [{ "description": "Consulting", "quantity": 100, "unitPrice": 200 }],
    "total": 20000
  },
  "message": "Invoice draft ready for review."
}`,
      },
      {
        method: "POST",
        path: "/api/reports/ask",
        description: "Ask a financial question in plain English and get a data-backed narrative answer.",
        request: `{
  "question": "What is our runway based on current burn rate?"
}`,
        response: `{
  "answer": "Based on your average monthly burn of $42,000 and current cash balance of $380,000, your runway is approximately 9 months.",
  "metrics": { "runway": 9, "burn": 42000, "cashBalance": 380000 }
}`,
      },
      {
        method: "GET",
        path: "/api/settings/ai-usage",
        description: "Inspect AI usage and token consumption for the organization.",
        response: `{
  "totalRequests": 847,
  "totalTokens": 1284000,
  "costEstimate": 38.52,
  "period": "2026-05"
}`,
      },
    ],
  },
  {
    id: "admin",
    title: "Admin",
    description: "Administrative and maintenance operations. Restricted to authenticated organization administrators.",
    icon: Shield,
    endpoints: [
      {
        method: "POST",
        path: "/api/admin/backfill-journal-entries",
        description: "Retroactively create system journal entries for all existing records without a JE. Fully idempotent — records with existing JEs are skipped.",
        response: `{ "processed": 47, "skipped": 12, "errors": 0 }`,
      },
      {
        method: "GET",
        path: "/api/admin/seed-demo",
        description: "Seeds the organization with representative demo data for O2C and P2P. Only available in non-production environments — returns 403 on live deployments.",
        response: `{ "seeded": true }`,
      },
    ],
  },
]

function MethodBadge({ method }: { method: string }) {
  const classes: Record<string, string> = {
    GET:    "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
    POST:   "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400",
    PUT:    "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
    PATCH:  "border-purple-500/20 bg-purple-500/5 text-purple-600 dark:text-purple-400",
    DELETE: "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
  }
  return (
    <Badge variant="outline" className={`font-mono text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold rounded-md ${classes[method] ?? ""}`}>
      {method}
    </Badge>
  )
}

function ParamTable({ title, rows }: { title: string; rows: ApiParam[] }) {
  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Terminal className="h-3 w-3" />
        {title}
      </span>
      <div className="rounded-xl border overflow-hidden text-[11px]">
        <div className="grid grid-cols-[120px_80px_60px_1fr] gap-2 px-4 py-2 bg-muted/40 font-semibold text-muted-foreground border-b text-[10px] uppercase tracking-wider">
          <span>Name</span><span>Type</span><span>Req.</span><span>Description</span>
        </div>
        {rows.map(p => (
          <div key={p.name} className="grid grid-cols-[120px_80px_60px_1fr] gap-2 px-4 py-2.5 border-b last:border-0 items-start">
            <code className="font-mono font-semibold text-primary text-[11px]">{p.name}</code>
            <span className="text-muted-foreground/70 font-mono">{p.type}</span>
            <span className={p.required ? "text-rose-500 font-semibold" : "text-muted-foreground/40"}>{p.required ? "yes" : "no"}</span>
            <span className="text-muted-foreground leading-relaxed">{p.desc}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const { method, path, description, auth = true, params, body, request, response, notes } = endpoint
  return (
    <div className="group flex flex-col gap-5 p-6 rounded-2xl border bg-background hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <MethodBadge method={method} />
          <code className="text-sm font-bold text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{path}</code>
          {auth === false && (
            <span className="text-[10px] border rounded px-1.5 py-0.5 text-muted-foreground">No auth</span>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        {notes && (
          <div className="flex gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
            <CircleAlert className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold text-amber-700 dark:text-amber-300 mr-1">Note:</span>{notes}
            </p>
          </div>
        )}
      </div>

      {(params && params.length > 0) && (
        <ParamTable title="Query Parameters" rows={params} />
      )}
      {(body && body.length > 0) && (
        <ParamTable title="Request Body (JSON)" rows={body} />
      )}

      {(request || response) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Terminal className="h-3 w-3" />
              Example Request
            </span>
            {request ? (
              <div className="rounded-xl bg-slate-950 p-4 overflow-hidden border border-slate-800 h-full">
                <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto"><code>{request}</code></pre>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl bg-muted/30 p-4 h-[120px] border border-dashed border-muted-foreground/20 text-[11px] text-muted-foreground italic">
                No request body required.
              </div>
            )}
          </div>
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Code2 className="h-3 w-3" />
              Example Response
            </span>
            {response ? (
              <div className="rounded-xl bg-slate-950 p-4 overflow-hidden border border-slate-800 h-full">
                <pre className="text-[11px] leading-relaxed text-slate-300 overflow-x-auto"><code>{response}</code></pre>
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-xl bg-muted/30 p-4 h-[120px] border border-dashed border-muted-foreground/20 text-[11px] text-muted-foreground italic">
                Standard JSON response.
              </div>
            )}
          </div>
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
                REST endpoints, webhooks, and AI-powered actions for teams that want to automate finance workflows without leaving their product.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row justify-center">
              <Button asChild size="lg" className="font-semibold rounded-xl">
                <Link href="#o2c">
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
              { icon: Gauge, title: "Insight APIs", text: "Dashboards, usage metrics, and reports available from dedicated routes." },
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
                  Get up and running with the Ryzha API in minutes.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { title: "1. Authenticate", description: "Use a Bearer token from your organization settings for server-side calls, or include credentials on browser fetch calls.", icon: KeyRound },
                  { title: "2. Send your first request", description: "All endpoints return predictable JSON. Error responses always include an error field describing what went wrong.", icon: Terminal },
                  { title: "3. Connect webhooks", description: "Configure your Stripe webhook secret in Financial Settings to start receiving payment_intent.succeeded events.", icon: Webhook },
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
                  All Ryzha API routes use NextAuth session-based authentication. Every request is automatically scoped to the authenticated organization.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border bg-background p-6 space-y-5">
                  <div>
                    <p className="text-sm font-semibold mb-2">Browser / client-side</p>
                    <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                      <pre className="text-[11px] text-slate-300"><code>{`fetch("/api/customers", {
  credentials: "include"
})`}</code></pre>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-2">Server-to-server</p>
                    <div className="rounded-xl bg-slate-950 p-4 border border-slate-800">
                      <pre className="text-[11px] text-slate-300"><code>{`Authorization: Bearer <session-token>`}</code></pre>
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 grid-cols-2 content-start">
                  {[
                    { title: "Base path", text: "/api" },
                    { title: "Content type", text: "application/json" },
                    { title: "Multi-tenant", text: "Org-scoped" },
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

            <section id="errors" className="scroll-mt-24 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary">
                  <CircleAlert className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-widest">Conventions</span>
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Errors & Status Codes</h2>
                <p className="text-muted-foreground max-w-2xl">
                  All error responses return JSON with an <code className="text-xs bg-muted px-1 rounded">error</code> field. Validation errors may include a <code className="text-xs bg-muted px-1 rounded">details</code> array with per-field messages.
                </p>
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="p-6 rounded-2xl border bg-background space-y-3">
                  <h3 className="font-bold text-base">HTTP Status Codes</h3>
                  {[
                    { code: "200", color: "text-emerald-600", label: "OK", desc: "Request succeeded." },
                    { code: "201", color: "text-emerald-600", label: "Created", desc: "Resource created successfully." },
                    { code: "400", color: "text-amber-600", label: "Bad Request", desc: "Validation error — check the error field." },
                    { code: "401", color: "text-amber-600", label: "Unauthorized", desc: "No valid session. Redirect to /login." },
                    { code: "403", color: "text-amber-600", label: "Forbidden", desc: "Session valid but action not permitted." },
                    { code: "404", color: "text-amber-600", label: "Not Found", desc: "Record does not exist or belongs to a different org." },
                    { code: "409", color: "text-amber-600", label: "Conflict", desc: "Duplicate — a record with this unique key already exists." },
                    { code: "500", color: "text-rose-600", label: "Server Error", desc: "Unexpected server error." },
                  ].map(s => (
                    <div key={s.code} className="flex gap-3 text-sm">
                      <code className={`font-mono font-bold w-8 flex-shrink-0 ${s.color}`}>{s.code}</code>
                      <span className="font-semibold w-24 flex-shrink-0">{s.label}</span>
                      <span className="text-muted-foreground">{s.desc}</span>
                    </div>
                  ))}
                </div>
                <div className="p-6 rounded-2xl border bg-background space-y-4">
                  <h3 className="font-bold text-base">Error response shape</h3>
                  <div className="rounded-xl bg-slate-950 p-5 border border-slate-800">
                    <pre className="text-[11px] leading-relaxed text-slate-300"><code>{`HTTP/1.1 400 Bad Request
{
  "error": "code and name are required",
  "details": [
    { "field": "code", "message": "Required" }
  ]
}`}</code></pre>
                  </div>
                </div>
              </div>
            </section>

            {groups.map((group) => {
              const Icon = group.icon
              return (
                <section id={group.id} key={group.id} className="scroll-mt-24 space-y-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold tracking-tight">{group.title}</h2>
                        <p className="text-muted-foreground text-sm mt-0.5">{group.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-6">
                    {group.endpoints.map((endpoint, i) => (
                      <EndpointCard key={i} endpoint={endpoint} />
                    ))}
                  </div>
                </section>
              )
            })}

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
                  description="Quick tests and server-side integrations."
                  snippet={`curl -X POST https://ryzha.vercel.app/api/invoices \\
  -H "Cookie: next-auth.session-token=..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "clientEmail": "billing@google.com",
    "issueDate": "2026-05-30",
    "lineItems": [
      { "description": "Consulting", "quantity": 10, "unitPrice": 200 }
    ],
    "subtotal": 2000, "totalTax": 170, "total": 2170
  }'`}
                />
                <SnippetCard
                  title="JavaScript"
                  icon={Code2}
                  description="Fetch from a Next.js app or Edge worker."
                  snippet={`const res = await fetch("/api/transactions", {
  credentials: "include",
})

const transactions = await res.json()

// Re-run pipeline for a specific transaction
await fetch(\`/api/transactions/\${id}/rerun\`, {
  method: "POST",
  credentials: "include",
})`}
                />
                <SnippetCard
                  title="Python"
                  icon={Database}
                  description="Scripts, automation jobs, and data pipelines."
                  snippet={`import requests

session = requests.Session()
session.headers.update({
    "Cookie": "next-auth.session-token=..."
})

res = session.get(
    "https://ryzha.vercel.app/api/reports/general-ledger",
    params={"startDate": "2026-01-01", "endDate": "2026-05-31"},
)
print(res.json())`}
                />
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}
