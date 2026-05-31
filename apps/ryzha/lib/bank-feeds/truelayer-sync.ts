import { prisma } from "@/lib/prisma"
import { getOrRefreshToken, getTrueLayerTransactions } from "./truelayer-client"

export async function syncTrueLayerAccount(bankAccountId: string): Promise<{
  added: number
  skipped: number
  errors: string[]
}> {
  const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } })
  if (!account || account.connectionType !== "TRUELAYER") throw new Error("Not a TrueLayer account")

  const tlAccountId = account.trueLayerAccountId
  if (!tlAccountId) throw new Error("No TrueLayer account ID stored")

  await prisma.bankAccount.update({ where: { id: bankAccountId }, data: { syncStatus: "SYNCING" } })

  let added = 0
  let skipped = 0
  const errors: string[] = []

  try {
    const accessToken = await getOrRefreshToken(bankAccountId)
    const from = account.lastSyncedAt ?? new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    const to = new Date()

    const transactions = await getTrueLayerTransactions(accessToken, tlAccountId, from, to)

    for (const tx of transactions) {
      try {
        const existing = await prisma.bankTransaction.findFirst({
          where: { organizationId: account.organizationId, bankAccountId, externalId: tx.transaction_id },
          select: { id: true },
        })
        if (existing) { skipped++; continue }

        await prisma.bankTransaction.create({
          data: {
            id: crypto.randomUUID(),
            organizationId: account.organizationId,
            bankAccountId,
            externalId: tx.transaction_id,
            date: new Date(tx.timestamp),
            description: tx.description ?? "TrueLayer transaction",
            amount: Math.abs(tx.amount),
            currency: (tx.currency ?? "GBP").toUpperCase(),
            merchantName: tx.merchant_name ?? null,
            pending: false,
            source: "TRUELAYER",
            matchStatus: "unmatched",
          },
        })
        added++
      } catch (e: any) {
        errors.push(e.message)
      }
    }

    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { syncStatus: "IDLE", lastSyncedAt: new Date(), lastSyncError: null },
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
      provider: "TRUELAYER",
    },
  })

  return { added, skipped, errors }
}
