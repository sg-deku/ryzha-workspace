# Ryzha — AI-Powered Financial Operations Platform

A monorepo containing the Ryzha tenant app and the Ryzha admin portal.

---

## Monorepo Structure

```
ryzha-workspace/
├── apps/
│   ├── ryzha/          # Tenant app — financial dashboard for organisations
│   └── admin/          # Admin portal — org approval, user management, audit logs
├── packages/
│   └── database/       # Shared Prisma schema + generated client
├── scripts/            # CLI utilities (db:clear, test:email)
├── docker-compose.yml  # Local development stack
└── .env                # Shared environment variables
```

---

## Prerequisites

- Node.js 20+
- Docker Desktop (for Postgres + Redis)
- npm 11+

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd ryzha-workspace
npm install

# 2. Configure environment
cp .env.example .env   # then edit with your values

# 3. Start infrastructure (Postgres + Redis)
docker compose up -d db redis

# 4. Run DB migrations and seed
npm run db:migrate
npm run db:generate

# 5. Start apps in dev mode
npm run dev            # starts both apps via Turborepo
# or individually:
npm run dev:app        # ryzha tenant app  → http://localhost:3000
npm run dev:admin      # admin portal      → http://localhost:3001
```

---

## Environment Variables

Create a single `.env` file at the repo root. Both apps and docker-compose read from it.

```dotenv
# App
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# PostgreSQL
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/ryzha?schema=public

# NextAuth
NEXTAUTH_SECRET=your-secret-here

# Email — Brevo REST API
# Get API key: https://app.brevo.com/settings/keys/api
# SMTP_FROM must be a verified sender in your Brevo account
BREVO_API_KEY=xkeysib-...
SMTP_FROM=your-verified-email@example.com
SMTP_FROM_NAME=Ryzha

# Stripe (optional for payment webhooks)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

---

## Running with Docker (production-like)

```bash
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Ryzha tenant app | http://localhost:3000 |
| Admin portal | http://localhost:3001 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6379 |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all apps in dev mode (Turborepo) |
| `npm run dev:app` | Start ryzha tenant app only |
| `npm run dev:admin` | Start admin portal only |
| `npm run build` | Build all apps |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:clear` | Wipe all data (preserves super-admins) |

---

## Apps

### `apps/ryzha` — Tenant App

Financial operations dashboard for approved organisations. See [`apps/ryzha/README.md`](apps/ryzha/README.md) for full details.

**Key flows:**
1. Signup → organisation details → pending approval
2. Admin approves → welcome email sent → user can log in
3. Dashboard: KPIs, cash flow forecast, AI agent logs, anomaly alerts
4. Settings: team members, roles, financial engine (AI provider config)

### `apps/admin` — Admin Portal

Internal portal for Ryzha founders. See [`apps/admin/README.md`](apps/admin/README.md) for full details.

**Key flows:**
1. Pending approvals queue — review org details, set AI provider + API key, approve/reject
2. Organisations list — view, suspend, delete organisations
3. Users list — view, suspend, delete users across all tenants
4. Audit logs — track every create/update/delete action across the platform

---

## Packages

### `packages/database`

Shared Prisma schema used by both apps. All schema changes go here.

```bash
cd packages/database
npx prisma migrate dev --name your-migration-name
npm run generate
```

---

## Onboarding Flow

```
User signs up
      ↓
Organisation created (status: PENDING)
      ↓
Admin reviews in admin portal
      ↓
Admin sets AI provider, model, API key → Approves
      ↓
Organisation activated (status: ACTIVE)
      ↓
Welcome email sent to all org users
      ↓
User logs in → Dashboard
```

---

## AI Provider Support

AI features (agent pipeline, expense categorisation, cash flow forecast) use the provider configured by the admin at approval time. Supported providers:

| Provider | Default Model |
|----------|--------------|
| OpenAI | `gpt-4o-mini` |
| Anthropic | `claude-3-5-haiku-20241022` |
| Google Gemini | `gemini-1.5-flash` |
| Groq | `llama-3.3-70b-versatile` |
| Ollama (local) | `llama3` |

The AI client is in `apps/ryzha/lib/ai/client.ts`. Provider settings are stored per-organisation in `FinancialSettings.aiProvider/aiModel/aiApiKey`.
