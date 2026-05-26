import { prisma } from "@/lib/prisma"
import { startOfMonth } from "date-fns"

export async function releaseDeferredRevenue() {
  const dueRows = await prisma.deferredRevenueSchedule.findMany({
    where: {
      recognized: false,
      period: { lte: startOfMonth(new Date()) }
    }
  })

  for (const row of dueRows) {
    // GL entry: DR Deferred Revenue / CR Service Revenue
    await prisma.generalLedgerEntry.create({
      data: {
        organizationId: row.organizationId,
        date: new Date(),
        accountType: "Liabilities",
        accountName: "Deferred Revenue",
        debit: row.amount,
        credit: 0,
        amount: row.amount,
        description: `Revenue release for transaction ${row.transactionId}`,
        sourceType: "DEFERRED_REVENUE",
        sourceId: row.id,
      }
    })
    
    const entry2 = await prisma.generalLedgerEntry.create({
      data: {
        organizationId: row.organizationId,
        date: new Date(),
        accountType: "Revenue",
        accountName: "Subscription Revenue",
        debit: 0,
        credit: row.amount,
        amount: row.amount,
        description: `Revenue release for transaction ${row.transactionId}`,
        sourceType: "DEFERRED_REVENUE",
        sourceId: row.id,
      }
    })

    await prisma.deferredRevenueSchedule.update({
      where: { id: row.id },
      data: { 
        recognized: true, 
        recognizedAt: new Date(),
        glEntryId: entry2.id
      }
    })
  }

  return { processed: dueRows.length }
}
