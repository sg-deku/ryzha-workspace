"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  Zap,
  BookOpen,
  ShoppingCart,
  FileText,
  Package,
  Banknote,
  BarChart3,
  Webhook,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Code2,
  Copy,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH"

const METHOD_CLS: Record<HttpMethod, string> = {
  GET:    "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  POST:   "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  PUT:    "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  DELETE: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  PATCH:  "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
}

interface ApiParam { name: string; type: string; required?: boolean; desc: string }
interface Endpoint {
  method: HttpMethod
  path: string
  description: string
  auth?: boolean
  params?: ApiParam[]
  body?: ApiParam[]
  response?: string
  notes?: string
}

interface ApiGroup {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  endpoints: Endpoint[]
}

const API_GROUPS: ApiGroup[] = [
  {
    id: "o2c",
    label: "Order-to-Cash",
    icon: FileText,
    description: "Manage the full customer revenue cycle: customers, sales orders, invoices, payments, and credit notes.",
    endpoints: [
      {
        method: "GET",
        path: "/api/customers",
        description: "Returns all customers for the authenticated organization, ordered by name. Includes credit limit, payment terms, and status.",
        params: [
          { name: "status", type: "string", desc: "Filter by status: ACTIVE or FLAGGED" },
          { name: "search", type: "string", desc: "Search by name or email (partial match)" },
        ],
        response: `[\n  {\n    "id": "cuid",\n    "name": "Google LLC",\n    "email": "billing@google.com",\n    "creditLimit": 50000,\n    "paymentTerms": "NET30",\n    "status": "ACTIVE",\n    "createdAt": "2026-01-15T00:00:00.000Z"\n  }\n]`,
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
          { name: "taxId", type: "string", desc: "Customer tax or VAT ID for invoicing" },
        ],
        response: `{\n  "id": "cuid",\n  "name": "Google LLC",\n  "email": "billing@google.com",\n  "creditLimit": 50000,\n  "paymentTerms": "NET30",\n  "status": "ACTIVE"\n}`,
      },
      {
        method: "GET",
        path: "/api/customers/[id]",
        description: "Get a single customer with their full invoice history and outstanding balance.",
        response: `{\n  "id": "cuid",\n  "name": "Google LLC",\n  "invoices": [...],\n  "outstandingBalance": 12500\n}`,
      },
      {
        method: "PUT",
        path: "/api/customers/[id]",
        description: "Update a customer record. Email and status can be changed. Credit limit changes take effect on the next invoice.",
        body: [
          { name: "name", type: "string", desc: "Updated display name" },
          { name: "email", type: "string", desc: "Updated billing email" },
          { name: "creditLimit", type: "number", desc: "Updated credit limit" },
          { name: "paymentTerms", type: "string", desc: "Updated payment terms" },
          { name: "status", type: "string", desc: "ACTIVE or FLAGGED" },
        ],
        response: `{ "id": "cuid", "name": "...", "status": "ACTIVE" }`,
      },
      {
        method: "GET",
        path: "/api/sales-orders",
        description: "List all sales orders for the organization. Ordered by creation date descending.",
        params: [
          { name: "customerId", type: "string", desc: "Filter by customer ID" },
          { name: "status", type: "string", desc: "DRAFT, APPROVED, INVOICED, PAID" },
        ],
        response: `[\n  {\n    "id": "cuid",\n    "orderNumber": "SO-123456",\n    "totalAmount": 5000,\n    "status": "APPROVED",\n    "customerId": "cuid",\n    "lineItems": [...]\n  }\n]`,
      },
      {
        method: "POST",
        path: "/api/sales-orders",
        description: "Create a new sales order. Order number is auto-generated (SO-XXXXXX). Validates customer credit limit. Triggers the O2C agent pipeline asynchronously after creation.",
        body: [
          { name: "customerId", type: "string", required: true, desc: "ID of an existing customer" },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, discount, accountCode, productId }" },
          { name: "notes", type: "string", desc: "Internal order notes" },
        ],
        response: `{\n  "id": "cuid",\n  "orderNumber": "SO-123456",\n  "status": "DRAFT",\n  "totalAmount": 5000,\n  "customerId": "cuid"\n}`,
        notes: "The O2C agent pipeline runs asynchronously. Monitor workflowStatus on the returned object.",
      },
      {
        method: "GET",
        path: "/api/invoices",
        description: "List all customer invoices. Returns nextNumber (for new invoice forms) and defaultTaxRate from org settings at the top level.",
        params: [
          { name: "status", type: "string", desc: "DRAFT, SENT, PAID, OVERDUE, VOID" },
          { name: "customerId", type: "string", desc: "Filter by customer" },
        ],
        response: `{\n  "invoices": [...],\n  "nextNumber": "INV-2026-0042",\n  "defaultTaxRate": 8.5\n}`,
      },
      {
        method: "POST",
        path: "/api/invoices",
        description: "Create a new customer invoice. Invoice number is auto-generated from a per-org sequence. Validates that a customer exists for the provided email — free-text email is not accepted.",
        body: [
          { name: "clientEmail", type: "string", required: true, desc: "Must match an existing customer email in the org" },
          { name: "issueDate", type: "string", required: true, desc: "ISO date string (e.g. 2026-05-30)" },
          { name: "dueDate", type: "string", desc: "ISO date string. Defaults to issueDate + 30 days" },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, discount, accountCode, productId }" },
          { name: "subtotal", type: "number", required: true, desc: "Sum of line amounts before tax" },
          { name: "totalTax", type: "number", required: true, desc: "Sum of all line taxes" },
          { name: "total", type: "number", required: true, desc: "subtotal + totalTax" },
          { name: "notes", type: "string", desc: "Payment instructions or notes shown on the invoice PDF" },
        ],
        response: `{\n  "id": "cuid",\n  "invoiceNumber": "INV-2026-0042",\n  "status": "DRAFT",\n  "total": 5000,\n  "clientEmail": "billing@google.com"\n}`,
      },
      {
        method: "PUT",
        path: "/api/invoices/[id]",
        description: "Update an invoice. Only DRAFT invoices can be fully edited. SENT invoices only allow status transitions (void, mark paid).",
        body: [
          { name: "status", type: "string", desc: "Allowed transitions: DRAFT→SENT, SENT→PAID, SENT→VOID" },
          { name: "dueDate", type: "string", desc: "Updated due date (DRAFT only)" },
          { name: "lineItems", type: "array", desc: "Updated line items (DRAFT only)" },
        ],
        response: `{ "id": "cuid", "invoiceNumber": "INV-2026-0042", "status": "SENT" }`,
      },
      {
        method: "POST",
        path: "/api/invoices/[id]/generate-pdf",
        description: "Generate a PDF for the invoice using the org's letterhead and store the URL on the invoice record. Returns a signed download URL valid for 24 hours.",
        response: `{ "url": "https://storage.example.com/signed-url..." }`,
      },
      {
        method: "GET",
        path: "/api/payments",
        description: "List all customer payments (Stripe and manual) for the organization. Ordered by payment date descending.",
        params: [
          { name: "invoiceId", type: "string", desc: "Filter payments for a specific invoice" },
          { name: "method", type: "string", desc: "stripe, bank_transfer, check, cash" },
        ],
        response: `[\n  {\n    "id": "cuid",\n    "amount": 5000,\n    "paymentDate": "2026-05-29T00:00:00.000Z",\n    "method": "stripe",\n    "referenceNumber": "pi_3Tc...",\n    "invoiceId": "cuid",\n    "transactionId": "cuid"\n  }\n]`,
      },
      {
        method: "GET",
        path: "/api/credit-notes",
        description: "List all credit notes for the organization.",
        response: `[{ "id", "creditNoteNumber", "amount", "reason", "invoiceId", "status" }]`,
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
        response: `{ "id", "creditNoteNumber", "amount", "status": "ISSUED" }`,
      },
    ],
  },
  {
    id: "p2p",
    label: "Procure-to-Pay",
    icon: ShoppingCart,
    description: "Manage the full AP cycle: vendors, purchase orders, vendor invoices, debit memos, and outbound payments.",
    endpoints: [
      {
        method: "GET",
        path: "/api/vendors",
        description: "List all vendors for the organization, ordered by name.",
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
          { name: "address", type: "string", desc: "Vendor mailing address" },
        ],
        response: `{ "id", "name", "email", "status": "ACTIVE" }`,
      },
      {
        method: "PUT",
        path: "/api/vendors/[id]",
        description: "Update a vendor record.",
        body: [
          { name: "name", type: "string", desc: "Updated name" },
          { name: "email", type: "string", desc: "Updated email" },
          { name: "status", type: "string", desc: "ACTIVE or FLAGGED" },
        ],
        response: `{ "id", "name", "status" }`,
      },
      {
        method: "GET",
        path: "/api/purchases",
        description: "List all purchase orders. Ordered by creation date descending.",
        params: [
          { name: "vendorId", type: "string", desc: "Filter POs by vendor" },
          { name: "status", type: "string", desc: "DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, ROUTED" },
        ],
        response: `[{ "id", "poNumber", "totalAmount", "status", "vendorId", "lineItems": [...] }]`,
      },
      {
        method: "POST",
        path: "/api/purchases",
        description: "Create a purchase order. PO number is auto-generated (PO-XXXXXX). Triggers the P2P agent pipeline asynchronously.",
        body: [
          { name: "vendorId", type: "string", required: true, desc: "ID of an existing vendor" },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, discount, accountCode, productId }" },
          { name: "notes", type: "string", desc: "Internal PO notes" },
        ],
        response: `{ "id", "poNumber": "PO-147582", "status": "DRAFT", "totalAmount": 6000 }`,
      },
      {
        method: "GET",
        path: "/api/vendor-invoices",
        description: "List all vendor invoices, optionally filtered by vendor or status.",
        params: [
          { name: "vendorId", type: "string", desc: "Filter by vendor" },
          { name: "status", type: "string", desc: "PENDING, RECEIVED, MATCHED, DISPUTED, APPROVED" },
        ],
        response: `[{ "id", "invoiceNumber", "totalAmount", "status", "vendorId", "purchaseOrderId" }]`,
      },
      {
        method: "POST",
        path: "/api/vendor-invoices",
        description: "Create a vendor invoice. Invoice number is auto-generated from a per-org sequence. When purchaseOrderId is supplied, PO line items are available for carry-forward. The three-way match agent compares invoice lines against PO lines.",
        body: [
          { name: "vendorId", type: "string", required: true, desc: "ID of an existing vendor" },
          { name: "purchaseOrderId", type: "string", desc: "Links to a PO for three-way match. PO line items carry forward as editable defaults." },
          { name: "lineItems", type: "array", required: true, desc: "Array of { description, quantity, unitPrice, taxRate, accountCode, productId }" },
          { name: "dueDate", type: "string", desc: "ISO date string. Defaults to today + vendor payment terms." },
          { name: "notes", type: "string", desc: "Internal notes or vendor reference numbers" },
        ],
        response: `{ "id", "invoiceNumber": "INV-397817", "status": "PENDING", "totalAmount": 6000 }`,
      },
      {
        method: "PUT",
        path: "/api/vendor-invoices/[id]",
        description: "Update a vendor invoice. Status transitions follow the AP approval workflow.",
        body: [
          { name: "status", type: "string", desc: "PENDING→RECEIVED→MATCHED→APPROVED or DISPUTED" },
        ],
        response: `{ "id", "invoiceNumber", "status" }`,
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
        response: `{\n  "id": "cuid",\n  "amount": 6000,\n  "paymentMethod": "bank_transfer",\n  "transactionId": "cuid",\n  "vendorInvoice": { "status": "APPROVED" }\n}`,
        notes: "The 6-agent P2P pipeline runs asynchronously. Poll GET /api/transactions/[transactionId] to check workflowStatus.",
      },
      {
        method: "POST",
        path: "/api/vendor-debit-memos",
        description: "Create a debit memo against a vendor invoice for returns, short-shipments, or price disputes.",
        body: [
          { name: "vendorInvoiceId", type: "string", required: true, desc: "Vendor invoice being disputed" },
          { name: "amount", type: "number", required: true, desc: "Debit memo amount" },
          { name: "reason", type: "string", required: true, desc: "Reason for the debit memo" },
        ],
        response: `{ "id", "memoNumber", "amount", "reason", "status": "ISSUED" }`,
      },
    ],
  },
  {
    id: "products",
    label: "Products & Catalog",
    icon: Package,
    description: "Shared product and service catalog. Items are scoped to Sales, Purchasing, or both and auto-fill line items on all document types.",
    endpoints: [
      {
        method: "GET",
        path: "/api/products",
        description: "List products in the catalog. Supports filtering by type and scope. Passing scope=sales returns only items valid for Sales Orders and Invoices; scope=purchasing returns only items valid for Purchase Orders and Vendor Invoices.",
        params: [
          { name: "scope", type: "string", desc: "sales — usedInSales=true, type≠tax. purchasing — usedInPurchasing=true, type≠tax." },
          { name: "type", type: "string", desc: "service, product, or tax" },
          { name: "active", type: "boolean", desc: "Default true. Pass false to include archived items." },
        ],
        response: `[\n  {\n    "id": "cuid",\n    "code": "SVC-0001",\n    "name": "Cloud Hosting — Monthly",\n    "type": "service",\n    "unitPrice": 500,\n    "taxRate": 8.5,\n    "accountCode": "4000",\n    "usedInSales": true,\n    "usedInPurchasing": false\n  }\n]`,
      },
      {
        method: "POST",
        path: "/api/products",
        description: "Create a product or service. Code must be unique per organization. Use GET /api/products/next-code to auto-generate a code suggestion before submitting.",
        body: [
          { name: "code", type: "string", required: true, desc: "Unique code per org (e.g. SVC-0001). Must be uppercase. Cannot be changed after creation." },
          { name: "name", type: "string", required: true, desc: "Display name shown on line item dropdowns" },
          { name: "type", type: "string", required: true, desc: "service, product, or tax" },
          { name: "description", type: "string", desc: "Optional longer description for the item" },
          { name: "unitPrice", type: "number", desc: "Default line item price (default: 0)" },
          { name: "costPrice", type: "number", desc: "Internal cost price for margin tracking (optional)" },
          { name: "taxRate", type: "number", desc: "Default tax rate percentage (e.g. 8.5 for 8.5%)" },
          { name: "accountCode", type: "string", desc: "Default GL account code applied to every line using this product" },
          { name: "usedInSales", type: "boolean", desc: "Appears in Sales Orders and Customer Invoices (default: true)" },
          { name: "usedInPurchasing", type: "boolean", desc: "Appears in Purchase Orders and Vendor Invoices (default: true)" },
        ],
        response: `{ "id", "code": "SVC-0001", "name", "type", "usedInSales": true, "usedInPurchasing": false }`,
        notes: "Tax items (type=tax) ignore usedInSales and usedInPurchasing — they are excluded from all line item dropdowns.",
      },
      {
        method: "GET",
        path: "/api/products/next-code",
        description: "Returns the next available auto-generated product code based on the selected type and scope. Prefix logic: TAX→TAX, sales service→SVC, sales product→ITEM, purchasing service→EXP, purchasing product→COGS. Used by the product form to pre-fill the code field.",
        params: [
          { name: "type", type: "string", desc: "service, product, or tax — determines the code prefix" },
          { name: "usedInSales", type: "boolean", desc: "true → SVC or ITEM prefix" },
          { name: "usedInPurchasing", type: "boolean", desc: "true → EXP or COGS prefix" },
        ],
        response: `{ "code": "SVC-0003", "prefix": "SVC" }`,
      },
      {
        method: "PUT",
        path: "/api/products/[id]",
        description: "Update a product. Code cannot be changed after creation. All other fields including scope flags, pricing, and GL mapping are editable.",
        body: [
          { name: "name", type: "string", desc: "Updated display name" },
          { name: "description", type: "string", desc: "Updated description" },
          { name: "unitPrice", type: "number", desc: "Updated unit price" },
          { name: "taxRate", type: "number", desc: "Updated default tax rate" },
          { name: "accountCode", type: "string", desc: "Updated default GL account code" },
          { name: "usedInSales", type: "boolean", desc: "Toggle sales scope" },
          { name: "usedInPurchasing", type: "boolean", desc: "Toggle purchasing scope" },
          { name: "isActive", type: "boolean", desc: "Set to false to archive the product" },
        ],
        response: `{ "id", "code", "name", "isActive", "usedInSales", "usedInPurchasing" }`,
      },
      {
        method: "DELETE",
        path: "/api/products/[id]",
        description: "Delete a product. If the product has been referenced on any document (invoice, SO, PO, vendor invoice), it is archived (isActive=false) instead of deleted. The response includes archived: true in that case.",
        response: `{ "deleted": true }\n// or if in use:\n{ "archived": true, "message": "Product archived because it is referenced on existing documents." }`,
      },
    ],
  },
  {
    id: "bank",
    label: "Bank Reconciliation",
    icon: Banknote,
    description: "Import bank statements, run AI-powered matching against open payments, and manage the reconciliation queue.",
    endpoints: [
      {
        method: "GET",
        path: "/api/bank-reconciliation",
        description: "Returns reconciliation summary: KPI counts (unmatched, auto-matched, manually matched), percent reconciled, and the full list of bank transactions with their match status.",
        response: `{\n  "summary": {\n    "unmatched": 14,\n    "autoMatched": 28,\n    "manuallyMatched": 6,\n    "percentReconciled": 71\n  },\n  "transactions": [...]\n}`,
      },
      {
        method: "POST",
        path: "/api/bank-reconciliation/import",
        description: "Import a CSV bank statement. Auto-detects column headers across common bank export formats (date, description, amount, reference, balance, counterparty). Deduplicates rows by date + amount + description hash against previous imports. Accepts multipart/form-data with a file field named file.",
        body: [
          { name: "file", type: "File", required: true, desc: "CSV file via multipart/form-data. Headers auto-detected from first row." },
          { name: "closingBalance", type: "number", desc: "Optional closing balance for verification. Stored on the org for reconciliation tracking." },
        ],
        response: `{ "imported": 42, "skipped": 3, "total": 45 }`,
        notes: "Rows are deduplicated against existing BankTransactions for the org. Skipped rows had already been imported.",
      },
      {
        method: "POST",
        path: "/api/bank-reconciliation/match",
        description: "Run the AI Reconciliation Agent against all unmatched bank transactions. Scores each transaction against open vendor payments (debits) and customer invoice payments (credits) using amount tolerance (±2%), date proximity (±14 days), and description keyword overlap. High-confidence matches (≥0.85) are auto-confirmed; medium-confidence (0.5–0.84) go to the review queue.",
        response: `{\n  "matched": 12,\n  "autoConfirmed": 8,\n  "reviewQueue": 4,\n  "skipped": 30\n}`,
      },
      {
        method: "POST",
        path: "/api/bank-reconciliation/confirm",
        description: "Manually confirm a match from the review queue. Sets matchStatus to matched, records reconciledAt timestamp, and links the bank transaction to the matched payment.",
        body: [
          { name: "bankTransactionId", type: "string", required: true, desc: "ID of the BankTransaction to reconcile" },
          { name: "matchType", type: "string", required: true, desc: "vendor_payment or invoice_payment" },
          { name: "matchedId", type: "string", required: true, desc: "ID of the VendorPayment or Payment being matched" },
        ],
        response: `{ "id", "matchStatus": "matched", "reconciledAt": "2026-05-30T10:00:00.000Z" }`,
      },
    ],
  },
  {
    id: "transactions",
    label: "Transactions & GL",
    icon: BarChart3,
    description: "Unified ledger of all inbound and outbound transactions, journal entries, and GL reports.",
    endpoints: [
      {
        method: "GET",
        path: "/api/transactions",
        description: "List all transactions (inbound Stripe payments and outbound vendor payments) for the organization. Each row includes direction, transactionType, workflow status, audit status, and counterparty. Ordered by creation date descending.",
        params: [
          { name: "direction", type: "string", desc: "inbound or outbound" },
          { name: "status", type: "string", desc: "workflowStatus: pending, running, completed, error, flagged" },
          { name: "limit", type: "number", desc: "Page size (default: 50)" },
          { name: "offset", type: "number", desc: "Pagination offset (default: 0)" },
        ],
        response: `[\n  {\n    "id": "cuid",\n    "amount": 5000,\n    "direction": "inbound",\n    "transactionType": "StripePayment",\n    "workflowStatus": "completed",\n    "auditStatus": "APPROVED",\n    "counterparty": "billing@google.com",\n    "createdAt": "2026-05-30T10:00:00.000Z"\n  }\n]`,
      },
      {
        method: "GET",
        path: "/api/transactions/[id]",
        description: "Get a single transaction with full agent log, journal entry lines, pipeline step details, and linked documents (invoice or vendor invoice).",
        response: `{\n  "id": "cuid",\n  "amount": 5000,\n  "direction": "inbound",\n  "workflowStatus": "completed",\n  "auditStatus": "APPROVED",\n  "agentLogs": [...],\n  "journalEntry": {\n    "id": "cuid",\n    "jeNumber": "JE-00042",\n    "lines": [\n      { "accountCode": "1010", "accountName": "Stripe Clearing", "debit": 4706.51, "credit": 0 },\n      { "accountCode": "5010", "accountName": "Bank Fees", "debit": 293.49, "credit": 0 },\n      { "accountCode": "1200", "accountName": "Accounts Receivable", "debit": 0, "credit": 5000 }\n    ]\n  }\n}`,
      },
      {
        method: "POST",
        path: "/api/transactions/[id]/rerun",
        description: "Re-run the full agent pipeline for a transaction. Idempotency guards prevent duplicate journal entries or duplicate payments from being created on re-runs.",
        response: `{ "workflowStatus": "running" }`,
      },
      {
        method: "GET",
        path: "/api/journal-entries",
        description: "List all journal entries with their lines. Includes both manual entries (status DRAFT or POSTED) and system-generated entries (isSystem: true).",
        params: [
          { name: "status", type: "string", desc: "DRAFT or POSTED" },
          { name: "type", type: "string", desc: "REGULAR, ADJUSTING, CLOSING, REVERSING" },
          { name: "isSystem", type: "boolean", desc: "true to show only auto-generated entries; false to show only manual entries" },
        ],
        response: `[\n  {\n    "id": "cuid",\n    "jeNumber": "JE-00042",\n    "date": "2026-05-30",\n    "type": "REGULAR",\n    "status": "POSTED",\n    "isSystem": true,\n    "lines": [\n      { "accountCode": "1010", "debit": 4706.51, "credit": 0 }\n    ]\n  }\n]`,
      },
      {
        method: "GET",
        path: "/api/reports/general-ledger",
        description: "Returns the General Ledger grouped by account with per-account debit total, credit total, and running balance. Used by the GL report and account detail pages.",
        params: [
          { name: "startDate", type: "string", desc: "ISO date — include entries on or after this date" },
          { name: "endDate", type: "string", desc: "ISO date — include entries on or before this date" },
          { name: "accountCode", type: "string", desc: "Filter to a single account for the account detail view" },
        ],
        response: `[\n  {\n    "accountCode": "1200",\n    "accountName": "Accounts Receivable",\n    "accountType": "Asset",\n    "totalDebit": 25000,\n    "totalCredit": 18000,\n    "balance": 7000,\n    "entries": [...]\n  }\n]`,
      },
      {
        method: "GET",
        path: "/api/chart-of-accounts",
        description: "Returns all accounts in the Chart of Accounts for the organization, including system accounts. System accounts have isSystem: true and cannot be edited or deleted.",
        response: `[\n  {\n    "id": "cuid",\n    "code": "1200",\n    "name": "Accounts Receivable",\n    "type": "Asset",\n    "isSystem": true\n  }\n]`,
      },
      {
        method: "POST",
        path: "/api/chart-of-accounts",
        description: "Create a custom GL account. Code must follow the standard range rules: codes starting with 1=Asset, 2=Liability, 3=Equity, 4=Revenue, 5=Expense. Code cannot be changed after creation.",
        body: [
          { name: "code", type: "string", required: true, desc: "Immutable account code. Must comply with range rules (1xxx=Asset, etc.)." },
          { name: "name", type: "string", required: true, desc: "Account display name" },
          { name: "type", type: "string", required: true, desc: "Asset, Liability, Equity, Revenue, or Expense" },
          { name: "parentCode", type: "string", desc: "Parent account code for sub-account hierarchy" },
        ],
        response: `{ "id", "code", "name", "type", "isSystem": false }`,
      },
    ],
  },
  {
    id: "webhooks",
    label: "Webhooks",
    icon: Webhook,
    description: "Inbound webhook endpoints. Stripe sends payment events here; the route validates signatures and triggers the O2C pipeline.",
    endpoints: [
      {
        method: "POST",
        path: "/api/webhooks/stripe",
        description: "Stripe webhook receiver. Validates the Stripe-Signature header using stripeWebhookSecret from FinancialSettings. Handles three event types: payment_intent.succeeded triggers the full O2C agent pipeline; charge.refunded creates a credit note and GL reversal; payout.paid clears the Stripe Clearing account.",
        auth: false,
        body: [
          { name: "Stripe-Signature", type: "header", required: true, desc: "Webhook signature. Must match stripeWebhookSecret stored in FinancialSettings for the org." },
          { name: "id", type: "string", required: true, desc: "Stripe event ID (evt_...)" },
          { name: "type", type: "string", required: true, desc: "payment_intent.succeeded | charge.refunded | payout.paid" },
          { name: "data.object", type: "object", required: true, desc: "Stripe PaymentIntent, Charge, or Payout object" },
        ],
        response: `{ "received": true }`,
        notes: "Only customer PaymentIntents are processed. Vendor payments do not flow through this endpoint. If the org has no stripeWebhookSecret configured, the signature check is skipped (development only).",
      },
    ],
  },
  {
    id: "admin",
    label: "Admin",
    icon: Shield,
    description: "Administrative and maintenance operations. Restricted to authenticated organization administrators.",
    endpoints: [
      {
        method: "POST",
        path: "/api/admin/backfill-journal-entries",
        description: "Retroactively create system journal entries for all existing records that do not yet have a JE — covers Transactions, Invoices, VendorInvoices, Expenses, and CreditNotes. Fully idempotent: records with existing JEs are skipped. Safe to run multiple times.",
        response: `{ "processed": 47, "skipped": 12, "errors": 0 }`,
      },
      {
        method: "GET",
        path: "/api/admin/seed-demo",
        description: "Seeds the organization with representative demo data for O2C and P2P: sample customers, vendors, products, invoices, purchase orders, vendor invoices, and transactions with agent logs. Only available in non-production environments.",
        response: `{ "seeded": true }`,
        notes: "This endpoint is disabled in production (NODE_ENV=production). It will return 403 if called on a live deployment.",
      },
    ],
  },
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="text-muted-foreground hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

function EndpointCard({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-lg border overflow-hidden">
      <button
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 w-16 text-center", METHOD_CLS[ep.method])}>{ep.method}</span>
        <code className="text-sm font-mono text-foreground flex-1 truncate">{ep.path}</code>
        {ep.auth !== false && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground border rounded px-1.5 py-0.5 flex-shrink-0">
            <Lock className="h-2.5 w-2.5" /> Auth
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t bg-muted/10 px-4 py-4 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>
          {ep.notes && (
            <div className="flex gap-2 rounded-md bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-foreground/80 leading-relaxed"><span className="font-semibold text-amber-700 dark:text-amber-300 mr-1.5">Note:</span>{ep.notes}</p>
            </div>
          )}
          {ep.params && ep.params.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Query Parameters</p>
              <div className="rounded-md border divide-y text-xs overflow-hidden">
                {ep.params.map(p => (
                  <div key={p.name} className="grid grid-cols-[150px_80px_60px_1fr] gap-2 items-start px-3 py-2">
                    <code className="font-mono font-medium text-primary">{p.name}</code>
                    <span className="text-muted-foreground/60 font-mono">{p.type}</span>
                    <span className={p.required ? "text-red-500 text-[10px] font-medium" : "text-muted-foreground/40 text-[10px]"}>{p.required ? "required" : "optional"}</span>
                    <span className="text-muted-foreground">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ep.body && ep.body.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Request Body (JSON)</p>
              <div className="rounded-md border divide-y text-xs overflow-hidden">
                {ep.body.map(p => (
                  <div key={p.name} className="grid grid-cols-[150px_80px_60px_1fr] gap-2 items-start px-3 py-2">
                    <code className="font-mono font-medium text-primary">{p.name}</code>
                    <span className="text-muted-foreground/60 font-mono">{p.type}</span>
                    <span className={p.required ? "text-red-500 text-[10px] font-medium" : "text-muted-foreground/40 text-[10px]"}>{p.required ? "required" : "optional"}</span>
                    <span className="text-muted-foreground">{p.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {ep.response && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Example Response</p>
                <CopyButton text={ep.response} />
              </div>
              <div className="rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300 whitespace-pre overflow-x-auto">{ep.response}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const STATUS_CODES = [
  { code: "200", label: "OK", desc: "Request succeeded. GET and PUT responses." },
  { code: "201", label: "Created", desc: "Resource created. POST responses for new records." },
  { code: "400", label: "Bad Request", desc: "Validation error. The response body includes an error field describing what failed." },
  { code: "401", label: "Unauthorized", desc: "No valid session. Redirect to /login." },
  { code: "403", label: "Forbidden", desc: "Session valid but action not permitted (e.g. editing a system account)." },
  { code: "404", label: "Not Found", desc: "Record does not exist or belongs to a different organization." },
  { code: "409", label: "Conflict", desc: "Duplicate — a record with this unique key already exists (e.g. duplicate product code)." },
  { code: "500", label: "Server Error", desc: "Unexpected server error. Check Vercel runtime logs for the request ID." },
]

export default function ApiDocsPage() {
  const [activeGroup, setActiveGroup] = useState("o2c")

  const group = API_GROUPS.find(g => g.id === activeGroup)!

  return (
    <div className="flex gap-0 animate-fade-in min-h-screen">
      <aside className="hidden lg:flex flex-col w-60 flex-shrink-0 border-r bg-muted/20">
        <div className="sticky top-0">
          <div className="flex items-center gap-2 px-4 py-4 border-b bg-background">
            <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-[13px] font-bold text-foreground tracking-tight">API Reference</p>
              <p className="text-[10px] text-muted-foreground">Base URL: /api</p>
            </div>
          </div>

          <div className="px-3 py-3 border-b">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-1 mb-2">Overview</p>
            {[
              { id: "auth", label: "Authentication" },
              { id: "errors", label: "Errors & Status Codes" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveGroup(item.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-left transition-colors rounded-md relative",
                  activeGroup === item.id
                    ? "text-primary font-semibold bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                {activeGroup === item.id && <span className="absolute left-0 inset-y-1.5 w-[2px] bg-primary rounded-full" />}
                <span className="ml-1 truncate">{item.label}</span>
              </button>
            ))}
          </div>

          <div className="px-3 py-3">
            <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-widest px-1 mb-2">Resources</p>
            {API_GROUPS.map(g => {
              const Icon = g.icon
              const isActive = activeGroup === g.id
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGroup(g.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-[13px] text-left transition-colors rounded-md relative",
                    isActive
                      ? "text-primary font-semibold bg-primary/5"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {isActive && <span className="absolute left-0 inset-y-1.5 w-[2px] bg-primary rounded-full" />}
                  <Icon className={cn("h-3.5 w-3.5 flex-shrink-0 ml-1", isActive ? "text-primary" : "")} />
                  <span className="truncate">{g.label}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60 flex-shrink-0">{g.endpoints.length}</span>
                </button>
              )
            })}
          </div>

          <div className="mt-2 px-4 py-3 border-t">
            <p className="text-[10px] text-muted-foreground/50">Ryzha ERP Platform</p>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="border-b bg-background px-8 py-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <Globe className="h-3 w-3" />
            <span>ryzha.vercel.app</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground font-medium">API Reference</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Ryzha REST API</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Complete REST API reference for all Ryzha modules. All endpoints are session-authenticated and scoped to the authenticated organization. Base URL for all endpoints is <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">/api</code>.
              </p>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 text-xs flex-shrink-0 mt-1">REST • JSON</Badge>
          </div>
          <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> Session Auth (NextAuth)</span>
            <span className="flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5 text-blue-500" /> JSON Request & Response</span>
            <span className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-purple-500" /> Multi-tenant — org-scoped</span>
          </div>
        </div>

        <div className="p-8 max-w-4xl">
          {activeGroup === "auth" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Authentication</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">All Ryzha API routes use NextAuth session-based authentication. Every request must carry a valid session cookie. The API is multi-tenant — every query is automatically scoped to the organization attached to the session.</p>
              </div>

              <Card>
                <CardContent className="pt-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Browser / Client-side</p>
                    <p className="text-sm text-muted-foreground mb-2">Include credentials on every fetch call so the session cookie is sent automatically.</p>
                    <div className="rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300 whitespace-pre overflow-x-auto">{`fetch("/api/customers", {
  credentials: "include"
})`}</div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold mb-1">Server-to-server</p>
                    <p className="text-sm text-muted-foreground mb-2">Pass the NextAuth session token in the Authorization header.</p>
                    <div className="rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300 whitespace-pre overflow-x-auto">{`fetch("https://ryzha.vercel.app/api/customers", {
  headers: {
    "Authorization": "Bearer <session-token>"
  }
})`}</div>
                  </div>
                </CardContent>
              </Card>

              <div className="rounded-lg border bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 px-4 py-3 flex gap-3">
                <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground/80">
                  <span className="font-semibold text-blue-700 dark:text-blue-300 mr-1.5">Multi-tenancy:</span>
                  All data is scoped to <code className="text-xs bg-blue-100 dark:bg-blue-900/40 rounded px-1">session.user.organizationId</code>. You cannot read or write records belonging to another organization, even with a valid session.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Error shape on 401</p>
                <div className="rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300">
                  {`HTTP/1.1 401 Unauthorized\n{ "error": "Unauthorized" }`}
                </div>
              </div>
            </div>
          )}

          {activeGroup === "errors" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-1">Errors & Status Codes</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">All error responses return JSON with an <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">error</code> field describing what went wrong. Validation errors may include a <code className="text-xs bg-muted px-1 py-0.5 rounded font-mono">details</code> array with per-field messages.</p>
              </div>

              <div className="rounded-md bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 px-3 py-3 font-mono text-xs text-zinc-300 whitespace-pre">{`// Error response shape
{
  "error": "code and name are required",
  "details": [
    { "field": "code", "message": "Required" }
  ]
}`}</div>

              <div className="rounded-md border overflow-hidden">
                <div className="grid grid-cols-[80px_120px_1fr] gap-3 px-4 py-2 bg-muted/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b">
                  <span>Status</span>
                  <span>Meaning</span>
                  <span>When it occurs</span>
                </div>
                {STATUS_CODES.map(s => (
                  <div key={s.code} className="grid grid-cols-[80px_120px_1fr] gap-3 px-4 py-3 border-b last:border-0 text-sm items-start">
                    <code className={cn("font-mono font-bold text-xs",
                      s.code.startsWith("2") ? "text-green-600" :
                      s.code.startsWith("4") ? "text-amber-600" : "text-red-600"
                    )}>{s.code}</code>
                    <span className="font-medium text-xs">{s.label}</span>
                    <span className="text-muted-foreground text-xs">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {API_GROUPS.map(g => activeGroup === g.id && (
            <div key={g.id} className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <g.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold">{g.label}</h2>
                  <Badge variant="outline" className="text-xs ml-1">{g.endpoints.length} endpoints</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{g.description}</p>
              </div>

              <div className="space-y-2">
                {g.endpoints.map((ep, i) => (
                  <EndpointCard key={i} ep={ep} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
