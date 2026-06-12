import { prisma } from "@/lib/prisma"
import { resolveProviderForRole, parseScope } from "@/lib/role-resolver"
import { pullRampTransactions, pullRampBills } from "@ryzha/integrations"
import { dispatchJournalEntry, findCOAAccount } from "@/lib/accounting-dispatch"
import { resolveAccountingSystem } from "@/lib/role-resolver"

export interface APAgentResult {
  transactionsIngested: number
  billsIngested: number
  autoApproved: number
  flaggedForApproval: number
  posted: number
  expenseProvider: string | null
}

async function pullExpenseTransactions(
  provider: string,
  accessToken: string,
  scope: string | null
): Promise<{ transactions: any[]; bills: any[] }> {
  const scopeData = parseScope(scope)
  const token = scopeData.accessToken ?? scopeData.apiKey ?? accessToken

  switch (provider) {
    case "RAMP": {
      const [txs, bills] = await Promise.all([
        pullRampTransactions(token, { daysSince: 30 }),
        pullRampBills(token, { daysSince: 30 }),
      ])
      return { transactions: txs, bills }
    }
    default:
      return { transactions: [], bills: [] }
  }
}

export async function runAPAgent(organizationId: string): Promise<APAgentResult> {
  const result: APAgentResult = {
    transactionsIngested: 0,
    billsIngested: 0,
    autoApproved: 0,
    flaggedForApproval: 0,
    posted: 0,
    expenseProvider: null,
  }

  const expenseConn = await resolveProviderForRole(organizationId, "expenses")
  if (!expenseConn) return result

  result.expenseProvider = expenseConn.provider

  const policyRules = await prisma.policyRule.findMany({
    where: { organizationId, isActive: true, type: "AMOUNT_THRESHOLD" },
    orderBy: { priority: "desc" },
  })

  const autoApproveThreshold = policyRules.find((r) => r.action === "AUTO_APPROVE")
    ? (policyRules.find((r) => r.action === "AUTO_APPROVE")?.conditions as any)?.amountLt ?? 500
    : 500

  const acctConn = await resolveAccountingSystem(organizationId)

  const { transactions, bills } = await pullExpenseTransactions(
    expenseConn.provider,
    expenseConn.accessToken,
    expenseConn.scope
  )

  for (const tx of transactions) {
    try {
      const event = await prisma.financialEvent.upsert({
        where: { organizationId_source_externalId: { organizationId, source: tx.source, externalId: tx.externalId } },
        create: {
          organizationId, source: tx.source, externalId: tx.externalId, eventType: tx.eventType as any,
          status: "INGESTED", amount: tx.amount ?? null, currency: tx.currency ?? "USD",
          rawPayload: tx.rawPayload as any, normalisedData: tx.normalisedData as any,
        },
        update: {},
      })
      result.transactionsIngested++

      const amount = tx.amount ?? 0

      await prisma.aIDecisionLog.create({
        data: {
          organizationId, financialEventId: event.id, agentName: "AP",
          decisionType: "GL_CODE", confidence: 0.88,
          inputSummary: { merchant: (tx.normalisedData as any).merchantName, amount, provider: expenseConn.provider } as any,
          output: { suggestedCategory: (tx.normalisedData as any).categoryHint ?? "General Expense", autoApprove: amount < autoApproveThreshold } as any,
          reasoning: `Merchant category: ${(tx.normalisedData as any).categoryHint ?? "unknown"}. Amount $${amount} is ${amount < autoApproveThreshold ? "below" : "above"} auto-approve threshold of $${autoApproveThreshold}.`,
        },
      })

      if (amount < autoApproveThreshold) {
        result.autoApproved++

        if (acctConn) {
          const [expenseAccount, creditCardAccount] = await Promise.all([
            findCOAAccount(organizationId, acctConn.connectionId, [
              (tx.normalisedData as any).categoryHint ?? "",
              "general expense",
              "operating expense",
            ]),
            findCOAAccount(organizationId, acctConn.connectionId, [
              "credit card",
              expenseConn.provider.toLowerCase(),
              "card payable",
            ]),
          ])

          const merchantName = (tx.normalisedData as any).merchantName ?? tx.externalId

          await dispatchJournalEntry(organizationId, {
            agentName: "AP",
            financialEventId: event.id,
            organizationId,
            date: new Date(),
            reference: `AP-${tx.externalId.slice(-8)}`,
            description: `${expenseConn.provider} expense — ${merchantName}`,
            lines: [
              { externalAccountCode: expenseAccount ?? "6000", debit: amount, credit: 0, description: merchantName },
              { externalAccountCode: creditCardAccount ?? "2100", debit: 0, credit: amount, description: `${expenseConn.provider} card payable` },
            ],
          })
          await prisma.financialEvent.update({ where: { id: event.id }, data: { status: "POSTED", pushedAt: new Date() } })
          result.posted++
        } else {
          await prisma.financialEvent.update({ where: { id: event.id }, data: { status: "APPROVED" } })
        }
      } else {
        result.flaggedForApproval++
        await prisma.financialEvent.update({ where: { id: event.id }, data: { status: "PENDING_APPROVAL" } })
        const userOrg = await prisma.userOrganization.findFirst({ where: { organizationId } })
        if (userOrg) {
          const existing = await prisma.financialEventApproval.findFirst({ where: { financialEventId: event.id } })
          if (!existing) {
            await prisma.financialEventApproval.create({
              data: {
                financialEventId: event.id, organizationId, status: "PENDING",
                approverId: userOrg.userId, requestedBy: "ap-agent",
                dueDate: new Date(Date.now() + 48 * 3600 * 1000),
              },
            }).catch(() => {})
          }
        }
      }
    } catch (err: any) { console.error("[ap-agent tx]", err.message) }
  }

  for (const bill of bills) {
    try {
      await prisma.financialEvent.upsert({
        where: { organizationId_source_externalId: { organizationId, source: bill.source, externalId: bill.externalId } },
        create: {
          organizationId, source: bill.source, externalId: bill.externalId, eventType: bill.eventType as any,
          status: "PENDING_APPROVAL", amount: bill.amount ?? null, currency: bill.currency ?? "USD",
          rawPayload: bill.rawPayload as any, normalisedData: bill.normalisedData as any,
        },
        update: {},
      })
      result.billsIngested++
      result.flaggedForApproval++
    } catch (err: any) { console.error("[ap-agent bill]", err.message) }
  }

  return result
}
