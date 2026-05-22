# Ryzha — End-to-End Runbook

How to run the full AI agent pipeline in a real use case, from Stripe payment to financial report.

---

## Architecture Overview

```
Stripe Payment
     ↓
POST /api/webhooks/stripe
     ↓
Transaction record created
     ↓
Orchestrator (lib/agents/orchestrator.ts)
     ↓
┌────────────┐   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
│ R2R Agent  │ → │  O&M Agent │ → │ Auditor Agent│ → │  FP&A Agent  │
│ (Record)   │   │ (ASC 606)  │   │ (Verify+Hash)│   │ (Runway/CFO) │
└────────────┘   └────────────┘   └──────────────┘   └──────────────┘
                                                              ↓
                                              Voice (ElevenLabs) + SMS (Twilio)
                                                              ↓
                                                    AI Report Assistant
                                               (/reports → AI Assistant tab)
```

---

## 1. Prerequisites

### Required Environment Variables

Add all of these to your `.env` file and `docker-compose.yml`:

```env
# Database & Auth
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ryzha
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Stripe (required for real payment trigger)
STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...        # from Stripe Dashboard → Webhooks

# AI Provider (pick one)
GROQ_API_KEY=gsk_...                   # Free: console.groq.com
OPENAI_API_KEY=sk-...                  # Paid: platform.openai.com
ANTHROPIC_API_KEY=sk-ant-...           # Paid: console.anthropic.com

# Notifications (optional)
ELEVENLABS_API_KEY=...                 # Voice summaries
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

### Required Settings (in-app)

Go to **Settings → Financial Engine** after first login and configure:

| Tab | Field | Value |
|-----|-------|-------|
| General | Bank Balance | Your current balance (e.g. `50000`) |
| General | Avg Monthly Expenses | Your monthly burn (e.g. `8000`) |
| AI Config | AI Provider | `groq` (or `openai`) |
| AI Config | AI Model | `llama-3.3-70b-versatile` (Groq) or `gpt-4o-mini` (OpenAI) |
| AI Config | API Key | Paste your key here |
| Revenue | Deferral Period | `12` months (for annual subscriptions) |
| Audit | Require Audit Seal | `true` |
| FP&A | Target Monthly Revenue | Your MRR goal |
| Voice & SMS | Enable Voice Summary | optional |

---

## 2. Documents / Data to Create Before Running

The agents need these records to work correctly end-to-end:

### A. Signed Contract (required by Auditor Agent)

The Auditor verifies the payment against an existing signed contract. **Without this, audit will fail.**

Create one via the database or via the app:

```sql
INSERT INTO "Contract" (
  "stripePaymentIntentId",
  "customerEmail",
  "amount",
  "status",
  "organizationId"
) VALUES (
  'pi_your_stripe_payment_intent_id',   -- must match the Stripe PaymentIntent ID
  'customer@example.com',
  1000.00,
  'signed',
  'your-org-id'
);
```

> **In production**: Contracts are created when a customer signs up (e.g. via DocuSign/PandaDoc webhook or your CRM). The Stripe `metadata.organizationId` on the PaymentIntent must match your org ID.

### B. Customer Record (required by O2C workflow)

```
App → Customers → Add Customer
Name: Acme Corp
Email: billing@acme.com
Credit Limit: 10000
```

### C. Vendor + Purchase Order (required by P2P workflow)

```
App → Vendors → Add Vendor
Name: AWS
Email: billing@aws.com
Payment Terms: NET30

App → Purchases → Create PO
Vendor: AWS
Amount: 500
```

---

## 3. Triggering from Stripe (Real Payment)

### Step 1: Configure the Stripe Webhook

In your [Stripe Dashboard](https://dashboard.stripe.com/webhooks):

1. Click **Add endpoint**
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select event: `payment_intent.succeeded`
4. Copy the **Signing Secret** → set as `STRIPE_WEBHOOK_SECRET`

### Step 2: Pass Organization ID in PaymentIntent Metadata

When creating a PaymentIntent in your billing system, include your org ID in metadata so Ryzha knows which org to credit:

```javascript
// In your billing backend / Stripe Checkout session
const paymentIntent = await stripe.paymentIntents.create({
  amount: 100000,          // $1,000.00 in cents
  currency: 'usd',
  description: 'Acme Corp — Annual SaaS Subscription',
  receipt_email: 'billing@acme.com',
  metadata: {
    organizationId: 'your-ryzha-org-id',    // ← required
    customer_email: 'billing@acme.com',
    product_description: 'Annual SaaS Subscription'
  }
})
```

> **How to find your org ID**: Settings → Financial Engine → the URL contains `/settings` — or query `SELECT id FROM "Organization" WHERE slug = 'your-slug'`.

### Step 3: Test Locally with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, simulate a payment
stripe trigger payment_intent.succeeded \
  --override payment_intent:metadata.organizationId=your-org-id \
  --override payment_intent:amount=100000 \
  --override payment_intent:description="Acme Corp Annual Subscription"
```

---

## 4. Alternative Triggers (Without Stripe)

### A. Manual Trigger via Workflow Studio (fastest for testing)

```
App → Workflow Studio → Manual Trigger
```

Select **Stripe Simulation** and enter:
- Amount: `1000`
- Description: `Acme Corp Annual Subscription`

This creates a mock contract + transaction and fires the full 4-agent pipeline immediately.

### B. O2C (Order-to-Cash) Trigger

Mark a Sales Order as `PAID` in the app:

```
App → Sales Orders → [select order] → Mark as Paid
```

The orchestrator automatically creates a Transaction and starts the pipeline.

### C. P2P (Procure-to-Pay) Trigger

Create a Vendor Invoice linked to a Purchase Order. When matched, an Expense record is created.

```
App → Vendor Invoices → Create Invoice → Link to PO
```

---

## 5. What Happens (Agent by Agent)

| Step | Agent | What it does | DB field updated |
|------|-------|-------------|-----------------|
| 1 | **R2R** | Reads transaction description, uses AI to extract customer/product type, records revenue | `recognizedRevenue`, `revenueRecognitionType` |
| 2 | **O&M** | Applies ASC 606 rules — decides immediate vs deferred recognition | `deferredRevenue`, `revenueRecognitionType` |
| 3 | **Auditor** | Verifies against signed contract, detects anomalies, generates SHA-256 audit hash | `auditHash`, `auditStatus` = `verified` or `failed` |
| 4 | **FP&A** | Recalculates runway, zero-cash date, CFO narrative, updates financial snapshot | `runwayMonths`, `zeroCashDate`, `FinancialSnapshot` |
| 5 | **Notify** | Sends voice summary (ElevenLabs) + SMS (Twilio) if configured | — |

---

## 6. What to Verify After a Run

### In Workflow Studio

- Go to **Workflow Studio → History**
- Find your execution — status should be `completed` (green)
- Click to expand agent logs — you should see 4 agents complete in sequence

### In Dashboard

| Widget | What to check |
|--------|--------------|
| KPI Cards | MRR, Cash Balance, Runway should update |
| Activity Feed | New transaction entry with agent log |
| Anomaly Alerts | If audit detected anything unusual |

### In Reports → AI Assistant

Ask natural language questions to verify data:

```
"Show me runway"
→ Should reflect new bank balance and burn rate

"Cash flow last month"
→ Should include the new payment as inflow

"Profit and loss this month"
→ Revenue should appear under the correct month
```

### In Transactions

```
App → Transactions → [your transaction]
```

Verify:
- `workflowStatus` = `completed`
- `auditStatus` = `verified`
- `auditHash` is set (SHA-256 string)
- `recognizedRevenue` is set
- `runwayMonths` is updated

---

## 7. Additional Settings to Implement for Production

These are currently missing and should be added before going live:

### A. Stripe Settings Page

Add a settings tab at **Settings → Billing** to configure:

```
STRIPE_SECRET_KEY        — entered by user, stored encrypted
STRIPE_WEBHOOK_SECRET    — auto-generated after webhook registration
STRIPE_PUBLISHABLE_KEY   — for Stripe.js on frontend
```

Currently these are env-only. Moving them to DB settings (like AI keys) would allow multi-org SaaS.

### B. Webhook Outbound Configuration

Go to **Settings → Webhooks → Add Endpoint** to notify your CRM/Slack when:
- `invoice.paid`
- `workflow.completed`
- `audit.failed`

The outbound webhook system (`lib/webhook-delivery.ts`) is already built and retries with exponential backoff.

### C. Notifications (Voice & SMS)

In **Settings → Financial Engine → Voice & SMS**:

| Field | Value |
|-------|-------|
| Enable Voice Summary | `true` |
| ElevenLabs Voice ID | from elevenlabs.io |
| Enable SMS | `true` |
| SMS Recipient Number | `+1234567890` |

Add to `.env`:
```env
ELEVENLABS_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## 8. Other Billing Systems (Non-Stripe)

The system accepts any payment source — just POST to the internal transaction creation pattern:

### Paddle / Chargebee / Recurly

Create a webhook handler at `app/api/webhooks/[provider]/route.ts` that:

1. Validates the webhook signature
2. Extracts amount, description, customer email
3. Creates a `Contract` record if needed
4. Creates a `Transaction` record with `organizationId`
5. Calls `startAgentWorkflow(transaction.id)`

```typescript
// Example skeleton for any provider
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow } from "@/lib/agents/orchestrator"

export async function POST(req: Request) {
  const body = await req.json()
  // validate signature...

  const transaction = await prisma.transaction.create({
    data: {
      stripePaymentIntentId: body.payment_id,   // use provider's ID
      amount: body.amount / 100,
      description: body.description,
      customerEmail: body.customer_email,
      organizationId: body.metadata.organizationId,
      agentLogs: []
    }
  })

  startAgentWorkflow(transaction.id).catch(console.error)
  return Response.json({ received: true })
}
```

---

## 9. Quick Checklist

```
□ .env configured (DATABASE_URL, REDIS_URL, NEXTAUTH_SECRET)
□ AI provider key set (GROQ_API_KEY or OPENAI_API_KEY)
□ Settings → Financial Engine → AI Config saved
□ Settings → Financial Engine → General (bank balance, monthly burn) saved
□ At least one signed Contract exists in DB for the org
□ STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET set
□ Stripe webhook endpoint registered at /api/webhooks/stripe
□ organizationId passed in Stripe PaymentIntent metadata
□ Workflow Studio → Manual Trigger → verify pipeline completes
□ Reports → AI Assistant → "Show me runway" returns data
```
