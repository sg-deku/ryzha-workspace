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
      await prisma.generalLedgerEntry.upsert({
        where: {
          org_source_account: {
            organizationId,
            sourceId: `${je.id}-${line.id}`,
            sourceType: "JournalEntry",
            accountName: line.accountName,
          },
        },
        update: {
          date: je.entryDate,
          debit: line.debit,
          credit: line.credit,
          amount: line.debit > 0 ? line.debit : -line.credit,
          description: line.description
            ? `[${je.reference || je.id.slice(-6)}] ${line.description}`
            : `[${je.reference || je.id.slice(-6)}] ${je.description}`,
          accountType: line.accountType,
        },
        create: {
          organizationId,
          sourceType: "JournalEntry",
          sourceId: `${je.id}-${line.id}`,
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
