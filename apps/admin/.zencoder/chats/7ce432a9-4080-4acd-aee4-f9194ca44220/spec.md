# Technical Specification: Licence Configuration Before Approval

## Difficulty Assessment: **Medium**

The core approval and licence-upsert logic already exists. The work is adding a few schema fields, extending the API to accept them, and replacing the inline approval widget with a richer modal-based flow. No new infrastructure, no new routes beyond minor API changes.

---

## Technical Context

| Item | Detail |
|---|---|
| Framework | Next.js 14 (App Router), TypeScript |
| Database | PostgreSQL via Prisma 5 |
| Auth | NextAuth.js — `isSuperAdmin` flag on `User` |
| UI primitives | Radix UI (Dialog, Select, Tabs) + Tailwind CSS |
| State pattern | Local `useState` + `fetch` (no Redux/react-query) |
| Forms | `react-hook-form` + `zod` are installed but the codebase consistently uses plain `useState`; we follow the same pattern |

---

## Current Behaviour

`app/(admin)/pending-approvals/page.tsx` lists `PENDING` organisations.  
`app/(admin)/pending-approvals/approval-actions.tsx` renders an inline row:  
`[Plan dropdown] [Approve] [Reject]`

`POST /api/pending-approvals` receives `{ organizationId, action, defaultPlanId }`.  
On `approve` it:
1. Sets `Organization.status = ACTIVE`, records `approvedAt` / `approvedBy`.
2. Upserts a `License` pre-populated with the plan's `features.maxUsers / maxApiCalls / aiTokens`.

---

## Data Model Changes

### 1. `Organization` — add `adminNotes`

```prisma
model Organization {
  // ... existing fields ...
  adminNotes  String?   // super-admin internal notes about this org
}
```

Rationale: notes describe the organisation itself and should survive licence re-assignments.

### 2. `License` — add `billingContact`

```prisma
model License {
  // ... existing fields ...
  billingContact  String?   // billing contact email/name set at approval time
}
```

Rationale: billing contact is licence/billing-specific. Billing cycle is already captured by `SubscriptionPlan.interval` and does not need a separate override field.

### Migration

```
npx prisma migrate dev --name add_approval_licence_fields
```

Both columns are nullable so the migration is non-breaking.

---

## API Changes

### `POST /api/pending-approvals`

**Extended request body** (action = `"approve"`):

```ts
{
  organizationId: string
  action: "approve" | "reject"
  defaultPlanId: string
  maxUsers?: number          // override plan default
  maxApiCalls?: number       // override plan default
  maxAiTokens?: number       // override plan default
  adminNotes?: string        // saved to Organization.adminNotes
  billingContact?: string    // saved to License.billingContact
}
```

**Changes to the handler**:
- Accept and destructure the five new fields.
- On `approve`: pass `adminNotes` into `tx.organization.update` and pass `billingContact`, `maxUsers`, `maxApiCalls`, `maxAiTokens` overrides into `tx.license.upsert` (overrides take precedence over plan defaults).

No new route files are needed.

---

## UI Changes

### `app/(admin)/pending-approvals/page.tsx`

- Pass `plans` with `features` included so the dialog can pre-populate limit fields when a plan is selected.

```ts
const defaultPlans = await prisma.subscriptionPlan.findMany({
  where: { isActive: true },
  orderBy: { price: "asc" },
  select: { id: true, name: true, features: true },  // add features
})
```

- Update the `Plan` prop type passed to `ApprovalActions`.

### `app/(admin)/pending-approvals/approval-actions.tsx` *(replace)*

Replace the current inline widget with two elements:

1. **`<ConfigureApproveDialog>`** — a modal triggered by an "Approve" button.
2. **`<Button variant="destructive">`** — the Reject button, unchanged behaviour (direct `handleAction("reject")` call).

#### Dialog layout (single-section, matches `create-plan-dialog.tsx` pattern)

```
Dialog Title: "Configure Licence"
─────────────────────────────────
Section: Plan & Limits
  [Plan selector]               ← changing plan auto-fills the three limit inputs
  [Max Users input]
  [Max API Calls / mo input]
  [Max AI Tokens / mo input]

Section: Organisation Notes
  [adminNotes textarea]         ← internal notes, not visible to org users

Section: Billing
  [Billing Contact input]       ← name or email of billing contact
  Billing Cycle: {plan.interval} (read-only, derived from selected plan)

Footer: [Cancel] [Approve Organisation]
─────────────────────────────────
```

Behaviour:
- On plan change: auto-populate `maxUsers`, `maxApiCalls`, `maxAiTokens` from `plan.features`.
- On submit: `POST /api/pending-approvals` with all fields, then `router.refresh()`.

---

## Source Code Files

| File | Change |
|---|---|
| `prisma/schema.prisma` | Add `adminNotes String?` to `Organization`; add `billingContact String?` to `License` |
| `app/api/pending-approvals/route.ts` | Accept new fields, persist `adminNotes` to org, persist `billingContact` + limit overrides to license |
| `app/(admin)/pending-approvals/page.tsx` | Include `features` in plan select query; update `Plan` type passed down |
| `app/(admin)/pending-approvals/approval-actions.tsx` | Replace inline widget with dialog-based configure-and-approve flow + separate reject button |

No new files are required.

---

## Verification

```bash
npx prisma migrate dev --name add_approval_licence_fields
npm run lint
npm run build
```

Manual check:
1. Navigate to `/pending-approvals` as super admin.
2. Click "Approve" → dialog opens with plan pre-selected and limits auto-populated.
3. Edit limits, add notes, add billing contact, submit.
4. Org moves to `ACTIVE`; `License.billingContact` and `Organization.adminNotes` are persisted.
5. Verify in the tenant detail page (`/tenants/[id]`) that the licence limits reflect the configured values.
6. Reject flow is unchanged — no dialog, direct reject.
