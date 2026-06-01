-- CreateTable: Dimension
CREATE TABLE IF NOT EXISTS "Dimension" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dimension_pkey" PRIMARY KEY ("id")
);

-- AlterTable: GeneralLedgerEntry - add dimensionId
ALTER TABLE "GeneralLedgerEntry" ADD COLUMN IF NOT EXISTS "dimensionId" TEXT;

-- AlterTable: JournalEntryLine - add dimensionId
ALTER TABLE "JournalEntryLine" ADD COLUMN IF NOT EXISTS "dimensionId" TEXT;

-- CreateIndex: Dimension
CREATE UNIQUE INDEX IF NOT EXISTS "Dimension_organizationId_type_code_key" ON "Dimension"("organizationId", "type", "code");
CREATE INDEX IF NOT EXISTS "Dimension_organizationId_type_idx" ON "Dimension"("organizationId", "type");
CREATE INDEX IF NOT EXISTS "Dimension_organizationId_isActive_idx" ON "Dimension"("organizationId", "isActive");

-- CreateIndex: GeneralLedgerEntry dimensionId
CREATE INDEX IF NOT EXISTS "GeneralLedgerEntry_dimensionId_idx" ON "GeneralLedgerEntry"("dimensionId");

-- CreateIndex: JournalEntryLine dimensionId
CREATE INDEX IF NOT EXISTS "JournalEntryLine_dimensionId_idx" ON "JournalEntryLine"("dimensionId");

-- AddForeignKey: Dimension → Organization
ALTER TABLE "Dimension" ADD CONSTRAINT "Dimension_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: GeneralLedgerEntry → Dimension
ALTER TABLE "GeneralLedgerEntry" ADD CONSTRAINT "GeneralLedgerEntry_dimensionId_fkey"
    FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: JournalEntryLine → Dimension
ALTER TABLE "JournalEntryLine" ADD CONSTRAINT "JournalEntryLine_dimensionId_fkey"
    FOREIGN KEY ("dimensionId") REFERENCES "Dimension"("id") ON DELETE SET NULL ON UPDATE CASCADE;
