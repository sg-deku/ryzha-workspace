import { createQBClient, qbQuery } from "./client"
import type { COASyncResult } from "../types"

export async function syncQBChartOfAccounts(
  accessToken: string,
  realmId: string
): Promise<COASyncResult[]> {
  const client = createQBClient(accessToken, realmId)

  const data = await qbQuery<any>(
    client,
    "SELECT Id, Name, AccountType, AccountSubType, Active FROM Account MAXRESULTS 500"
  )

  const accounts: any[] = data?.QueryResponse?.Account ?? []

  return accounts.map((a) => ({
    externalCode: a.Id,
    externalName: a.Name,
    accountType: a.AccountType,
    accountSubType: a.AccountSubType,
    isActive: a.Active ?? true,
  }))
}
