-- Fix 5.1: Add FinancialDocument table for RAG / knowledge base.
-- The vector column and pgvector extension are created at runtime by vector-store.ts
-- (initPgVector) so this migration only creates the base relational table,
-- which is safe on any standard PostgreSQL instance.

CREATE TABLE IF NOT EXISTS "FinancialDocument" (
  "id"             TEXT         NOT NULL PRIMARY KEY,
  "organizationId" TEXT         NOT NULL,
  "title"          TEXT         NOT NULL,
  "content"        TEXT         NOT NULL,
  "sourceType"     TEXT         NOT NULL,
  "sourceId"       TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "FinancialDocument_organizationId_idx"
  ON "FinancialDocument" ("organizationId");

CREATE INDEX IF NOT EXISTS "FinancialDocument_organizationId_sourceType_idx"
  ON "FinancialDocument" ("organizationId", "sourceType");

ALTER TABLE "FinancialDocument"
  ADD CONSTRAINT "FinancialDocument_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
