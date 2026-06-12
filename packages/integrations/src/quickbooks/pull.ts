import { createQBClient, qbQuery } from "./client"
import type { PullARAgingResult, PullBankBalanceResult } from "../types"

export async function pullQBARAging(
  accessToken: string,
  realmId: string
): Promise<PullARAgingResult[]> {
  const client = createQBClient(accessToken, realmId)

  const { data } = await client.get("/reports/AgedReceivables", {
    params: { minorversion: 70 },
  })

  const rows: any[] = data?.Rows?.Row ?? []
  const results: PullARAgingResult[] = []

  for (const row of rows) {
    if (row.type !== "Data") continue
    const cols: any[] = row.ColData ?? []
    results.push({
      customerId: cols[0]?.id ?? "",
      customerName: cols[0]?.value ?? "",
      current: parseFloat(cols[1]?.value ?? "0"),
      days1to30: parseFloat(cols[2]?.value ?? "0"),
      days31to60: parseFloat(cols[3]?.value ?? "0"),
      days61to90: parseFloat(cols[4]?.value ?? "0"),
      over90: parseFloat(cols[5]?.value ?? "0"),
      total: parseFloat(cols[6]?.value ?? "0"),
    })
  }

  return results
}

export async function pullQBAPAging(
  accessToken: string,
  realmId: string
): Promise<PullARAgingResult[]> {
  const client = createQBClient(accessToken, realmId)

  const { data } = await client.get("/reports/AgedPayables", {
    params: { minorversion: 70 },
  })

  const rows: any[] = data?.Rows?.Row ?? []
  const results: PullARAgingResult[] = []

  for (const row of rows) {
    if (row.type !== "Data") continue
    const cols: any[] = row.ColData ?? []
    results.push({
      customerId: cols[0]?.id ?? "",
      customerName: cols[0]?.value ?? "",
      current: parseFloat(cols[1]?.value ?? "0"),
      days1to30: parseFloat(cols[2]?.value ?? "0"),
      days31to60: parseFloat(cols[3]?.value ?? "0"),
      days61to90: parseFloat(cols[4]?.value ?? "0"),
      over90: parseFloat(cols[5]?.value ?? "0"),
      total: parseFloat(cols[6]?.value ?? "0"),
    })
  }

  return results
}

export async function pullQBBankBalances(
  accessToken: string,
  realmId: string
): Promise<PullBankBalanceResult[]> {
  const client = createQBClient(accessToken, realmId)

  const data = await qbQuery<any>(
    client,
    "SELECT Id, Name, CurrentBalance, CurrencyRef FROM Account WHERE AccountType = 'Bank' AND Active = true"
  )

  const accounts: any[] = data?.QueryResponse?.Account ?? []

  return accounts.map((a) => ({
    accountId: a.Id,
    accountName: a.Name,
    balance: a.CurrentBalance ?? 0,
    currency: a.CurrencyRef?.value ?? "USD",
    asOf: new Date(),
  }))
}
