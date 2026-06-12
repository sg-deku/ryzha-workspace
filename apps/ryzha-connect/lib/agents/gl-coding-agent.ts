import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface GLCodingResult {
  eventId: string
  suggestedAccount: string
  accountName: string
  confidence: number
  reasoning: string
  wasAIDecision: boolean
}

export interface GLCodingAgentResult {
  processed: number
  coded: number
  skipped: number
  results: GLCodingResult[]
  errors: { eventId: string; error: string }[]
}

interface COAAccount {
  externalCode: string
  externalName: string
  accountType: string
  ryzhaCategoryHint: string | null
}

function buildSystemPrompt(accounts: COAAccount[]): string {
  const accountList = accounts
    .map((a) => `${a.externalCode} | ${a.externalName} | ${a.accountType}${a.ryzhaCategoryHint ? ` | hint: ${a.ryzhaCategoryHint}` : ""}`)
    .join("\n")

  return `You are a senior accountant and GL coding specialist. Given a financial transaction, assign it to the most appropriate General Ledger account from the chart of accounts below.

Chart of Accounts:
${accountList}

Rules:
- Pick ONLY from the accounts listed above
- Choose the most specific account that matches the transaction
- For payroll, use payroll/salary accounts
- For cloud services (AWS, GCP, Azure), use infrastructure/hosting expense accounts
- For SaaS tools, use software expense accounts
- For revenue payments received, use revenue/income accounts
- For bank credits from customers, use accounts receivable or revenue accounts
- For vendor payments, use the matching expense category

Respond ONLY with valid JSON in this exact format:
{
  "accountCode": "5200",
  "accountName": "Cloud Infrastructure",
  "confidence": 0.94,
  "reasoning": "AWS is consistently categorized as cloud infrastructure cost"
}`
}

function buildUserPrompt(event: {
  source: string
  eventType: string
  amount: number | null
  normalisedData: any
}): string {
  const data = event.normalisedData ?? {}
  return JSON.stringify({
    source: event.source,
    type: event.eventType,
    amount: event.amount,
    vendor: data.merchantName ?? data.vendorName ?? data.counterpartyName ?? null,
    description: data.description ?? data.memo ?? null,
    category: data.categoryHint ?? data.category ?? null,
    direction: data.direction ?? null,
    department: data.department ?? null,
  })
}

function fallbackCodeByRules(event: {
  source: string
  eventType: string
  normalisedData: any
}, accounts: COAAccount[]): { code: string; name: string } | null {
  const data = event.normalisedData ?? {}
  const vendor = (data.merchantName ?? data.vendorName ?? "").toLowerCase()
  const type = event.eventType

  if (type === "PAYMENT_RECEIVED" || type === "INVOICE_PAID") {
    const match = accounts.find((a) =>
      a.externalName.toLowerCase().includes("revenue") ||
      a.externalName.toLowerCase().includes("income") ||
      a.ryzhaCategoryHint?.toLowerCase().includes("revenue")
    )
    if (match) return { code: match.externalCode, name: match.externalName }
  }

  if (type === "PAYROLL_PROCESSED") {
    const match = accounts.find((a) =>
      a.externalName.toLowerCase().includes("payroll") ||
      a.externalName.toLowerCase().includes("salary") ||
      a.externalName.toLowerCase().includes("wages")
    )
    if (match) return { code: match.externalCode, name: match.externalName }
  }

  if (vendor.includes("aws") || vendor.includes("gcp") || vendor.includes("azure") || vendor.includes("cloudflare")) {
    const match = accounts.find((a) =>
      a.externalName.toLowerCase().includes("infrastructure") ||
      a.externalName.toLowerCase().includes("hosting") ||
      a.externalName.toLowerCase().includes("cloud")
    )
    if (match) return { code: match.externalCode, name: match.externalName }
  }

  const generalExpense = accounts.find((a) => a.accountType === "Expense")
  if (generalExpense) return { code: generalExpense.externalCode, name: generalExpense.externalName }

  return null
}

export async function runGLCodingAgent(
  organizationId: string,
  options?: { limit?: number; eventIds?: string[] }
): Promise<GLCodingAgentResult> {
  const result: GLCodingAgentResult = {
    processed: 0,
    coded: 0,
    skipped: 0,
    results: [],
    errors: [],
  }

  const qbConn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    select: { id: true, status: true },
  })

  const coaMappings = qbConn
    ? await prisma.cOAMapping.findMany({
        where: { organizationId, integrationConnectionId: qbConn.id, isActive: true },
        select: { externalCode: true, externalName: true, accountType: true, ryzhaCategoryHint: true },
      })
    : []

  if (coaMappings.length === 0) {
    return result
  }

  const whereClause: any = {
    organizationId,
    status: "INGESTED",
  }

  if (options?.eventIds?.length) {
    whereClause.id = { in: options.eventIds }
  } else {
    whereClause.eventType = {
      in: ["EXPENSE_CREATED", "BILL_CREATED", "PAYMENT_RECEIVED", "INVOICE_PAID", "PAYROLL_PROCESSED", "BANK_TRANSACTION"],
    }
  }

  const events = await prisma.financialEvent.findMany({
    where: whereClause,
    take: options?.limit ?? 30,
    orderBy: { createdAt: "asc" },
  })

  result.processed = events.length

  const systemPrompt = buildSystemPrompt(coaMappings)

  for (const event of events) {
    try {
      await prisma.financialEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSING" },
      })

      let accountCode: string
      let accountName: string
      let confidence: number
      let reasoning: string
      let wasAIDecision = false

      try {
        const userPrompt = buildUserPrompt({
          source: event.source,
          eventType: event.eventType,
          amount: event.amount,
          normalisedData: event.normalisedData,
        })

        const aiResponse = await callAI(organizationId, [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ], {
          feature: "agent_gl_coding",
          maxTokens: 300,
        })

        const text = aiResponse.content.trim()
        const jsonMatch = text.match(/\{[\s\S]*\}/)
        if (!jsonMatch) throw new Error("AI returned no valid JSON")

        const parsed = JSON.parse(jsonMatch[0])
        if (!parsed.accountCode || !parsed.accountName) throw new Error("AI returned incomplete response")

        const validAccount = coaMappings.find((a) => a.externalCode === parsed.accountCode)
        if (!validAccount) throw new Error(`AI returned unknown account code: ${parsed.accountCode}`)

        accountCode = parsed.accountCode
        accountName = parsed.accountName
        confidence = Math.min(1, Math.max(0, parsed.confidence ?? 0.8))
        reasoning = parsed.reasoning ?? "AI-assigned GL code"
        wasAIDecision = true
      } catch {
        const fallback = fallbackCodeByRules({
          source: event.source,
          eventType: event.eventType,
          normalisedData: event.normalisedData,
        }, coaMappings)

        if (!fallback) {
          await prisma.financialEvent.update({ where: { id: event.id }, data: { status: "INGESTED" } })
          result.skipped++
          continue
        }

        accountCode = fallback.code
        accountName = fallback.name
        confidence = 0.6
        reasoning = "Rule-based fallback - AI unavailable or returned invalid response"
        wasAIDecision = false
      }

      await Promise.all([
        prisma.financialEvent.update({
          where: { id: event.id },
          data: {
            status: "INGESTED",
            normalisedData: {
              ...(event.normalisedData as any),
              glAccountCode: accountCode,
              glAccountName: accountName,
              glCodingConfidence: confidence,
            },
          },
        }),
        prisma.aIDecisionLog.create({
          data: {
            organizationId,
            financialEventId: event.id,
            agentName: "GLCoding",
            decisionType: "GL_CODE",
            inputSummary: {
              source: event.source,
              eventType: event.eventType,
              amount: event.amount,
              vendor: (event.normalisedData as any)?.merchantName ?? null,
            } as any,
            output: { accountCode, accountName, confidence } as any,
            confidence,
            reasoning,
          },
        }).catch(() => {}),
        prisma.cOAMapping.updateMany({
          where: { organizationId, externalCode: accountCode },
          data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
        }).catch(() => {}),
      ])

      result.results.push({ eventId: event.id, suggestedAccount: accountCode, accountName, confidence, reasoning, wasAIDecision })
      result.coded++
    } catch (err: any) {
      result.errors.push({ eventId: event.id, error: err.message })
      await prisma.financialEvent.update({ where: { id: event.id }, data: { status: "INGESTED" } }).catch(() => {})
    }
  }

  return result
}
