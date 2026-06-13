import { prisma } from "@/lib/prisma"
import { ensureFreshQBToken } from "@/lib/quickbooks-refresh"

export type FinancialRole =
  | "banking"
  | "billing"
  | "payroll"
  | "expenses"
  | "crm"
  | "headcount"
  | "accounting"

export const ROLE_PROVIDERS: Record<FinancialRole, string[]> = {
  accounting: ["QUICKBOOKS", "XERO", "NETSUITE", "SAGE_INTACCT"],
  banking:    ["MERCURY"],
  billing:    ["STRIPE_CONNECT", "CHARGEBEE"],
  payroll:    ["GUSTO", "RIPPLING"],
  expenses:   ["RAMP"],
  crm:        ["SALESFORCE", "HUBSPOT"],
  headcount:  ["RIPPLING"],
}

export interface ResolvedProvider {
  provider: string
  connectionId: string
  accessToken: string
  realmId: string | null
  scope: string | null
}

export async function resolveProviderForRole(
  organizationId: string,
  role: FinancialRole
): Promise<ResolvedProvider | null> {
  const architecture = await prisma.financialArchitecture.findUnique({
    where: { organizationId },
    select: { dataFlowMap: true },
  })

  const dataFlowMap = (architecture?.dataFlowMap as Record<string, string> | null) ?? {}

  const preferredProvider = dataFlowMap[role]?.toUpperCase()

  const candidates = preferredProvider
    ? [preferredProvider, ...ROLE_PROVIDERS[role].filter((p) => p !== preferredProvider)]
    : ROLE_PROVIDERS[role]

  const connections = await prisma.integrationConnection.findMany({
    where: {
      organizationId,
      provider: { in: candidates as any[] },
      status: "ACTIVE",
    },
    select: { id: true, provider: true, accessToken: true, refreshToken: true, expiresAt: true, realmId: true, scope: true },
  })

  if (connections.length === 0) return null

  const ordered = candidates
    .map((c) => connections.find((conn) => conn.provider === c))
    .filter(Boolean) as typeof connections

  const chosen = ordered[0]
  if (!chosen) return null

  let accessToken = chosen.accessToken

  if (chosen.provider === "QUICKBOOKS") {
    accessToken = await ensureFreshQBToken(
      organizationId,
      chosen.id,
      chosen.accessToken,
      chosen.refreshToken ?? null,
      chosen.expiresAt ?? null
    )
  }

  return {
    provider: chosen.provider,
    connectionId: chosen.id,
    accessToken,
    realmId: chosen.realmId ?? null,
    scope: chosen.scope ?? null,
  }
}

export async function resolveAccountingSystem(
  organizationId: string
): Promise<ResolvedProvider | null> {
  return resolveProviderForRole(organizationId, "accounting")
}

export function parseScope(scope: string | null): Record<string, string> {
  if (!scope) return {}
  try { return JSON.parse(scope) } catch { return {} }
}
