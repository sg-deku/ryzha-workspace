-- AlterTable: Invoice - add FX fields
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "fxRate" DOUBLE PRECISION;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "totalFunctional" DOUBLE PRECISION;

-- AlterTable: Expense - add FX fields
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "fxRate" DOUBLE PRECISION;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "amountFunctional" DOUBLE PRECISION;

-- CreateTable: ExchangeRate
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'API',
    "rateDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExchangeRate_orgId_from_to_date_key"
    ON "ExchangeRate"("organizationId", "fromCurrency", "toCurrency", "rateDate");
CREATE INDEX IF NOT EXISTS "ExchangeRate_orgId_from_to_idx"
    ON "ExchangeRate"("organizationId", "fromCurrency", "toCurrency");
CREATE INDEX IF NOT EXISTS "ExchangeRate_rateDate_idx" ON "ExchangeRate"("rateDate");

ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: Budget
CREATE TABLE IF NOT EXISTS "Budget" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Budget_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Budget_orgId_year_idx" ON "Budget"("organizationId", "fiscalYear");
CREATE INDEX IF NOT EXISTS "Budget_orgId_status_idx" ON "Budget"("organizationId", "status");

ALTER TABLE "Budget" ADD CONSTRAINT "Budget_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable: BudgetLine
CREATE TABLE IF NOT EXISTS "BudgetLine" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "budgeted" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BudgetLine_budgetId_idx" ON "BudgetLine"("budgetId");
CREATE INDEX IF NOT EXISTS "BudgetLine_budgetId_period_idx" ON "BudgetLine"("budgetId", "periodLabel");
CREATE UNIQUE INDEX IF NOT EXISTS "BudgetLine_budget_account_period_key"
    ON "BudgetLine"("budgetId", "accountName", "periodLabel");

ALTER TABLE "BudgetLine" ADD CONSTRAINT "BudgetLine_budgetId_fkey"
    FOREIGN KEY ("budgetId") REFERENCES "Budget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
