-- AlterTable: AuditLog — add field-level audit columns for SOC 2 compliance
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "before"        JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "after"         JSONB;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "changedFields" TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "actorEmail"    TEXT;
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS "ipAddress"     TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_entityType_idx" ON "AuditLog"("organizationId", "entityType");
CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx"         ON "AuditLog"("actorId", "createdAt");
