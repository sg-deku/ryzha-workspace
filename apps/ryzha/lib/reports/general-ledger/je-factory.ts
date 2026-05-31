import { prisma } from "@/lib/prisma"
import { getAccountTypeForName } from "./account-mapping"
import { getNextEntityNumber } from "@/lib/sequences"

export interface JELine {
  accountName: string
  accountType?: string
  debit: number
  credit: number
  description?: string
}

export interface CreateSystemJEParams {
  organizationId: string
  sourceType: string
  sourceId: string
  reference: string
  description: string
  entryDate: Date
  type?: "REGULAR" | "ADJUSTING" | "CLOSING" | "REVERSING"
  period?: string
  lines: JELine[]
}

export async function createSystemJournalEntry(params: CreateSystemJEParams) {
  const {
    organizationId,
    sourceType,
    sourceId,
    reference,
    description,
    entryDate,
    type = "REGULAR",
    period,
    lines,
  } = params

  const existing = await prisma.journalEntry.findUnique({
    where: {
      organizationId_sourceType_sourceId: { organizationId, sourceType, sourceId },
    },
  })
  if (existing) return existing

  const jeNumber = await getNextEntityNumber(organizationId, "JE")

  const resolvedLines = lines.map((l) => ({
    accountName: l.accountName,
    accountType: l.accountType ?? getAccountTypeForName(l.accountName),
    debit: l.debit,
    credit: l.credit,
    description: l.description ?? null,
  }))

  const je = await prisma.journalEntry.create({
    data: {
      organizationId,
      sourceType,
      sourceId,
      reference: jeNumber,
      description,
      entryDate,
      status: "POSTED",
      type,
      period: period ?? null,
      isSystem: true,
      lines: { create: resolvedLines },
    },
    include: { lines: true },
  })

  await syncJEToGL(je, organizationId)
  return je
}

async function syncJEToGL(
  je: { id: string; entryDate: Date; reference: string | null; description: string; lines: { id: string; accountType: string; accountName: string; debit: number; credit: number; description: string | null }[] },
  organizationId: string
) {
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
        description: line.description ?? `[${je.reference ?? je.id.slice(-6)}] ${je.description}`,
      },
    })
  }
}
