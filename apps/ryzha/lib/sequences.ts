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
  | "PRUN"

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
  PRUN: "prunPrefix",
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
  PRUN: "PRUN",
}

export async function getNextEntityNumber(
  organizationId: string,
  entityType: EntityType
): Promise<string> {
  const [rows, settings] = await Promise.all([
    prisma.$queryRaw<{ last_value: number }[]>`
      INSERT INTO "EntitySequence" ("id", "organizationId", "entityType", "lastValue")
      VALUES (gen_random_uuid()::text, ${organizationId}, ${entityType}, 1)
      ON CONFLICT ("organizationId", "entityType")
      DO UPDATE SET "lastValue" = "EntitySequence"."lastValue" + 1
      RETURNING "lastValue" AS last_value
    `,
    prisma.numberingSettings.findUnique({ where: { organizationId } }),
  ])

  const lastValue = rows[0]?.last_value ?? 1
  const padding = settings?.padding ?? 5
  const prefixField = PREFIX_FIELD[entityType]
  const prefix = settings ? (settings[prefixField] as string) : DEFAULT_PREFIX[entityType]
  const num = String(lastValue).padStart(padding, "0")

  return `${prefix}-${num}`
}
