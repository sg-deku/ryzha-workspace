import { pushQBJournalEntry, pushQBBill, pushQBExpense } from "./quickbooks/push"
import type { PushJournalEntryInput, PushResult, IntegrationProvider } from "./types"

export async function pushJournalEntry(
  connection: { provider: IntegrationProvider; accessToken: string; realmId?: string | null },
  entry: PushJournalEntryInput
): Promise<PushResult> {
  switch (connection.provider) {
    case "QUICKBOOKS":
      return pushQBJournalEntry(connection.accessToken, connection.realmId!, entry)
    default:
      throw new Error(`pushJournalEntry: provider ${connection.provider} not yet implemented`)
  }
}

export async function pushBill(
  connection: { provider: IntegrationProvider; accessToken: string; realmId?: string | null },
  bill: {
    vendorId: string
    txnDate: string
    dueDate?: string
    lines: { accountId: string; amount: number; description?: string }[]
  }
): Promise<PushResult> {
  switch (connection.provider) {
    case "QUICKBOOKS":
      return pushQBBill(connection.accessToken, connection.realmId!, bill)
    default:
      throw new Error(`pushBill: provider ${connection.provider} not yet implemented`)
  }
}

export async function pushExpense(
  connection: { provider: IntegrationProvider; accessToken: string; realmId?: string | null },
  expense: {
    paymentAccountId: string
    txnDate: string
    lines: { accountId: string; amount: number; description?: string }[]
  }
): Promise<PushResult> {
  switch (connection.provider) {
    case "QUICKBOOKS":
      return pushQBExpense(connection.accessToken, connection.realmId!, expense)
    default:
      throw new Error(`pushExpense: provider ${connection.provider} not yet implemented`)
  }
}
