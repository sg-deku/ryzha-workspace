# Ryzha — User Demo Script

**Duration:** ~25–35 minutes  
**Audience:** Potential customers, investors, design partners  
**Goal:** Show that Ryzha replaces a spreadsheet, a bookkeeper, and a junior CFO — in a single platform with AI doing the work  
**Presenter URLs:**
- Tenant app: https://ryzha.vercel.app
- Admin portal: https://admin-ryzha.vercel.app

---

## Pre-Demo Setup (5 min before)

Run this to ensure clean demo data is in place:

```bash
# Optional: clear and re-seed demo org
cd /path/to/ryzha-workspace
npx tsx scripts/clear-db.ts        # wipe non-admin data
npm run db:seed                    # restore super-admin + demo org
```

Or use the existing demo org if it already has good data.

Confirm these exist in the demo org:
- [ ] At least 1 customer (e.g. "Acme Corp")
- [ ] At least 1 invoice (SENT status, non-zero amount)
- [ ] At least 1 vendor + vendor invoice
- [ ] Financial Engine: bank balance, monthly burn set
- [ ] AI provider configured (Groq — fastest response for demo)

---

## Act 1 — The Problem (2 min)

**Say:**
> "Most startups are running their finances on spreadsheets, emailing their accountant for reports they get three weeks late, and guessing at their runway. Ryzha changes that. It's an AI-powered financial operations platform that handles your accounts receivable, accounts payable, revenue recognition, and financial forecasting — automatically, as things happen."

Open the **Dashboard** at https://ryzha.vercel.app/dashboard.

---

## Act 2 — Dashboard Overview (3 min)

**Show:**
- **Runway** and **Burn Rate** cards (top left — "These update live as money moves in and out")
- **P&L widget** — change the date range filter to "This Month" → "Last Quarter"
- **Cash Flow Forecast** — "AI-generated 12-month projection based on your actual expenses and revenue trajectory"
- **Anomaly Alerts** — "AI watching for unusual spending patterns, duplicate charges, weekend transactions"
- **Agent Log** — "Every time money moves, four AI agents run automatically — here's the live feed"

**Say:**
> "The whole dashboard is customisable — you can drag widgets to any order, toggle any of them to half-width or full-width, and it saves per user."

Click **Customize** button → show the layout editor → toggle one widget to ½ width → drag it → **Save**.

---

## Act 3 — Getting Paid (5 min) — THE CORE DEMO

This is the most important sequence. It shows AI agents running in real time.

### 3a. Open an Invoice

```
Sidebar → Order-to-Cash → Invoices → [click any SENT invoice]
```

**Point out:**
- Status: `SENT` (not yet paid)
- Outstanding balance shown
- "Payments Received" panel — currently empty

### 3b. Record a Partial Payment

Click **Record Payment**:
```
Amount:       [half the invoice total, e.g. 500.00]
Method:       Bank Transfer
Reference:    CHQ-1234
```
Click **Record Payment**.

**Watch live:**
- Toast: "Payment recorded — AI pipeline triggered"
- Invoice status changes to **PARTIAL**
- Payment appears in Payments Received table
- Outstanding balance decreases

**Say:**
> "The moment we record this payment, Ryzha's AI kicks in. It's not just storing a number — it's running four agents in the background."

### 3c. Go Watch the Agents

```
Sidebar → Workflow Studio → History → [click the latest transaction]
```

**Walk through the agent log entries:**

1. **R2R Agent** — "Revenue Recognition. It reads the payment description, figures out whether this is a subscription, a service, a product — and determines whether revenue should be recognised immediately or deferred under ASC 606."

2. **O&M Agent** — "Obligations & Measurement. If revenue should be deferred — like an annual subscription paid upfront — this agent calculates how much to recognize now versus spread over 12 months. It even adjusts for partial payments."

3. **Auditor Agent** — "Forensic audit. Checks for anomalies, verifies the payment against a signed contract, generates a SHA-256 audit hash. If something looks wrong, it flags it before it hits your books."

4. **FP&A Agent** — "Financial Planning & Analysis. Recalculates your runway, projects your zero-cash date, writes a CFO-style narrative about what this payment means for the business."

**Say:**
> "This whole pipeline ran in seconds. No spreadsheet. No manual journal entry. No waiting three weeks for your accountant."

### 3d. Record the Second Payment

Go back to the invoice. Click **Record Payment** for the remaining balance.

Invoice status → **PAID**. (Confetti fires.)

**Say:**
> "Partially paid, then fully paid. Ryzha tracked both, ran the pipeline twice, and the dashboard is already reflecting the updated cash position."

---

## Act 4 — Credit Notes (2 min)

Still on the invoice. Click **Issue Credit Note**:
```
Amount:       [small amount, e.g. 50.00]
Category:     Pricing Error
Reason:       "Incorrect rate applied to support tier"
Refund Method: (leave blank — credit on account)
```

**Say:**
> "In B2B, this happens constantly. A client disputes a line item. You need to formally reverse revenue — not just delete it. Ryzha issues a credit note, reverses the GL entry, and handles the ASC 606 accounting treatment automatically."

---

## Act 5 — Paying Vendors (2 min)

```
Sidebar → Procure-to-Pay → Vendor Invoices → [click any invoice]
```

Click **Record** in the Payments Made panel:
```
Amount:     [invoice amount]
Method:     Bank Transfer
Reference:  WIRE-001
```

**Say:**
> "Same concept on the AP side. We record the vendor payment, and Ryzha creates the double-entry GL entry — debit Accounts Payable, credit Cash — automatically. The expense is linked, the vendor invoice is marked paid, the books are clean."

---

## Act 6 — Financial Intelligence (3 min)

### Reports → AI Assistant

```
Sidebar → Reporting → Reports → AI Assistant tab
```

Ask out loud:
- *"What is our runway?"*
- *"How does this month's revenue compare to last month?"*
- *"What are our biggest expense categories?"*
- *"If we cut software expenses by 20%, how does that change our runway?"*

**Say:**
> "This is your CFO on demand. It has context on your actual financial data — invoices, expenses, transactions, runway — not just generic answers."

---

## Act 7 — The Admin Side (2 min)

Switch to https://admin-ryzha.vercel.app (open in new tab).

Log in as Ryzha admin.

**Show:**
- **Pending Approvals** — "Every new company that signs up goes here. We review them, set their AI model and API key, then approve. They get a welcome email."
- **Tenants list** — "See all organisations, their plan, status, token usage"
- **Audit Logs** — "Everything we do is logged — who approved what, when users were suspended, when orgs were modified"

**Say:**
> "This is how Karina and I control who's on the platform. Every tenant gets their own AI configuration. We decide what model they run on — they never see the keys."

---

## Act 8 — Customisation & Team (2 min)

Back in the tenant app:

```
Sidebar → Settings → Team Members
```
- Show invite flow (enters email → sends real Brevo email)
- Show role list: Admin, Manager, Accountant, Employee, Viewer

```
Settings → Roles
```
- Show granular permission toggles per role

**Say:**
> "Roles and permissions are fully configurable. A junior employee can add expenses. An accountant can view reports. A manager can approve invoices. Nobody can accidentally touch something they shouldn't."

---

## Act 9 — The Ask / Close (2 min)

**Say:**
> "Ryzha is built for B2B startups and SMEs who are outgrowing spreadsheets but can't afford a full finance team. We handle revenue recognition, AP/AR, GL bookkeeping, financial forecasting, and audit compliance — all with AI, all in real time."
>
> "We're currently onboarding our first design partners. If your finance workflow is still in Excel, we'd love to show you what this looks like with your actual numbers."

---

## FAQ — Likely Questions

| Question | Answer |
|----------|--------|
| **What accounting standards does it follow?** | ASC 606 for revenue recognition, double-entry bookkeeping for GL, GAAP-compatible expense categorisation |
| **Does it replace our accountant?** | It replaces the manual data entry and reporting layer. Your accountant reviews AI-prepared books instead of building them |
| **What AI model does it use?** | Configurable per tenant — Groq (Llama 3.3), OpenAI, Anthropic, Gemini. We recommend Groq for speed and cost |
| **Is data isolated between tenants?** | Yes — every query is scoped by `organizationId`. No cross-tenant data access is possible |
| **What about Stripe / our billing system?** | Stripe webhook integration is built in. Any other provider just needs a webhook handler — the agent pipeline is provider-agnostic |
| **How do credit notes work with tax?** | Credit notes reverse the original revenue and tax GL entries. Tax reporting reflects the net position |
| **What's the pricing?** | [Answer with your current pricing model] |

---

## Demo Data Reference

Use this data when creating records during the demo:

**Customer:** Acme Corp · billing@acme.com  
**Invoice:** INV-DEMO-001 · $2,000 · Annual SaaS License  
**Vendor:** AWS · billing@aws.com  
**Vendor Invoice:** AWS-MARCH · $450 · Cloud infrastructure  
**Payment method for demo:** Bank Transfer  
**Reference numbers:** CHQ-1234 (AR) · WIRE-001 (AP)

---

## Fallback — If Live Data Fails

Use Workflow Studio manual trigger as a safe fallback to show the agent pipeline:

```
Workflow Studio → Manual Trigger → Stripe Simulation
Amount: 2000
Description: Acme Corp Annual SaaS License
```

This always works regardless of invoice/payment data state.
