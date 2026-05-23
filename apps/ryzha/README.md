# Ryzha — Tenant App

AI-powered financial operations dashboard for approved organisations.

Runs at **http://localhost:3000** (dev/docker).

---

## Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives)
- **Auth:** NextAuth.js v4 (Credentials + JWT)
- **Database:** PostgreSQL via Prisma ORM (`@ryzha/database`)
- **Cache/Events:** Redis (ioredis)
- **AI/LLM:** OpenAI-compatible SDK (supports OpenAI, Groq, Anthropic, Ollama)
- **Email:** Brevo REST API
- **Payments:** Stripe
- **PDF Generation:** @react-pdf/renderer

---

## Features

### Onboarding & Auth
- Sign up → organisation details form → pending founder approval
- Login with email + password
- Per-org data isolation (all queries scoped to `organizationId`)

### Dashboard
- Customisable drag-and-drop widget layout (saved per user)
- KPI cards: revenue, expenses, runway, burn rate
- Cash flow forecast (AI-powered, 90-day)
- Real-time P&L widget
- Agent log feed
- Anomaly alerts
- Recent transactions + AI token usage (always shown side-by-side)

### Agent-Based Transaction Workflow
A 4-step sequential AI agent pipeline runs on every financial transaction:

| Step | Agent | Role |
|------|-------|------|
| 1 | **R2R** | Revenue recognition — immediate vs deferred (ASC 606) |
| 2 | **O&M** | Deferred revenue policy application |
| 3 | **Auditor** | SHA-256 hash verification + anomaly detection |
| 4 | **FP&A** | Runway modelling, zero-cash date, CFO narrative |

### Expense Management
- Manual entry and CSV bulk upload
- AI-powered categorisation (uses org's configured AI provider)
- Anomaly detection (duplicates, unusual amounts, weekend spending)

### Invoicing
- Invoice builder with line items
- AI-suggested content
- PDF generation and preview
- Status tracking (Draft → Sent → Paid → Void)

### Purchases (P2P)
- Vendor management
- Purchase orders + vendor invoice matching

### Sales (O2C)
- Customer management
- Sales orders + collections agent (AI dunning messages)

### Tax Compliance
- Multi-jurisdiction tax rule engine
- AI-based tax categorisation
- Tax summary PDF reports

### Settings
- **Team Members** — invite, suspend, remove users; assign roles
- **Roles** — create custom roles with granular permissions
- **Financial Engine** — AI provider, bank balance, monthly burn, revenue rules

---

## Environment Variables

All read from root `.env` via docker-compose or directly in dev:

```dotenv
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
BREVO_API_KEY=xkeysib-...    # Brevo REST API key
SMTP_FROM=...                 # Verified sender email in Brevo
SMTP_FROM_NAME=Ryzha
```

---

## Project Structure

```
apps/ryzha/
├── app/
│   ├── (dashboard)/          # Authenticated app shell
│   │   ├── dashboard/        # Customisable dashboard
│   │   ├── expenses/         # Expense management
│   │   ├── invoices/         # Invoice builder + PDF
│   │   ├── purchases/        # P2P — POs and vendor invoices
│   │   ├── sales/            # O2C — sales orders
│   │   ├── reports/          # Financial reports + AI assistant
│   │   ├── workflow-studio/  # Agent pipeline UI + manual trigger
│   │   └── settings/
│   │       ├── users/        # Team member management
│   │       ├── roles/        # Role + permission management
│   │       └── financial-engine/ # AI config, financial settings
│   ├── (marketing)/
│   │   ├── login/
│   │   └── signup/
│   └── api/                  # Route handlers
│       ├── auth/signup/      # Registration + default role creation
│       ├── users/            # Invite, suspend, remove team members
│       ├── roles/            # Role CRUD
│       ├── transactions/     # Agent workflow trigger
│       ├── expenses/         # CRUD + AI categorisation
│       ├── invoices/         # CRUD + PDF
│       ├── forecast/         # Cash flow forecast
│       ├── dashboard/layout/ # Saved widget layout
│       └── webhooks/         # Stripe + outbound webhooks
├── lib/
│   ├── ai/
│   │   ├── client.ts         # Multi-provider AI client (getAIClientConfig, parseAIJson)
│   │   ├── llm.ts            # callLLM wrapper
│   │   ├── rag.ts            # Retrieval-augmented context
│   │   ├── expense-categorizer.ts
│   │   └── cashflow-forecast.ts
│   ├── agents/
│   │   ├── orchestrator.ts
│   │   ├── r2r.ts
│   │   ├── om.ts
│   │   ├── auditor.ts
│   │   ├── fpna.ts
│   │   ├── p2p/vendor-intake.ts
│   │   └── o2c/
│   ├── email.ts              # Brevo REST API sender
│   ├── permissions.ts        # hasPermission() helper
│   ├── dashboard/widget-config.ts
│   └── auth.ts
└── prisma/
    └── seed.ts               # Super-admin + demo org seed
```

---

## Default Roles

Every new organisation gets these system roles automatically at signup:

| Role | Permissions |
|------|-------------|
| **Admin** | All permissions |
| **Manager** | Invoices, Expenses, Reports, Financial, Agent |
| **Accountant** | Invoices, Expenses, Reports, Financial |
| **Employee** | Expenses, Reports |
| **Viewer** | Reports only |

---

## AI Provider

The AI provider, model, and API key are configured by the Ryzha admin at org approval time. They are stored in `FinancialSettings` per organisation. All AI calls read from there — no global AI key is needed in `.env` for tenant usage.

`lib/ai/client.ts` exports:
- `getAIClientConfig(organizationId)` — returns `{ client, model, provider }`
- `parseAIJson(text)` — strips markdown code fences before `JSON.parse` (handles Groq responses)

---

## Email

Emails are sent via the Brevo REST API. Triggered on:
- **Signup** — thank-you email to new user
- **Team invite** — invitation email with login link

`lib/email.ts` exports `sendEmail()` and `sendSignupThankYouEmail()`.

---

## Database Schema (key models)

| Model | Description |
|-------|-------------|
| `Organization` | Multi-tenant root — status, AI settings, plan |
| `User` | Platform users — email, password, status |
| `UserOrganization` | Org membership — links user ↔ org ↔ role |
| `Role` / `Permission` | RBAC — granular permission system |
| `Invoice` | Draft/Sent/Paid/Void invoices with line items |
| `Expense` | Expenses with AI categorisation |
| `Transaction` | Stripe-linked, enriched by 4-agent pipeline |
| `FinancialSettings` | Per-org AI provider, bank balance, revenue rules |
| `AuditLog` | Immutable log of all create/update/delete actions |
| `DashboardLayout` | Per-user saved widget configuration |
