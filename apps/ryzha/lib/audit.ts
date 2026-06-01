import { prisma } from "@/lib/prisma"

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "STATUS_CHANGE"
  | "POST"
  | "REVERSE"
  | "APPROVE"
  | "REJECT"
  | "VOID"
  | "PERIOD_CLOSE"
  | "PERIOD_REOPEN"
  | "PAYMENT_RECORDED"
  | "INVITE_USER"

export type AuditEntityType =
  | "Invoice"
  | "VendorInvoice"
  | "JournalEntry"
  | "PurchaseOrder"
  | "SalesOrder"
  | "Payment"
  | "VendorPayment"
  | "Customer"
  | "Vendor"
  | "ChartOfAccounts"
  | "AccountingPeriod"
  | "PaymentRun"
  | "Expense"
  | "FixedAsset"
  | "USER"
  | "ORGANIZATION"

const SENSITIVE_FIELDS = new Set([
  "bankIban",
  "bankBic",
  "bankRoutingNumber",
  "bankAccountNumber",
  "bankSortCode",
  "password",
  "apiKey",
  "aiApiKey",
  "stripeSecretKey",
  "stripeWebhookSecret",
  "twilioAuthToken",
  "smtpPass",
  "elevenLabsApiKey",
  "plaidAccessToken",
  "trueLayerAccessToken",
  "trueLayerRefreshToken",
])

function redact(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    out[k] = SENSITIVE_FIELDS.has(k) ? "[REDACTED]" : v
  }
  return out
}

export function diffFields(
  before: Record<string, any>,
  after: Record<string, any>
): string[] {
  const changed: string[] = []
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)])
  for (const key of allKeys) {
    const bv = before[key]
    const av = after[key]
    if (JSON.stringify(bv) !== JSON.stringify(av)) {
      changed.push(key)
    }
  }
  return changed
}

export interface WriteAuditParams {
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  actorId?: string | null
  actorEmail?: string | null
  organizationId?: string | null
  before?: Record<string, any> | null
  after?: Record<string, any> | null
  details?: Record<string, any> | null
  ipAddress?: string | null
}

export async function writeAudit(params: WriteAuditParams): Promise<void> {
  try {
    const before = params.before ? redact(params.before) : null
    const after = params.after ? redact(params.after) : null
    const changedFields =
      before && after ? diffFields(before, after) : []

    await prisma.auditLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        actorId: params.actorId ?? null,
        actorEmail: params.actorEmail ?? null,
        organizationId: params.organizationId ?? null,
        before: before ?? undefined,
        after: after ?? undefined,
        changedFields,
        details: params.details ?? undefined,
        ipAddress: params.ipAddress ?? null,
      },
    })
  } catch (err) {
    console.error("[audit] Failed to write audit log:", err)
  }
}

export function getClientIp(req: Request): string | null {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    null
  )
}
