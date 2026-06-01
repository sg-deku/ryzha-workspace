import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const COGS_NAMES = [
  "Cost of Goods Sold",
  "Cost of Revenue",
  "Direct Labor",
  "Cloud Infrastructure (COGS)",
]

const OTHER_INCOME_NAMES = ["FX Gain", "Interest Income"]
const OTHER_EXPENSE_NAMES = ["FX Loss", "Interest Expense", "Foreign Exchange Expense"]

async function main() {
  console.log("Starting COGS account type backfill...")

  const cogsResult = await prisma.$executeRaw`
    UPDATE "GeneralLedgerEntry"
    SET "accountType" = 'COGS'
    WHERE "accountName" = ANY(${COGS_NAMES})
    AND "accountType" = 'Expenses'
  `
  console.log(`GeneralLedgerEntry COGS: ${cogsResult} rows updated`)

  const jeCogsResult = await prisma.$executeRaw`
    UPDATE "JournalEntryLine"
    SET "accountType" = 'COGS'
    WHERE "accountName" = ANY(${COGS_NAMES})
    AND "accountType" = 'Expenses'
  `
  console.log(`JournalEntryLine COGS: ${jeCogsResult} rows updated`)

  const coaCogsResult = await prisma.$executeRaw`
    UPDATE "ChartOfAccounts"
    SET "accountType" = 'COGS'
    WHERE "accountName" = ANY(${COGS_NAMES})
    AND "accountType" = 'Expenses'
  `
  console.log(`ChartOfAccounts COGS: ${coaCogsResult} rows updated`)

  const otherIncomeGL = await prisma.$executeRaw`
    UPDATE "GeneralLedgerEntry"
    SET "accountType" = 'Other Income'
    WHERE "accountName" = ANY(${OTHER_INCOME_NAMES})
    AND "accountType" = 'Expenses'
  `
  console.log(`GeneralLedgerEntry Other Income: ${otherIncomeGL} rows updated`)

  const otherExpenseGL = await prisma.$executeRaw`
    UPDATE "GeneralLedgerEntry"
    SET "accountType" = 'Other Expense'
    WHERE "accountName" = ANY(${OTHER_EXPENSE_NAMES})
    AND "accountType" = 'Expenses'
  `
  console.log(`GeneralLedgerEntry Other Expense: ${otherExpenseGL} rows updated`)

  const otherIncomeCoA = await prisma.$executeRaw`
    UPDATE "ChartOfAccounts"
    SET "accountType" = 'Other Income'
    WHERE "accountName" = ANY(${OTHER_INCOME_NAMES})
  `
  console.log(`ChartOfAccounts Other Income: ${otherIncomeCoA} rows updated`)

  const otherExpenseCoA = await prisma.$executeRaw`
    UPDATE "ChartOfAccounts"
    SET "accountType" = 'Other Expense'
    WHERE "accountName" = ANY(${OTHER_EXPENSE_NAMES})
  `
  console.log(`ChartOfAccounts Other Expense: ${otherExpenseCoA} rows updated`)

  console.log("Backfill complete.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
