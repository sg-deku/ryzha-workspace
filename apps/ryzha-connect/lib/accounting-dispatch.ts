import { prisma } from "@/lib/prisma"
import { pushJournalEntry } from "@ryzha/integrations"
import { resolveAccountingSystem } from "@/lib/role-resolver"
import type { PushJournalEntryInput, PushResult } from "@ryzha/integrations"

export interface DispatchedJournalEntry extends PushJournalEntryInput {
  agentName: string
  financialEventId?: string
}

export interface DispatchResult extends PushResult {
  accountingProvider: string
}

export async function dispatchJournalEntry(
  organizationId: string,
  entry: DispatchedJournalEntry
): Promise<DispatchResult> {
  const acct = await resolveAccountingSystem(organizationId)

  if (!acct) {
    throw new Error("No active accounting system connected (QuickBooks, Xero, NetSuite, etc.)")
  }

  const result = await pushJournalEntry(
    {
      provider: acct.provider as any,
      accessToken: acct.accessToken,
      realmId: acct.realmId,
    },
    {
      organizationId: entry.organizationId,
      date: entry.date,
      description: entry.description,
      reference: entry.reference,
      lines: entry.lines,
    }
  )

  await prisma.integrationSyncLog.create({
    data: {
      integrationConnectionId: acct.connectionId,
      financialEventId: entry.financialEventId ?? null,
      direction: "PUSH",
      entityType: "JOURNAL_ENTRY",
      externalId: result.externalId,
      status: "SUCCESS",
    },
  }).catch(() => {})

  return { ...result, accountingProvider: acct.provider }
}

export async function findCOAAccount(
  organizationId: string,
  accountingConnectionId: string,
  hints: string[],
  accountTypes?: string[]
): Promise<string | null> {
  const mappings = await prisma.cOAMapping.findMany({
    where: { organizationId, integrationConnectionId: accountingConnectionId, isActive: true },
    select: { externalCode: true, externalName: true, accountType: true, ryzhaCategoryHint: true },
  })

  const candidates = accountTypes && accountTypes.length > 0
    ? mappings.filter((m) => accountTypes.some((t) => m.accountType?.toLowerCase() === t.toLowerCase()))
    : mappings

  for (const hint of hints) {
    const match = candidates.find(
      (m) =>
        m.ryzhaCategoryHint?.toLowerCase().includes(hint.toLowerCase()) ||
        m.externalName.toLowerCase().includes(hint.toLowerCase())
    )
    if (match) return match.externalCode
  }

  if (accountTypes && accountTypes.length > 0) {
    for (const hint of hints) {
      const match = mappings.find(
        (m) =>
          m.ryzhaCategoryHint?.toLowerCase().includes(hint.toLowerCase()) ||
          m.externalName.toLowerCase().includes(hint.toLowerCase())
      )
      if (match) return match.externalCode
    }
  }

  return null
}
