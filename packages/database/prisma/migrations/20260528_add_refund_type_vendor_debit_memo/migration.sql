-- Add refundType to CreditNote
ALTER TABLE "CreditNote" ADD COLUMN IF NOT EXISTS "refundType" TEXT NOT NULL DEFAULT 'credit_memo';

-- Create VendorDebitMemo table
CREATE TABLE IF NOT EXISTS "VendorDebitMemo" (
    "id" TEXT NOT NULL,
    "memoNumber" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "vendorInvoiceId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "reasonCategory" TEXT NOT NULL DEFAULT 'other',
    "debitType" TEXT NOT NULL DEFAULT 'vendor_credit',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "referenceNumber" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VendorDebitMemo_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "VendorDebitMemo_vendorId_idx" ON "VendorDebitMemo"("vendorId");
CREATE INDEX IF NOT EXISTS "VendorDebitMemo_organizationId_issueDate_idx" ON "VendorDebitMemo"("organizationId", "issueDate");
CREATE INDEX IF NOT EXISTS "VendorDebitMemo_organizationId_status_idx" ON "VendorDebitMemo"("organizationId", "status");

-- Add foreign key constraints
ALTER TABLE "VendorDebitMemo" ADD CONSTRAINT "VendorDebitMemo_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VendorDebitMemo" ADD CONSTRAINT "VendorDebitMemo_vendorInvoiceId_fkey" FOREIGN KEY ("vendorInvoiceId") REFERENCES "VendorInvoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "VendorDebitMemo" ADD CONSTRAINT "VendorDebitMemo_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
