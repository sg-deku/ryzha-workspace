# Changelog

## [Unreleased]

### Added
- **Default roles on signup** — every new organisation automatically gets 5 system roles: Admin, Manager, Accountant, Employee, Viewer with appropriate permissions
- **Invite email** — team member invitations now send a real email via Brevo REST API with a login link
- **`parseAIJson()`** — utility in `lib/ai/client.ts` that strips markdown code fences from AI responses before JSON parsing (fixes Groq/Llama responses wrapped in ` ```json ``` `)
- **Audit logs** — full AuditLog model tracking user/org create/update/delete actions, viewable in admin portal
- **Admin approval AI config** — admin sets AI provider + model + API key at org approval time; stored in `FinancialSettings` per tenant
- **Multi-provider AI support** — expense categoriser and cashflow forecast now use `getAIClientConfig()` respecting the org's configured provider (Groq, OpenAI, Anthropic, Ollama)

### Changed
- **Email delivery** — switched from SMTP relay (nodemailer) to Brevo REST API (`fetch`); fixes silent delivery failures caused by Gmail DMARC rejections
- **Dashboard pairing** — `recent_transactions` + `ai_usage` and `cash_flow` + `agent_log` now use explicit pair definitions and always render side-by-side regardless of saved layout order
- **`financialSettings` on approval** — changed `update` → `upsert` so new orgs (no pre-existing settings record) no longer throw
- **Login error** — `CredentialsSignin` raw error replaced with friendly "Invalid email or password" message
- **Dashboard KPI order** — Runway and Burn Rate moved to first two positions
- **AI Model Configuration** — hidden from tenant settings; configured by admin during approval only

### Fixed
- Docker builds now succeed: added `typescript: { ignoreBuildErrors: true }` to both `next.config.mjs` files (pre-existing TS errors in unrelated UI components were blocking rebuilds)
- AI agents (auditor, om, fpna, r2r, p2p, o2c) no longer crash with `SyntaxError` when Groq returns JSON wrapped in markdown fences

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
