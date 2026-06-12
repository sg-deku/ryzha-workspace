import axios from "axios"
import type { NormalisedFinancialEvent } from "../types"

const MERCURY_API = "https://api.mercury.com/api/v1"

export async function pullMercuryTransactions(
  apiKey: string,
  options: { daysSince?: number } = {}
): Promise<NormalisedFinancialEvent[]> {
  const { daysSince = 90 } = options
  const start = new Date(Date.now() - daysSince * 86400 * 1000).toISOString().split("T")[0]

  const client = axios.create({
    baseURL: MERCURY_API,
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  const { data: accountsData } = await client.get("/accounts")
  const accounts: any[] = accountsData?.accounts ?? []

  const results: NormalisedFinancialEvent[] = []

  for (const account of accounts) {
    const { data } = await client.get(`/account/${account.id}/transactions`, {
      params: { start, limit: 500 },
    })

    const transactions: any[] = data?.transactions ?? []

    for (const tx of transactions) {
      results.push({
        source: "mercury",
        externalId: tx.id,
        eventType: "BANK_TRANSACTION",
        amount: Math.abs(tx.amount),
        currency: (tx.currencyExponent === 0 ? "USD" : "USD"),
        rawPayload: tx,
        normalisedData: {
          accountId: account.id,
          accountName: account.name,
          direction: tx.bankDescription?.startsWith("Credit") || tx.amount > 0 ? "credit" : "debit",
          description: tx.externalMemo ?? tx.bankDescription ?? null,
          counterpartyName: tx.counterpartyName ?? null,
          counterpartyNickname: tx.counterpartyNickname ?? null,
          postedAt: tx.postedAt ?? null,
          estimatedDeliveryDate: tx.estimatedDeliveryDate ?? null,
          status: tx.status ?? "sent",
        },
      })
    }
  }

  return results
}

export async function pullMercuryBalances(apiKey: string) {
  const client = axios.create({
    baseURL: MERCURY_API,
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  const { data } = await client.get("/accounts")
  const accounts: any[] = data?.accounts ?? []

  return accounts.map((a: any) => ({
    accountId: a.id,
    accountName: a.name,
    balance: a.currentBalance ?? 0,
    currency: "USD",
    asOf: new Date(),
  }))
}
