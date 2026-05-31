-- AlterTable: P2PSettings - add approval deadline and escalation
ALTER TABLE "P2PSettings" ADD COLUMN IF NOT EXISTS "approvalDeadlineDays" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "P2PSettings" ADD COLUMN IF NOT EXISTS "escalationApproverId" TEXT;

-- AlterTable: Expense - add approval fields
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "approvalRequestId" TEXT;

-- AlterTable: PurchaseOrder - add approvalRequestId
ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "approvalRequestId" TEXT;

-- CreateTable: ApprovalRequest
CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "approverEmail" TEXT,
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "delegatedTo" TEXT,
    "delegatedAt" TIMESTAMP(3),
    "escalatedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "amount" DOUBLE PRECISION,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ApprovalRequest_organizationId_status_idx" ON "ApprovalRequest"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "ApprovalRequest_approverId_status_idx" ON "ApprovalRequest"("approverId", "status");

-- AddForeignKey: ApprovalRequest -> Organization
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: PurchaseOrder.approvalRequestId -> ApprovalRequest
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_approvalRequestId_fkey"
    FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: Expense.approvalRequestId -> ApprovalRequest
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_approvalRequestId_fkey"
    FOREIGN KEY ("approvalRequestId") REFERENCES "ApprovalRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
