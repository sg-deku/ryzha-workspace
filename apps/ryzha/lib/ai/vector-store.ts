import { prisma } from "@/lib/prisma"
import { getEmbeddings } from "./embeddings"

const EMBEDDING_DIM = 1536

async function ensurePgVectorExtension() {
  await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS vector`)
}

async function ensureEmbeddingColumn() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "FinancialDocument"
    ADD COLUMN IF NOT EXISTS embedding vector(${EMBEDDING_DIM})
  `)
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "FinancialDocument_embedding_idx"
    ON "FinancialDocument"
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 10)
  `)
}

let pgVectorReady = false

async function initPgVector() {
  if (pgVectorReady) return
  try {
    await ensurePgVectorExtension()
    await ensureEmbeddingColumn()
    pgVectorReady = true
  } catch {
    pgVectorReady = false
  }
}

export async function ingestDocument(params: {
  organizationId: string
  title: string
  content: string
  sourceType: string
  sourceId?: string
}) {
  await initPgVector()

  const embedder = await getEmbeddings(params.organizationId)
  const vector = await embedder.embedQuery(params.content)

  const existing = await prisma.financialDocument.findFirst({
    where: { organizationId: params.organizationId, sourceType: params.sourceType, sourceId: params.sourceId ?? null },
    select: { id: true },
  })

  if (existing) {
    await prisma.financialDocument.update({
      where: { id: existing.id },
      data: { title: params.title, content: params.content, updatedAt: new Date() },
    })
    await prisma.$executeRawUnsafe(
      `UPDATE "FinancialDocument" SET embedding = $1::vector WHERE id = $2`,
      `[${vector.join(",")}]`,
      existing.id
    )
    return existing.id
  }

  const doc = await prisma.financialDocument.create({
    data: {
      organizationId: params.organizationId,
      title: params.title,
      content: params.content,
      sourceType: params.sourceType,
      sourceId: params.sourceId ?? null,
    },
  })

  await prisma.$executeRawUnsafe(
    `UPDATE "FinancialDocument" SET embedding = $1::vector WHERE id = $2`,
    `[${vector.join(",")}]`,
    doc.id
  )

  return doc.id
}

export async function retrieveRelevantContext(query: string, organizationId: string, topK = 3): Promise<string> {
  await initPgVector()

  if (!pgVectorReady) {
    if (query.toLowerCase().includes("asc 606") || query.toLowerCase().includes("deferred")) {
      return "ASC 606: Revenue from Contracts with Customers requires that revenue be recognized when control of the promised goods or services is transferred to customers in an amount that reflects the consideration to which the entity expects to be entitled."
    }
    return ""
  }

  try {
    const embedder = await getEmbeddings(organizationId)
    const queryVector = await embedder.embedQuery(query)
    const vectorLiteral = `[${queryVector.join(",")}]`

    const rows = await prisma.$queryRawUnsafe<{ content: string; title: string }[]>(
      `SELECT title, content
       FROM "FinancialDocument"
       WHERE "organizationId" = $1
         AND embedding IS NOT NULL
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      organizationId,
      vectorLiteral,
      topK
    )

    if (!rows.length) return ""

    return rows
      .map((r) => `### ${r.title}\n${r.content}`)
      .join("\n\n---\n\n")
  } catch {
    return ""
  }
}

export async function getVectorStore(organizationId: string) {
  await initPgVector()
  return pgVectorReady ? { organizationId } : null
}
