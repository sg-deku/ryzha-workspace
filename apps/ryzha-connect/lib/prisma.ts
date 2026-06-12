import { PrismaClient } from "@ryzha/database"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? ""
  const pooledUrl = url.includes("?")
    ? `${url}&connection_limit=1&pool_timeout=0`
    : `${url}?connection_limit=1&pool_timeout=0`

  return new PrismaClient({
    datasources: { db: { url: pooledUrl } },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()
globalForPrisma.prisma = prisma
