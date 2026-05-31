import { prisma } from "@/lib/prisma"

export type EntityType =
  | "CUSTOMER"
  | "VENDOR"
  | "INVOICE"
  | "SO"
  | "PO"
  | "VINV"
  | "EXPENSE"
  | "JE"
  | "TXN"
  | "CONTRACT"
  | "DM"
  | "FA"

const PREFIX_FIELD: Record<EntityType, keyof import("@prisma/client").NumberingSettings> = {
  CUSTOMER: "customerPrefix",
  VENDOR: "vendorPrefix",
  INVOICE: "invoicePrefix",
  SO: "soPrefix",
  PO: "poPrefix",
  VINV: "vinvPrefix",
  EXPENSE: "expensePrefix",
  JE: "jePrefix",
  TXN: "txnPrefix",
  CONTRACT: "contractPrefix",
  DM: "dmPrefix",
  FA: "faPrefix",
}

const DEFAULT_PREFIX: Record<EntityType, string> = {
  CUSTOMER: "CUST",
  VENDOR: "VEN",
  INVOICE: "INV",
  SO: "SO",
  PO: "PO",
  VINV: "VINV",
  EXPENSE: "EXP",
  JE: "JE",
  TXN: "TXN",
  CONTRACT: "CON",
  DM: "DM",
  FA: "FA",
}

export async function getNextEntityNumber(
  organizationId: string,
  entityType: EntityType
): Promise<string> {
  const [seq, settings] = await Promise.all([
    prisma.$transaction(async (tx) => {
      await tx.entitySequence.upsert({
        where: { organizationId_entityType: { organizationId, entityType } },
        create: { organizationId, entityType, lastValue: 1 },
        update: { lastValue: { increment: 1 } },
      })
      return tx.entitySequence.findUnique({
        where: { organizationId_entityType: { organizationId, entityType } },
        select: { lastValue: true },
      })
    }),
    prisma.numberingSettings.findUnique({
      where: { organizationId },
    }),
  ])

  const padding = settings?.padding ?? 5
  const prefixField = PREFIX_FIELD[entityType]
  const prefix = settings ? (settings[prefixField] as string) : DEFAULT_PREFIX[entityType]
  const num = String(seq?.lastValue ?? 1).padStart(padding, "0")

  return `${prefix}-${num}`
}
