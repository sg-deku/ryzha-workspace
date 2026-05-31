-- Fix 2.2: Drop the bad unique constraint on GeneralLedgerEntry that prevented
-- multiple entries for the same account from the same source (valid in double-entry bookkeeping).
DROP INDEX IF EXISTS "GeneralLedgerEntry_organizationId_sourceId_sourceType_accountName_key";

-- Fix 2.3: Move the SalesOrder→Invoice relationship so Invoice holds the FK.
-- One SalesOrder can now have multiple partial Invoices (correct O2C model).

-- Step 1: Add salesOrderId column to Invoice
ALTER TABLE "Invoice" ADD COLUMN "salesOrderId" TEXT;

-- Step 2: Backfill — for any SalesOrder that had an invoiceId, link that Invoice back
UPDATE "Invoice" i
SET "salesOrderId" = so.id
FROM "SalesOrder" so
WHERE so."invoiceId" = i.id;

-- Step 3: Add FK constraint
ALTER TABLE "Invoice"
  ADD CONSTRAINT "Invoice_salesOrderId_fkey"
  FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Add index on Invoice.salesOrderId
CREATE INDEX IF NOT EXISTS "Invoice_salesOrderId_idx" ON "Invoice"("salesOrderId");

-- Step 5: Drop the old invoiceId column from SalesOrder
ALTER TABLE "SalesOrder" DROP COLUMN IF EXISTS "invoiceId";
