# Ryzha Admin Portal

Internal portal for Ryzha founders to manage organisations, users, and platform health.

Runs at **http://localhost:3001** (dev) or **http://localhost:3001** (docker).

---

## Features

### Pending Approvals
- Review new organisation sign-up requests
- Set AI provider, model, and API key per tenant (stored in `FinancialSettings`)
- Configure user quota, API call limits, and AI token limits
- Add internal notes and billing contact
- Approve → triggers welcome email + activates organisation
- Reject → marks organisation as rejected

### Organisations
- View all organisations (active, pending, suspended, rejected)
- Edit organisation name and status
- Delete organisation and all associated data

### Users
- View all users across all tenants
- Suspend or delete individual users

### Audit Logs
- Full audit trail of all admin actions:
  - Organisation created, updated, approved, deleted
  - User invited, suspended, deleted
  - Roles created/updated

---

## Environment Variables

Reads from the root `.env`. Required vars:

```dotenv
DATABASE_URL=...
NEXTAUTH_SECRET=...
BREVO_API_KEY=...       # Brevo REST API key for sending emails
SMTP_FROM=...           # Verified sender email in Brevo
SMTP_FROM_NAME=Ryzha
```

---

## Auth

Admin portal uses NextAuth with Credentials provider. Only users with `isSuperAdmin: true` in the database can log in.

To create a super-admin, seed the database:

```bash
npm run db:seed    # creates admin@ryzha.com / password123
```

Or manually:

```sql
UPDATE "User" SET "isSuperAdmin" = true WHERE email = 'you@example.com';
```

---

## Project Structure

```
apps/admin/
├── app/
│   ├── (admin)/
│   │   ├── pending-approvals/    # Approval queue UI
│   │   ├── organisations/        # Org list + detail
│   │   ├── users/                # Global user management
│   │   └── audit-logs/           # Audit log viewer
│   ├── api/
│   │   ├── pending-approvals/    # GET pending, POST approve/reject
│   │   ├── tenants/[id]/         # PATCH update, DELETE org
│   │   └── users/                # GET all users, PATCH/DELETE user
│   └── login/                    # Admin login page
├── lib/
│   ├── auth.ts                   # NextAuth config (super-admin only)
│   ├── email.ts                  # Brevo REST API email sender
│   └── prisma.ts                 # Prisma client
└── next.config.mjs
```

---

## Email

The admin app sends emails via the Brevo REST API (no SMTP relay). Triggered on:
- **Organisation approved** — welcome email to all org users

Email logic is in `lib/email.ts`. Uses `BREVO_API_KEY` and `SMTP_FROM` from `.env`.
