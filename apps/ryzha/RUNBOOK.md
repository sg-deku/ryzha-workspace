# Ryzha — End-to-End Runbook

How to run the full AI agent pipeline in real use cases — from payment recording to financial reporting.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Payment Entry Points                      │
├──────────────────┬──────────────────┬───────────────────────┤
│  Stripe Webhook  │  Record Payment  │  Sales Order (PAID)   │
│  (O2C / AR)      │  on Invoice (AR) │  O2C workflow         │
└────────┬─────────┴────────┬─────────┴────────────┬──────────┘
         │                  │                       │
         ▼                  ▼                       ▼
   Transaction         CashApplication           Orchestrator
   (Stripe ID)         Agent                     (O2C flow)
         │                  │                       │
         └──────────────────┼───────────────────────┘
                            ▼
              Orchestrator — Agent Pipeline
         ┌────────┐  ┌──────┐  ┌─────────┐  ┌───────┐
         │  R2R   │→ │ O&M  │→ │ Auditor │→ │ FP&A  │
         │(Record)│  │(606) │  │(Verify) │  │(Model)│
         └────────┘  └──────┘  └─────────┘  └───────┘
                                                  │
                                         Voice/SMS + Dashboard

┌─────────────────────────────────────────────────────────────┐
│                   AP Entry Points                            │
├──────────────────┬──────────────────────────────────────────┤
│  Record Vendor   │  Vendor Invoice matched to PO            │
│  Payment         │  (P2P workflow)                          │
└────────┬─────────┴───────────────────┬──────────────────────┘
         │                             │
         ▼                             ▼
  PaymentScheduler              Matching Agent
  Agent                         (3-way match)
  (Expense + GL)
```

---

## 1. Prerequisites

### Required Environment Variables

```env
DATABASE_URL=postgresql://...   (or Prisma Postgres URL for production)
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Email — Brevo REST API
BREVO_API_KEY=xkeysib-...
SMTP_FROM=your-verified-email@example.com
SMTP_FROM_NAME=Ryzha

# Stripe (only needed for real payment webhooks)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### AI Provider (set by admin at org approval — not in .env)

| Provider | Default Model |
|----------|--------------|
| Groq | `llama-3.3-70b-versatile` |
| OpenAI | `gpt-4o-mini` |
| Anthropic | `claude-3-5-haiku-20241022` |
| Google Gemini | `gemini-1.5-flash` |
| Ollama | `llama3` |

### Required In-App Settings (after first login)

Go to **Settings → Financial Engine**:

| Field | Suggested Value |
|-------|----------------|
| Bank Balance | Current cash (e.g. `50000`) |
| Avg Monthly Expenses | Monthly burn (e.g. `8000`) |
| Deferral Period | `12` months |
| Target Monthly Revenue | MRR goal |

---

## 2. Accounts Receivable — Record a Customer Payment

This is the primary B2B AR workflow. No Stripe required.

### Step 1: Create an Invoice

```
App → Order-to-Cash → Invoices → New Invoice
Fill in: client name, email, line items, due date
Set status to SENT
```

### Step 2: Record a Payment

```
App → Invoices → [click invoice] → Payments Received → Record Payment

Fields:
  Amount:         1000.00         (can be partial — e.g. 500.00)
  Payment Date:   today
  Method:         Bank Transfer / ACH / Wire / Cheque
  Reference:      CHQ-1234        (optional)
  Notes:          (optional)
```

**What happens automatically:**
1. `Payment` record created in DB
2. `recalculateInvoiceStatus()` — invoice → `PARTIAL` or `PAID`
3. `CashApplicationAgent` fires (async):
   - AI classifies: full / partial / overpayment
   - Revenue type: immediate / deferred (ASC 606)
   - `Transaction` record created with synthetic intent ID `pay-{paymentId}-{timestamp}`
   - `Payment.transactionId` linked back
4. Full agent pipeline: R2R → O&M → Auditor → FP&A
5. Notification: "Payment Applied — $500 applied to Invoice INV-001. Invoice now 50% paid."

### Step 3: Record a Partial Second Payment

Repeat Step 2 with the remaining balance. Invoice auto-moves to `PAID`. Confetti fires on first full payment.

### Step 4: Verify

- **Invoice detail** → Payments Received panel shows both payments
- **Outstanding** shows $0.00
- **Dashboard** → KPI cards update (runway, cash balance)
- **Transactions** → Two new entries (one per payment), both with `workflowStatus: completed`

---

## 3. Accounts Receivable — Issue a Credit Note

Use this when you need to reverse revenue (pricing error, return, goodwill).

### Prerequisites
A payment must exist on the invoice (`totalPaid > 0`).

### Steps

```
App → Invoices → [click invoice] → Credit Notes → Issue Credit Note

Fields:
  Credit Amount:    150.00
  Reason Category:  Pricing Error / Return / Goodwill / Dispute / Duplicate / Other
  Reason:           "Client was overcharged for support tier"
  Refund Method:    (leave blank = credit on account; or select Bank Transfer, etc.)
```

**What happens automatically:**
1. `CreditNote` record created
2. `CreditNoteAgent` fires (async):
   - Validates: credit ≤ total paid
   - AI classifies ASC 606 treatment (immediate reversal vs deferred reversal)
   - Creates negative `Transaction` (`amount = -150.00`)
   - GL entries: DR Revenue / CR Accounts Receivable
   - `recalculateInvoiceStatus()` — invoice status updated
3. Notification: "Credit Note Issued — $150 on Invoice INV-001. Credit applied to account."

---

## 4. Accounts Payable — Record a Vendor Payment

### Step 1: Ensure Vendor Invoice Exists

```
App → Procure-to-Pay → Vendor Invoices → [select invoice]
```

### Step 2: Record Payment

```
Vendor Invoice detail → Payments Made → Record

Fields:
  Amount:     500.00
  Date:       today
  Method:     Bank Transfer
  Reference:  WIRE-567
```

**What happens automatically:**
1. `VendorPayment` record created
2. `recalculateVendorInvoiceStatus()` → `PARTIALLY_PAID` or `PAID`
3. `PaymentSchedulerAgent` fires (async):
   - AI classifies expense category (e.g. "Software & SaaS", "Legal Fees")
   - Detects early payment discount opportunity
   - Creates `Expense` record linked to vendor payment
   - GL double-entry: DR Accounts Payable / CR Cash
4. Notification: "Vendor Payment Recorded — $500 paid to AWS (Invoice VI-001)."

---

## 5. Order-to-Cash Workflow (Sales Order → Invoice → Payment → Pipeline)

```
App → Order-to-Cash → Sales Orders → Create Order
  Customer:     Acme Corp
  Amount:       $5,000
  Status:       INVOICED

→ Mark as Paid (when customer pays in full)
  Status:       PAID
```

**What happens:**
- Orchestrator creates a synthetic `Contract` + `Transaction`
- Full 4-agent pipeline fires: R2R → O&M → Auditor → FP&A
- Alternatively: use "Record Payment" on the linked Invoice (new payment workflow)

---

## 6. Stripe Webhook Trigger (Real Payment)

### Configure Stripe Webhook

```
Stripe Dashboard → Webhooks → Add Endpoint
URL:    https://ryzha.vercel.app/api/webhooks/stripe
Event:  payment_intent.succeeded
```

### Pass Org ID in PaymentIntent Metadata

```javascript
const paymentIntent = await stripe.paymentIntents.create({
  amount: 100000,
  currency: 'usd',
  description: 'Acme Corp — Annual SaaS Subscription',
  metadata: {
    organizationId: 'your-ryzha-org-id',
    customer_email: 'billing@acme.com'
  }
})
```

### Local Testing with Stripe CLI

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe

stripe trigger payment_intent.succeeded \
  --override payment_intent:metadata.organizationId=your-org-id \
  --override payment_intent:amount=100000
```

---

## 7. Manual Trigger (Fastest for Testing / Demo)

```
App → Workflow Studio → Manual Trigger → Stripe Simulation
  Amount:       1000
  Description:  Acme Corp Annual Subscription
```

Creates a mock contract + transaction, fires full pipeline immediately. Watch agent logs update in real time.

---

## 8. What Happens Agent by Agent

| Step | Agent | What it Does | DB Fields Updated |
|------|-------|-------------|-------------------|
| 1 | **R2R** | Extracts customer/product, determines revenue type | `recognizedRevenue`, `revenueRecognitionType` |
| 2 | **O&M** | ASC 606 — immediate vs deferred; uses `paymentFraction` for partials | `deferredRevenue`, `revenueRecognitionType` |
| 3 | **Auditor** | Matches signed contract, SHA-256 hash, anomaly detection | `auditHash`, `auditStatus` |
| 4 | **FP&A** | Runway, zero-cash date, CFO narrative, financial snapshot | `runwayMonths`, `zeroCashDate`, `FinancialSnapshot` |
| — | **CashApp** | Links Payment → Transaction, classifies payment type | `Payment.transactionId` |
| — | **CreditNote** | Revenue reversal, GL entries, optional refund | `CreditNote.transactionId`, GL entries |
| — | **PaymentScheduler** | AP expense + GL double-entry | `VendorPayment.expenseId`, GL entries |

---

## 9. What to Verify After a Run

### Workflow Studio → History
- Status: `completed` (green)
- Expand agent logs — 4 agents complete in sequence

### Dashboard
| Widget | What to Check |
|--------|--------------|
| KPI Cards | Runway/Burn Rate update |
| P&L | Revenue reflected in correct month |
| Agent Log | New entries with all 4 agents |
| Anomaly Alerts | Any flagged transactions |

### Invoices / Transactions
- Invoice: `status = PAID` or `PARTIAL`, payments visible in panel
- Transaction: `workflowStatus = completed`, `auditStatus = verified`, `auditHash` set

### Reports → AI Assistant
```
"Show me runway"
"Cash flow this month"
"Profit and loss Q1"
```

---

## 10. Quick Checklist

```
□ .env configured (DATABASE_URL, NEXTAUTH_SECRET, BREVO_API_KEY)
□ AI provider set by admin in pending-approvals
□ Settings → Financial Engine → General (bank balance, burn rate) saved
□ At least one signed Contract in DB (for Auditor agent)
□ Customer / Vendor records created
□ Invoice created and set to SENT
□ Record Payment → verify agent logs complete
□ Dashboard KPIs reflect updated runway/cash
□ Reports → AI Assistant returns meaningful answers
```

---

## 11. Production Checklist

```
□ Prisma Postgres with pgBouncer enabled (connection pooling)
□ NEXTAUTH_URL set to production domain
□ SMTP_FROM is a verified Brevo sender
□ Vercel environment variables match turbo.json env passthrough list
□ Both apps deployed: ryzha.vercel.app + admin-ryzha.vercel.app
□ Admin account exists (isSuperAdmin = true)
□ Stripe webhook endpoint registered at /api/webhooks/stripe
```
