import { prisma } from "@/lib/prisma"
import { resolveProviderForRole, parseScope, ROLE_PROVIDERS } from "@/lib/role-resolver"
import { pullMercuryTransactions, pullMercuryBalances } from "@ryzha/integrations"

export interface CashAgentResult {
  pulled: number
  matched: number
  unmatched: number
  bankingProvider: string | null
  gaps: { externalId: string; amount: number; description: string; reason: string }[]
}

async function pullBankTransactions(
  provider: string,
  accessToken: string,
  scope: string | null
): Promise<{ source: string; externalId: string; eventType: string; amount: number | null; currency: string; rawPayload: any; normalisedData: any }[]> {
  const scopeData = parseScope(scope)
  const apiKey = scopeData.apiKey ?? accessToken

  switch (provider) {
    case "MERCURY": {
      const txns = await pullMercuryTransactions(apiKey, { daysSince: 30 })
      return txns.map((t) => ({ ...t, amount: t.amount ?? null, currency: t.currency ?? "USD" }))
    }
    default:
      return []
  }
}

export async function runCashAgent(organizationId: string): Promise<CashAgentResult> {
  const result: CashAgentResult = {
    pulled: 0,
    matched: 0,
    unmatched: 0,
    bankingProvider: null,
    gaps: [],
  }

  const bankConn = await resolveProviderForRole(organizationId, "banking")
  if (!bankConn) return result

  result.bankingProvider = bankConn.provider

  const transactions = await pullBankTransactions(
    bankConn.provider,
    bankConn.accessToken,
    bankConn.scope
  )
  result.pulled = transactions.length

  for (const tx of transactions) {
    try {
      await prisma.financialEvent.upsert({
        where: { organizationId_source_externalId: { organizationId, source: tx.source, externalId: tx.externalId } },
        create: {
          organizationId,
          source: tx.source,
          externalId: tx.externalId,
          eventType: tx.eventType as any,
          status: "INGESTED",
          amount: tx.amount ?? null,
          currency: tx.currency ?? "USD",
          rawPayload: tx.rawPayload as any,
          normalisedData: tx.normalisedData as any,
        },
        update: {},
      })

      const direction = (tx.normalisedData as any).direction
      if (direction === "credit") {
        const billingMatch = await prisma.financialEvent.findFirst({
          where: {
            organizationId,
            eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
            amount: { gte: (tx.amount ?? 0) - 1, lte: (tx.amount ?? 0) + 1 },
            status: "POSTED",
          },
        })
        if (billingMatch) {
          result.matched++
        } else {
          result.unmatched++
          result.gaps.push({
            externalId: tx.externalId,
            amount: tx.amount ?? 0,
            description: (tx.normalisedData as any).description ?? "Unknown",
            reason: `No matching billing event (PAYMENT_RECEIVED/INVOICE_PAID) found for this ${bankConn.provider} bank credit`,
          })
        }
      } else {
        result.matched++
      }
    } catch { result.unmatched++ }
  }

  await prisma.integrationSyncLog.create({
    data: {
      integrationConnectionId: bankConn.connectionId,
      direction: "PULL",
      entityType: "BANK_TRANSACTIONS",
      status: "SUCCESS",
      responsePayload: { pulled: result.pulled, matched: result.matched, unmatched: result.unmatched } as any,
    },
  })

  return result
}
