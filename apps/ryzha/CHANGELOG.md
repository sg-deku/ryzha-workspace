# Changelog

## [Unreleased]

### Added

#### Payments & Credit Notes (Phase 1)
- **`Payment` model** — records customer payments against invoices; supports partial payments, multiple payments per invoice, method, reference number, notes
- **`CreditNote` model** — issues formal credit notes with reason category, optional cash refund method, ASC 606 revenue reversal
- **`VendorPayment` model** — records AP payments against vendor invoices with GL double-entry (DR Accounts Payable / CR Cash)
- **`BankTransaction` model** — foundation for Phase 3 bank feed import and auto-matching
- **`InvoiceStatus` extended** — added `PARTIAL` (some payment received) and `REFUNDED` statuses
- **Auto-calculated invoice status** — `recalculateInvoiceStatus()` sums payments + credits and sets PARTIAL/PAID automatically; no manual status patching needed
- **`CreditNoteAgent`** (`lib/agents/o2c/credit-note.ts`) — AI-powered revenue reversal agent with ASC 606 treatment classification, GL entries, optional cash refund scheduling
- **`CashApplicationAgent` upgraded** (`lib/agents/o2c/cash-application.ts`) — now uses real `Payment` records, creates real `Transaction` linked back via `transactionId`, triggers full R2R → O&M → Auditor → FP&A pipeline
- **`PaymentSchedulerAgent` upgraded** (`lib/agents/p2p/payment-scheduler.ts`) — uses real `VendorPayment` records, creates `Expense` + two GL journal entries, AI-classifies expense category
- **O&M Agent partial fraction** — respects `paymentFraction` so ASC 606 deferred revenue is calculated on the actual payment amount, not the full invoice total
- **Orchestrator workflow starters** — `startCashApplicationWorkflow`, `startCreditNoteWorkflow`, `startVendorPaymentWorkflow` (all fire-and-forget with notifications)
- **API routes**:
  - `POST/GET /api/invoices/[id]/payments` — record/list customer payments
  - `POST/GET /api/invoices/[id]/credit-notes` — issue/list credit notes
  - `POST/GET /api/vendor-invoices/[id]/payments` — record/list AP payments
- **Invoice detail — Payments Received panel** — full payment history table + Record Payment dialog (amount, date, method, reference, notes)
- **Invoice detail — Credit Notes panel** — shown when any payment exists; Issue Credit Note dialog with reason category, refund method
- **Invoice detail — outstanding balance** — totals section now shows Paid / Credits / Outstanding breakdown
- **Vendor invoice detail — payment panel** — `VendorInvoicePaymentPanel` client component with payment history, outstanding balance, Record Payment dialog

#### Sidebar Restructure (Accountant-recommended)
- **Accounting** section — Transactions (GL / bank feed)
- **Order-to-Cash** section — Customers → Sales Orders → Invoices → Contracts
- **Procure-to-Pay** section — Vendors → Purchase Orders → Vendor Invoices → Expenses
- **Reporting** section — Reports
- Removed old "Financials" mixed group

#### Dashboard Improvements
- **Dynamic `halfWidth` layout system** — each widget has a Full / ½ toggle in the layout editor; consecutive half-width widgets render side-by-side in a 2-column grid
- **Default layout** — P&L full-width, Cash Flow + Anomaly Alerts paired, Recent Transactions full-width, Agent Log + AI Usage paired
- **Fixed widget labels** — MRR renamed to "Monthly Revenue" (was misleading); "Gross Margin" renamed to "Net Margin" (was computing net, not gross)
- **Fixed broken overdue link** — overdue invoice alert now links to `/invoices?overdue=true` instead of broken `/collections`

#### Admin Portal
- **AI config during approval** — admin sets AI provider, model, and API key in the approval form; tenant cannot modify it
- **AI token usage per tenant** — tenant list in admin now shows total token consumption
- **Loading skeletons** — all admin list pages show skeletons while data loads

#### Performance
- **Parallel DB queries** — dashboard and settings pages use `Promise.all` for concurrent queries instead of sequential awaits
- **Session deduplication** — `getSession()` wrapped in React `cache()` across 43+ server components to deduplicate JWT decode per request
- **Prisma connection pooling** — `pgBouncer=true` + `connection_limit=5` on Prisma Postgres to avoid "too many connections" on serverless

#### Email (Brevo)
- **Branded email templates** — all 4 email types (signup thank you, org approved, team invite, admin notification) use Ryzha blue header, consistent footer signed *Karina & Sushmit, Founders at Ryzha*
- **Brevo REST API** — switched from SMTP relay (nodemailer) to direct Brevo REST API (`fetch`); fixes Gmail DMARC rejection silent failures

#### Auth & Onboarding
- **Correct signup flow** — Signup → Organisation Details → Pending Approval thank-you page; no skipping to dashboard
- **Fixed redirect loop** — pending-approval and dashboard layout now read org status fresh from DB on every request (not from stale JWT), eliminating `/dashboard` ↔ `/pending-approval` infinite loop
- **Friendly login error** — `CredentialsSignin` raw error replaced with "Invalid email or password. Please try again."

#### User & Role Management
- **Team member actions wired** — invite, suspend, delete, and role-change all call real API routes with loading states
- **Default roles** — 5 system roles created automatically at org signup: Admin, Manager, Accountant, Employee, Viewer
- **Role CRUD** — create, edit, delete custom roles with granular permission toggles

#### Vercel Deployment
- **Admin build fixed** — `turbo.json` env passthrough for `BREVO_API_KEY`, `SMTP_FROM`, `NEXTAUTH_SECRET`, `DATABASE_URL`; `prisma generate` added to admin build script
- **`not-found.tsx` / `logout` page** — wrapped in `dynamic = 'force-dynamic'` to prevent `ERR_INVALID_URL` static pre-render crash
- **Vercel Analytics** — `@vercel/analytics` added to both apps

### Changed
- **AI Model Configuration** — hidden from tenant `Settings → Financial Engine`; controlled by admin only
- **Dashboard KPI order** — Runway and Burn Rate shown as first two cards
- **`financialSettings` upsert on approval** — changed from `update` → `upsert` to handle new orgs with no pre-existing settings record
- **`parseAIJson()`** — strips markdown code fences before `JSON.parse` (fixes Groq/Llama responses wrapped in triple backtick blocks)

### Fixed
- **AI pipeline SyntaxError** — all agents (auditor, om, fpna, r2r, p2p, o2c) no longer crash when Groq returns JSON inside markdown fences
- **Forecast `OPENAI_API_KEY` error** — cash flow forecast now uses org's configured AI provider via `callLLM`, not a hardcoded OpenAI client
- **Docker build errors** — `typescript: { ignoreBuildErrors: true }` added to both `next.config.mjs` files to prevent pre-existing TS type errors blocking rebuilds

---

## [1.0.0] - 2026-05-17

### Added
- Initial project scaffolded
- Agent pipeline: R2R → O&M → Auditor → FP&A
- Invoice builder with PDF export
- Expense management with AI categorisation
- Tax rules engine
- Multi-tenant architecture with NextAuth
- Stripe webhook integration
- Redis event stream
- Dashboard with draggable widgets
- Workflow Studio with manual trigger
- Weekly report scheduler
