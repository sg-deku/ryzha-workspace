import { prisma } from "@/lib/prisma"

export async function syncGLForOrganization(organizationId: string) {
  await syncJournalEntries(organizationId)
}

async function syncJournalEntries(organizationId: string) {
  const entries = await prisma.journalEntry.findMany({
    where: { organizationId, status: "POSTED" },
    include: { lines: true },
  })

  for (const je of entries) {
    for (const line of je.lines) {
      const glSourceId = `${je.id}-${line.id}`
      const existing = await prisma.generalLedgerEntry.findFirst({
        where: { organizationId, sourceType: "JournalEntry", sourceId: glSourceId },
        select: { id: true },
      })
      if (existing) continue

      await prisma.generalLedgerEntry.create({
        data: {
          organizationId,
          sourceType: "JournalEntry",
          sourceId: glSourceId,
          date: je.entryDate,
          accountType: line.accountType,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          amount: line.debit > 0 ? line.debit : -line.credit,
          description: line.description
            ? `[${je.reference || je.id.slice(-6)}] ${line.description}`
            : `[${je.reference || je.id.slice(-6)}] ${je.description}`,
        },
      })
    }
  }
}

export async function deleteGLEntriesForJournalEntry(journalEntryId: string, organizationId: string) {
  await prisma.generalLedgerEntry.deleteMany({
    where: {
      organizationId,
      sourceType: "JournalEntry",
      sourceId: { startsWith: journalEntryId },
    },
  })
}
