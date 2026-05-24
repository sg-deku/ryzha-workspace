# Ryzha — Tenant App

AI-powered financial operations dashboard for approved organisations.

Runs at **http://localhost:3000** (dev/docker) · **https://ryzha.vercel.app** (production).

---

## Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Auth:** NextAuth.js v4 (Credentials + JWT)
- **Database:** PostgreSQL via Prisma ORM (`@ryzha/database`)
- **Cache/Events:** Redis (ioredis)
- **AI/LLM:** Multi-provider (Groq, OpenAI, Anthropic, Gemini, Ollama)
- **Email:** Brevo REST API
- **PDF Generation:** @react-pdf/renderer
- **Analytics:** Vercel Analytics

---

## Features

### Onboarding & Auth
- Sign up → organisation details → pending founder approval (no skipping to dashboard)
- Org status read from DB on every request — no stale JWT redirect loops
- Login with email + password; friendly error messages (no raw `CredentialsSignin`)

### Dashboard
- Customisable drag-and-drop widget layout (saved per user in DB)
- **Full/½ width toggle** per widget — consecutive half-width widgets render side-by-side
- **Default layout:** Runway/Burn KPIs → P&L (full) → Cash Flow + Anomaly Alerts → Recent Transactions → Agent Log + AI Usage
- Date range filter on P&L widget

### Navigation — Accounting Sections
Sidebar restructured along accountant-standard workflows:

| Section | Items |
|---------|-------|
| **Accounting** | Transactions (GL) |
| **Order-to-Cash** | Customers → Sales Orders → Invoices → Contracts |
| **Procure-to-Pay** | Vendors → Purchase Orders → Vendor Invoices → Expenses |
| **Reporting** | Reports |
| **Admin** | Settings (permission-gated) |

### Agent-Based Transaction Workflow
A 4-step sequential AI agent pipeline runs on every financial transaction:

| Step | Agent | Role |
|------|-------|------|
| 1 | **R2R** | Revenue recognition — immediate vs deferred (ASC 606) |
| 2 | **O&M** | Deferred revenue policy; respects payment fraction for partial payments |
| 3 | **Auditor** | SHA-256 hash verification + anomaly detection |
| 4 | **FP&A** | Runway modelling, zero-cash date, CFO narrative |

### Payments & Credit Notes (B2B)
Real B2B payment workflows — no Stripe required for AR/AP:

**Accounts Receivable (O2C):**
- **Record Payment** on any invoice — amount, date, method (bank transfer/ACH/wire/cheque), reference number
- Partial payments supported — invoice auto-moves to `PARTIAL` status
- Full payment → invoice auto-moves to `PAID`; confetti fires on first time
- **Issue Credit Note** — reason category, description, optional cash refund method
- AI classifies ASC 606 accounting treatment (revenue reversal vs deferred reversal)
- Revenue reversal GL entries created automatically
- Full payment history + credit note history on invoice detail page

**Accounts Payable (P2P):**
- **Record Vendor Payment** on any vendor invoice — same fields as AR
- GL double-entry posted automatically (DR Accounts Payable / CR Cash)
- Expense record created and linked back
- AI classifies expense category

**Agent pipeline triggered automatically on every payment:**
```
Payment recorded
    → CashApplicationAgent (classifies, links Transaction)
    → R2R → O&M → Auditor → FP&A
    → Notification (success / error)
```

### Expense Management
- Manual entry and CSV bulk upload
- AI-powered categorisation (uses org's configured AI provider)
- Anomaly detection (duplicates, unusual amounts, weekend spending)

### Invoicing
- Invoice builder with line items, tax rates
- AI-suggested content
- PDF generation and preview
- Status tracking: Draft → Sent → **Partial** → Paid → **Refunded** → Void
- Payments Received panel + Credit Notes panel on invoice detail

### Purchases (P2P)
- Vendor management
- Purchase orders + vendor invoice 3-way matching
- Vendor payment recording with GL entries

### Sales (O2C)
- Customer management
- Sales orders + collections agent (AI dunning messages)
- Invoice payment tracking

### Tax Compliance
- Multi-jurisdiction tax rule engine
- AI-based tax categorisation
- Tax summary PDF reports

### Settings
- **Team Members** — invite (email sent via Brevo), suspend, remove users; assign roles
- **Roles** — create custom roles with granular permissions
- **Financial Engine** — bank balance, monthly burn, revenue rules (AI config is admin-only)

---

## Environment Variables

All read from root `.env` via docker-compose or directly in dev:

```dotenv
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
BREVO_API_KEY=xkeysib-...    # Brevo REST API key
SMTP_FROM=...                 # Verified sender email in Brevo
SMTP_FROM_NAME=Ryzha
```

> **AI keys are not needed in `.env`** — they are set by the admin per-tenant at approval time.

---

## Project Structure

```
apps/ryzha/
├── app/
│   ├── (dashboard)/          # Authenticated app shell
│   │   ├── dashboard/        # Customisable dashboard
│   │   ├── expenses/         # Expense management + AI categorisation
│   │   ├── invoices/         # Invoice builder + PDF + payment panels
│   │   ├── contracts/        # Signed contract management
│   │   ├── customers/        # O2C — customer records
│   │   ├── sales-orders/     # O2C — sales orders + pipeline trigger
│   │   ├── vendors/          # P2P — vendor management
│   │   ├── purchases/        # P2P — purchase orders
│   │   ├── vendor-invoices/  # P2P — vendor invoices + payment panel
│   │   ├── transactions/     # GL transaction log
│   │   ├── reports/          # Financial reports + AI assistant
│   │   ├── workflow-studio/  # Agent pipeline UI + manual trigger
│   │   └── settings/
│   │       ├── users/        # Team member management
│   │       ├── roles/        # Role + permission management
│   │       └── financial-engine/ # Bank balance, monthly burn, revenue rules
│   ├── (marketing)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── pending-approval/ # Post-signup waiting page
│   └── api/                  # Route handlers
│       ├── auth/signup/      # Registration + default role creation
│       ├── users/            # Invite, suspend, remove team members
│       ├── roles/            # Role CRUD
│       ├── transactions/     # Agent workflow trigger
│       ├── expenses/         # CRUD + AI categorisation
│       ├── invoices/
│       │   ├── route.ts      # Invoice CRUD
│       │   └── [id]/
│       │       ├── payments/     # Record / list customer payments
│       │       └── credit-notes/ # Issue / list credit notes
│       ├── vendor-invoices/
│       │   └── [id]/
│       │       └── payments/     # Record / list AP payments
│       ├── forecast/         # Cash flow forecast
│       ├── dashboard/layout/ # Saved widget layout
│       └── webhooks/         # Stripe + outbound webhooks
├── lib/
│   ├── ai/
│   │   ├── client.ts         # getAIClientConfig, parseAIJson
│   │   ├── llm.ts            # callLLM wrapper
│   │   ├── rag.ts            # Retrieval-augmented context
│   │   ├── expense-categorizer.ts
│   │   └── cashflow-forecast.ts
│   ├── agents/
│   │   ├── orchestrator.ts   # startAgentWorkflow, startP2PWorkflow, startO2CWorkflow,
│   │   │                     # startCashApplicationWorkflow, startCreditNoteWorkflow,
│   │   │                     # startVendorPaymentWorkflow
│   │   ├── r2r.ts
│   │   ├── om.ts             # ASC 606 — respects paymentFraction
│   │   ├── auditor.ts
│   │   ├── fpna.ts
│   │   ├── o2c/
│   │   │   ├── cash-application.ts  # Links Payment → Transaction → pipeline
│   │   │   ├── credit-note.ts       # Revenue reversal + GL entries
│   │   │   └── collections.ts       # Dunning / AR collections
│   │   └── p2p/
│   │       ├── payment-scheduler.ts # VendorPayment → Expense + GL
│   │       └── matching.ts          # 3-way PO match
│   ├── dashboard/widget-config.ts   # WidgetConfig with halfWidth support
│   ├── email.ts              # Brevo REST API — 4 email templates
│   ├── permissions.ts        # hasPermission() helper
│   └── session.ts            # getSession() — cached per request
└── RUNBOOK.md                # End-to-end operational guide
```

---

## Default Roles

Every new organisation gets these system roles automatically at signup:

| Role | Key Permissions |
|------|----------------|
| **Admin** | All permissions |
| **Manager** | Invoices, Expenses, Reports, Financial, Agent |
| **Accountant** | Invoices, Expenses, Reports, Financial |
| **Employee** | Expenses, Reports |
| **Viewer** | Reports only |

---

## AI Provider

Configured by the Ryzha admin at org approval time. Stored in `FinancialSettings` per org. Tenants cannot change it.

`lib/ai/client.ts` exports:
- `getAIClientConfig(organizationId)` — returns `{ client, model, provider }`
- `parseAIJson(text)` — strips markdown code fences before `JSON.parse`

| Provider | Default Model |
|----------|--------------|
| Groq | `llama-3.3-70b-versatile` |
| OpenAI | `gpt-4o-mini` |
| Anthropic | `claude-3-5-haiku-20241022` |
| Google Gemini | `gemini-1.5-flash` |
| Ollama (local) | `llama3` |

---

## Email

Sent via Brevo REST API. Branded with Ryzha blue header, signed *Karina & Sushmit, Founders at Ryzha*.

| Trigger | Template |
|---------|---------|
| User signs up | Thank-you + "we'll review your application" |
| Org approved | Welcome email to all org users |
| Team member invited | Invitation with login link |
| Admin notified | New org awaiting review |

---

## Database Schema (key models)

| Model | Description |
|-------|-------------|
| `Organization` | Multi-tenant root — status, AI settings, plan |
| `User` | Platform users — email, hashed password, status |
| `UserOrganization` | Org membership — links user ↔ org ↔ role |
| `Role` / `Permission` | RBAC — granular permission system |
| `Invoice` | AR invoices with line items; status: DRAFT/SENT/PARTIAL/PAID/REFUNDED/VOID |
| `Payment` | Customer payments against invoices (multiple per invoice) |
| `CreditNote` | Revenue reversals with GL entries; optional cash refund |
| `Expense` | AP expenses with AI categorisation |
| `VendorInvoice` | AP invoices with 3-way PO matching |
| `VendorPayment` | AP payments with double-entry GL |
| `BankTransaction` | Bank feed records for future auto-matching (Phase 3) |
| `GeneralLedgerEntry` | Double-entry bookkeeping journal |
| `Transaction` | AI pipeline record — Stripe or synthetic; enriched by 4-agent pipeline |
| `Contract` | Signed contracts verified by Auditor agent |
| `FinancialSettings` | Per-org AI provider, bank balance, revenue rules |
| `DashboardLayout` | Per-user saved widget configuration with halfWidth flags |
| `AuditLog` | Immutable log of all create/update/delete actions |
| `AIUsageLog` | Per-org token consumption tracking |
