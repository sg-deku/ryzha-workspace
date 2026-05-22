# ryzha 🚀

AI-powered financial operations dashboard with agent-based transaction workflows, intelligent expense management, and automated tax compliance.

## Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + Framer Motion
- **Auth:** NextAuth.js v4 (Credentials + JWT)
- **Database:** PostgreSQL via Prisma ORM
- **Cache/Events:** Redis (ioredis)
- **AI/LLM:** OpenAI SDK
- **Payments:** Stripe
- **File Storage:** AWS S3
- **PDF Generation:** @react-pdf/renderer
- **Testing:** Vitest + React Testing Library + Playwright
- **Deploy:** Vercel

## Features

### Agent-Based Transaction Workflow
A 4-step sequential agent pipeline runs on every financial transaction:
1. **R2R Agent** — Revenue Recognition (immediate vs deferred)
2. **O&M Agent** — Operations & Maintenance (deferred revenue policy)
3. **Auditor Agent** — Integrity hash verification + audit logging
4. **FP&A Agent** — Runway modeling, zero-cash date, financial plan scoring

### Smart Expense Management
- CSV upload and parsing
- AI-powered expense categorization (OpenAI)
- Anomaly detection (duplicates, unusual amounts, weekend spending)
- Expense status tracking (Pending → Categorized → Reviewed)

### Invoicing
- Invoice builder with line items
- AI-suggested invoice content
- PDF generation and preview
- Status tracking (Draft → Sent → Paid → Void)

### Tax Compliance
- Multi-jurisdiction tax rule engine
- Nexus detection per country/state
- AI-based tax categorization
- Tax summary PDF reports

### Financial Insights
- KPI cards with sparkline charts
- Real-time activity feed via Redis
- Cash flow forecasting
- Webhook delivery with retry logic

### Multi-Tenant Architecture
- Organization-scoped data isolation
- Role-based access (ADMIN / MEMBER)
- Per-org onboarding flow
- Scheduled report delivery (weekly/monthly)

## Getting Started

```bash
# Clone and install
git clone <repo-url>
cd ryzha
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Database setup
npm run prisma:generate
npm run prisma:migrate

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth session secret |
| `OPENAI_API_KEY` | OpenAI API key for AI features |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `AWS_*` | AWS S3 credentials for file storage |
| `REDIS_URL` | Redis connection URL |
| `TWILIO_*` | Twilio credentials for SMS/voice notifications |

## Scripts

```bash
npm run dev              # Next.js dev server
npm run build            # Production build
npm run start            # Production server
npm run lint             # ESLint
npm test                 # Run Vitest suite
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run Prisma migrations
```

## Project Structure

```
app/
├── (dashboard)/          # Authenticated app shell
│   ├── layout.tsx        # Dashboard layout (auth-guarded)
│   ├── dashboard/        # KPI homepage + transaction feed
│   ├── expenses/         # Expense upload, table, AI actions
│   ├── invoices/         # Invoice builder + PDF preview
│   ├── onboarding/       # Org setup wizard
│   ├── reports/          # Financial reports
│   └── settings/         # Team + app settings
├── (marketing)/          # Public pages
│   ├── login/            # Authentication
│   └── signup/           # Registration
├── api/                  # Route handlers (12 namespaces)
│   ├── transactions/     # Stripe webhook + agent trigger
│   ├── expenses/         # CRUD + AI categorization
│   ├── invoices/         # CRUD + PDF generation
│   ├── tax/              # Tax calculation + Nexus rules
│   ├── reports/          # Scheduled report generation
│   ├── forecast/         # Cash flow forecasting
│   ├── events/           # Redis event stream
│   ├── webhooks/         # Webhook CRUD + delivery
│   ├── onboarding/       # Org onboarding API
│   ├── settings/         # User/org settings
│   ├── activity/         # Activity log
│   └── auth/             # NextAuth callback
├── layout.tsx            # Root layout
└── middleware.ts         # Auth middleware

components/
├── ui/                   # shadcn/ui base components
├── layouts/              # Sidebar, bottom-nav, main-layout
├── dashboard/            # KPI cards, sparklines, audit seal, activity feed
├── expenses/             # Expense table, upload form, AI categorize
├── invoices/             # Invoice builder, PDF preview modal
├── alerts/               # Toast/notification components
└── providers.tsx         # Session + theme providers

lib/
├── agents/               # Agent workflow orchestration
│   ├── orchestrator.ts   # Sequential pipeline runner
│   ├── r2r.ts             # Revenue Recognition Agent
│   ├── om.ts              # O&M (deferred revenue) Agent
│   ├── auditor.ts         # Audit verification Agent
│   └── fpna.ts            # FP&A Agent
├── ai/                   # OpenAI-powered services
│   ├── expense-categorizer.ts
│   ├── anomaly-detector.ts
│   ├── invoice-generator.ts
│   └── cashflow-forecast.ts
├── tax/                  # Tax rules engine + report builder
├── pdf/                  # PDF renderers (invoice, tax, digest)
├── cron/                 # Scheduled jobs (weekly reports)
├── parsers/              # CSV expense import
└── auth.ts               # NextAuth configuration

prisma/
├── schema.prisma         # Full DB schema (9 models + 10 enums)
└── migrations/           # Migration history
```

## Database Schema

| Model | Description |
|---|---|
| `Organization` | Multi-tenant root (plan, settings, onboarded status) |
| `User` | Org members (ADMIN / MEMBER roles) |
| `Invoice` | DRAFT / SENT / PAID / VOID invoices with line items |
| `Expense` | PENDING / CATEGORIZED / REVIEWED expense entries |
| `ExpenseAnomaly` | AI-flagged anomalies (duplicate, unusual, weekend, category) |
| `TaxRule` | Jurisdiction-based tax rates and nexus rules |
| `Transaction` | Stripe-linked transactions enriched by agent workflow |
| `Contract` | Signed/pending Stripe contracts |
| `FinancialSnapshot` | Bank balance, runway, zero-cash date (per org) |
| `Webhook` / `WebhookLog` | Webhook endpoints with retry logging |
| `ReportSchedule` | Automated cash-flow / tax / digest report delivery |

## API Endpoints

### Transactions
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/transactions` | Trigger agent workflow on Stripe payment intent |
| GET | `/api/transactions` | List transactions for org |

### Expenses
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/expenses` | List org expenses |
| POST | `/api/expenses` | Create expense entry |
| POST | `/api/expenses/upload` | Bulk expense CSV import |
| POST | `/api/expenses/[id]/categorize` | AI categorise a single expense |
| POST | `/api/expenses/categorize-all` | AI categorise all uncategorised expenses |

### Invoices
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices` | List org invoices |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/[id]` | Get invoice detail |
| PUT | `/api/invoices/[id]` | Update invoice |
| POST | `/api/invoices/[id]/send` | Mark invoice as sent |
| GET | `/api/invoices/[id]/pdf` | Download invoice PDF |

### Tax
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tax/rules` | List org tax rules |
| POST | `/api/tax/rules` | Create tax rule |
| GET | `/api/tax/calculate` | Calculate tax for a given amount |
| GET | `/api/tax/report` | Generate tax summary report |

### Reports
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/financial` | Financial digest PDF |
| GET | `/api/reports/digest` | Full digest report |

### Events
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/events` | SSE stream of real-time events |

### Webhooks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/webhooks` | List org webhooks |
| POST | `/api/webhooks` | Create webhook endpoint |

### Onboarding
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/onboarding` | Complete org onboarding |

### Settings
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/settings` | Get org/user settings |
| PUT | `/api/settings` | Update org/user settings |

---

*Generated from codebase analysis, May 2026*
