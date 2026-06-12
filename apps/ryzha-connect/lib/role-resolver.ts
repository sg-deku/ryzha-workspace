import { prisma } from "@/lib/prisma"

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
  banking:    ["MERCURY", "BREX", "SVB", "JP_MORGAN"],
  billing:    ["STRIPE_CONNECT", "CHARGEBEE", "PADDLE", "ZUORA"],
  payroll:    ["GUSTO", "RIPPLING", "DEEL", "ADP"],
  expenses:   ["RAMP", "BREX", "DIVVY", "BILL"],
  crm:        ["SALESFORCE", "HUBSPOT"],
  headcount:  ["RIPPLING", "BAMBOOHR", "LATTICE"],
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
    select: { id: true, provider: true, accessToken: true, realmId: true, scope: true },
  })

  if (connections.length === 0) return null

  const ordered = candidates
    .map((c) => connections.find((conn) => conn.provider === c))
    .filter(Boolean) as typeof connections

  const chosen = ordered[0]
  if (!chosen) return null

  return {
    provider: chosen.provider,
    connectionId: chosen.id,
    accessToken: chosen.accessToken,
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
