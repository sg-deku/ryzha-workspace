-- Feature 1: Accounting Periods (Period Close / Fiscal Locking)
CREATE TABLE IF NOT EXISTS "AccountingPeriod" (
  "id"             TEXT         NOT NULL PRIMARY KEY,
  "organizationId" TEXT         NOT NULL,
  "name"           TEXT         NOT NULL,
  "startDate"      TIMESTAMP(3) NOT NULL,
  "endDate"        TIMESTAMP(3) NOT NULL,
  "fiscalYear"     INTEGER      NOT NULL,
  "status"         TEXT         NOT NULL DEFAULT 'OPEN',
  "closedBy"       TEXT,
  "closedAt"       TIMESTAMP(3),
  "notes"          TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "AccountingPeriod"
  ADD CONSTRAINT "AccountingPeriod_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "AccountingPeriod_organizationId_startDate_key"
  ON "AccountingPeriod"("organizationId", "startDate");
CREATE INDEX IF NOT EXISTS "AccountingPeriod_organizationId_status_idx"
  ON "AccountingPeriod"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "AccountingPeriod_organizationId_fiscalYear_idx"
  ON "AccountingPeriod"("organizationId", "fiscalYear");

ALTER TABLE "JournalEntry" ADD COLUMN IF NOT EXISTS "accountingPeriodId" TEXT;
ALTER TABLE "JournalEntry"
  ADD CONSTRAINT "JournalEntry_accountingPeriodId_fkey"
  FOREIGN KEY ("accountingPeriodId") REFERENCES "AccountingPeriod"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "JournalEntry_accountingPeriodId_idx" ON "JournalEntry"("accountingPeriodId");

-- NumberingSettings: add faPrefix column
ALTER TABLE "NumberingSettings" ADD COLUMN IF NOT EXISTS "faPrefix" TEXT NOT NULL DEFAULT 'FA';

-- Feature 4: Fixed Assets & Depreciation
CREATE TABLE IF NOT EXISTS "FixedAsset" (
  "id"                      TEXT         NOT NULL PRIMARY KEY,
  "organizationId"          TEXT         NOT NULL,
  "assetNumber"             TEXT         NOT NULL,
  "name"                    TEXT         NOT NULL,
  "description"             TEXT,
  "category"                TEXT         NOT NULL DEFAULT 'Equipment',
  "acquisitionDate"         TIMESTAMP(3) NOT NULL,
  "acquisitionCost"         DOUBLE PRECISION NOT NULL,
  "salvageValue"            DOUBLE PRECISION NOT NULL DEFAULT 0,
  "usefulLifeMonths"        INTEGER      NOT NULL,
  "depreciationMethod"      TEXT         NOT NULL DEFAULT 'STRAIGHT_LINE',
  "currentBookValue"        DOUBLE PRECISION NOT NULL,
  "accumulatedDepreciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status"                  TEXT         NOT NULL DEFAULT 'ACTIVE',
  "glAssetAccount"          TEXT         NOT NULL DEFAULT 'Fixed Assets',
  "glDepreciationAccount"   TEXT         NOT NULL DEFAULT 'Depreciation Expense',
  "glAccumulatedAccount"    TEXT         NOT NULL DEFAULT 'Accumulated Depreciation',
  "vendorId"                TEXT,
  "purchaseOrderId"         TEXT,
  "disposalDate"            TIMESTAMP(3),
  "disposalProceeds"        DOUBLE PRECISION,
  "disposalNotes"           TEXT,
  "tags"                    JSONB,
  "createdAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"               TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE "FixedAsset"
  ADD CONSTRAINT "FixedAsset_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FixedAsset"
  ADD CONSTRAINT "FixedAsset_vendorId_fkey"
  FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FixedAsset"
  ADD CONSTRAINT "FixedAsset_purchaseOrderId_fkey"
  FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "FixedAsset_organizationId_assetNumber_key"
  ON "FixedAsset"("organizationId", "assetNumber");
CREATE INDEX IF NOT EXISTS "FixedAsset_organizationId_status_idx"
  ON "FixedAsset"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "FixedAsset_organizationId_category_idx"
  ON "FixedAsset"("organizationId", "category");

CREATE TABLE IF NOT EXISTS "DepreciationSchedule" (
  "id"              TEXT         NOT NULL PRIMARY KEY,
  "organizationId"  TEXT         NOT NULL,
  "assetId"         TEXT         NOT NULL,
  "period"          TIMESTAMP(3) NOT NULL,
  "scheduledAmount" DOUBLE PRECISION NOT NULL,
  "actualAmount"    DOUBLE PRECISION,
  "posted"          BOOLEAN      NOT NULL DEFAULT false,
  "postedAt"        TIMESTAMP(3),
  "journalEntryId"  TEXT
);
ALTER TABLE "DepreciationSchedule"
  ADD CONSTRAINT "DepreciationSchedule_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DepreciationSchedule"
  ADD CONSTRAINT "DepreciationSchedule_assetId_fkey"
  FOREIGN KEY ("assetId") REFERENCES "FixedAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "DepreciationSchedule_assetId_period_key"
  ON "DepreciationSchedule"("assetId", "period");
CREATE INDEX IF NOT EXISTS "DepreciationSchedule_organizationId_period_posted_idx"
  ON "DepreciationSchedule"("organizationId", "period", "posted");

-- Feature 9: Bank Feed Integration
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "connectionType"        TEXT      NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "syncStatus"            TEXT      NOT NULL DEFAULT 'IDLE';
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "lastSyncedAt"          TIMESTAMP(3);
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "lastSyncError"         TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "institutionName"       TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "institutionLogo"       TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "plaidItemId"           TEXT UNIQUE;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "plaidAccountId"        TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "plaidAccessToken"      TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "plaidCursor"           TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "trueLayerConnectionId" TEXT UNIQUE;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "trueLayerAccountId"    TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "trueLayerAccessToken"  TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "trueLayerRefreshToken" TEXT;
ALTER TABLE "BankAccount" ADD COLUMN IF NOT EXISTS "trueLayerTokenExpiry"  TIMESTAMP(3);

ALTER TABLE "BankTransaction" ADD COLUMN IF NOT EXISTS "bankAccountId"    TEXT;
ALTER TABLE "BankTransaction" ADD COLUMN IF NOT EXISTS "externalId"       TEXT;
ALTER TABLE "BankTransaction" ADD COLUMN IF NOT EXISTS "merchantName"     TEXT;
ALTER TABLE "BankTransaction" ADD COLUMN IF NOT EXISTS "merchantCategory" TEXT;
ALTER TABLE "BankTransaction" ADD COLUMN IF NOT EXISTS "pending"          BOOLEAN NOT NULL DEFAULT false;
CREATE UNIQUE INDEX IF NOT EXISTS "BankTransaction_org_account_external_key"
  ON "BankTransaction"("organizationId", "bankAccountId", "externalId")
  WHERE "externalId" IS NOT NULL AND "bankAccountId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "BankTransaction_bankAccountId_idx" ON "BankTransaction"("bankAccountId");

CREATE TABLE IF NOT EXISTS "BankFeedSyncLog" (
  "id"                  TEXT         NOT NULL PRIMARY KEY,
  "organizationId"      TEXT         NOT NULL,
  "bankAccountId"       TEXT         NOT NULL,
  "syncedAt"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "transactionsAdded"   INTEGER      NOT NULL DEFAULT 0,
  "transactionsSkipped" INTEGER      NOT NULL DEFAULT 0,
  "status"              TEXT         NOT NULL DEFAULT 'SUCCESS',
  "errorMessage"        TEXT,
  "provider"            TEXT         NOT NULL DEFAULT 'MANUAL'
);
ALTER TABLE "BankFeedSyncLog"
  ADD CONSTRAINT "BankFeedSyncLog_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BankFeedSyncLog"
  ADD CONSTRAINT "BankFeedSyncLog_bankAccountId_fkey"
  FOREIGN KEY ("bankAccountId") REFERENCES "BankAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "BankFeedSyncLog_organizationId_syncedAt_idx"
  ON "BankFeedSyncLog"("organizationId", "syncedAt");
CREATE INDEX IF NOT EXISTS "BankFeedSyncLog_bankAccountId_idx"
  ON "BankFeedSyncLog"("bankAccountId");
