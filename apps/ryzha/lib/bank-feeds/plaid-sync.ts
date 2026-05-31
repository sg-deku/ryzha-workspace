import { prisma } from "@/lib/prisma"
import { syncPlaidTransactions, decryptPlaidToken } from "./plaid-client"

export async function syncPlaidAccount(bankAccountId: string): Promise<{
  added: number
  skipped: number
  errors: string[]
}> {
  const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } })
  if (!account || account.connectionType !== "PLAID") throw new Error("Not a Plaid account")

  const accessToken = decryptPlaidToken(account.plaidAccessToken)
  if (!accessToken) throw new Error("No valid Plaid access token")

  await prisma.bankAccount.update({ where: { id: bankAccountId }, data: { syncStatus: "SYNCING" } })

  let added = 0
  let skipped = 0
  const errors: string[] = []

  try {
    let cursor = account.plaidCursor
    let hasMore = true

    while (hasMore) {
      const sync = await syncPlaidTransactions(accessToken, cursor)
      const transactions: any[] = sync.added ?? []
      hasMore = sync.has_more ?? false
      cursor = sync.next_cursor

      for (const tx of transactions) {
        try {
          const existing = await prisma.bankTransaction.findFirst({
            where: {
              organizationId: account.organizationId,
              bankAccountId,
              externalId: tx.transaction_id,
            },
            select: { id: true },
          })
          if (existing) { skipped++; continue }

          await prisma.bankTransaction.create({
            data: {
              id: crypto.randomUUID(),
              organizationId: account.organizationId,
              bankAccountId,
              externalId: tx.transaction_id,
              date: new Date(tx.date),
              description: tx.name ?? "Plaid transaction",
              amount: Math.abs(tx.amount),
              currency: (tx.iso_currency_code ?? "USD").toUpperCase(),
              merchantName: tx.merchant_name ?? null,
              merchantCategory: tx.personal_finance_category?.primary ?? null,
              pending: tx.pending ?? false,
              source: "PLAID",
              matchStatus: "unmatched",
            },
          })
          added++
        } catch (e: any) {
          errors.push(e.message)
        }
      }
    }

    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { syncStatus: "IDLE", lastSyncedAt: new Date(), plaidCursor: cursor, lastSyncError: null },
    })
  } catch (err: any) {
    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { syncStatus: "ERROR", lastSyncError: err.message },
    })
    throw err
  }

  await prisma.bankFeedSyncLog.create({
    data: {
      id: crypto.randomUUID(),
      organizationId: account.organizationId,
      bankAccountId,
      transactionsAdded: added,
      transactionsSkipped: skipped,
      status: errors.length > 0 ? "PARTIAL" : "SUCCESS",
      errorMessage: errors.length > 0 ? errors.slice(0, 3).join("; ") : null,
      provider: "PLAID",
    },
  })

  return { added, skipped, errors }
}
