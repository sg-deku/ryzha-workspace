import { prisma } from "@/lib/prisma"
import { resolveAccountingSystem } from "@/lib/role-resolver"
import { dispatchJournalEntry, findCOAAccount } from "@/lib/accounting-dispatch"

export interface CommissionAccrual {
  eventId: string
  amount: number
  commissionAmount: number
  repIdentifier: string
  department: string
  journalPosted: boolean
}

export interface CommissionAgentResult {
  processed: number
  accrued: number
  posted: number
  totalCommissionAccrued: number
  accruals: CommissionAccrual[]
  errors: { eventId: string; error: string }[]
}

export async function runCommissionAgent(organizationId: string): Promise<CommissionAgentResult> {
  const result: CommissionAgentResult = {
    processed: 0,
    accrued: 0,
    posted: 0,
    totalCommissionAccrued: 0,
    accruals: [],
    errors: [],
  }

  const [architecture, policyRules] = await Promise.all([
    prisma.financialArchitecture.findUnique({ where: { organizationId } }),
    prisma.policyRule.findMany({
      where: { organizationId, isActive: true, type: "COMMISSION_RATE" as any },
    }),
  ])

  const defaultCommissionRate: number =
    (policyRules[0]?.conditions as any)?.rate ?? 0.08

  if (defaultCommissionRate === 0) return result

  const acctConn = await resolveAccountingSystem(organizationId)

  const events = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
      status: "POSTED",
      createdAt: { gte: new Date(Date.now() - 35 * 24 * 3600 * 1000) },
    },
    select: {
      id: true,
      amount: true,
      source: true,
      normalisedData: true,
      createdAt: true,
      aiDecisionLogs: {
        where: { agentName: "Commission" },
        select: { id: true },
        take: 1,
      },
    },
    take: 100,
    orderBy: { createdAt: "asc" },
  })

  for (const event of events) {
    if ((event.aiDecisionLogs as any[]).length > 0) {
      result.processed++
      continue
    }

    result.processed++
    const amount = event.amount ?? 0
    if (amount <= 0) continue

    const normData = event.normalisedData as any
    const repIdentifier =
      normData?.salesRepId ??
      normData?.ownerId ??
      normData?.accountOwner ??
      "unassigned"

    const salesDept = (architecture?.departmentStructure as any)?.departments?.includes("Sales")
      ? "Sales"
      : "Sales"

    const applicableRule = policyRules.find((r) => {
      const cond = r.conditions as any
      return (
        (!cond?.minAmount || amount >= cond.minAmount) &&
        (!cond?.maxAmount || amount <= cond.maxAmount) &&
        (!cond?.source || cond.source === event.source)
      )
    })

    const rate = (applicableRule?.conditions as any)?.rate ?? defaultCommissionRate
    const commissionAmount = Math.round(amount * rate * 100) / 100

    result.accrued++
    result.totalCommissionAccrued += commissionAmount

    const accrual: CommissionAccrual = {
      eventId: event.id,
      amount,
      commissionAmount,
      repIdentifier,
      department: salesDept,
      journalPosted: false,
    }

    try {
      if (acctConn) {
        const [commissionExpenseAccount, accruedLiabilityAccount] = await Promise.all([
          findCOAAccount(organizationId, acctConn.connectionId, ["commission", "sales compensation", "variable comp"]),
          findCOAAccount(organizationId, acctConn.connectionId, ["accrued commission", "accrued compensation", "accrued liability"]),
        ])

        await dispatchJournalEntry(organizationId, {
          agentName: "Commission",
          financialEventId: event.id,
          organizationId,
          date: event.createdAt,
          description: `Commission accrual — ${repIdentifier} — ${salesDept}`,
          reference: `COMM-${event.id.slice(-8).toUpperCase()}`,
          lines: [
            {
              externalAccountCode: commissionExpenseAccount ?? "6100",
              debit: commissionAmount,
              credit: 0,
              description: `Commission expense — ${(rate * 100).toFixed(0)}% of $${amount.toFixed(2)}`,
            },
            {
              externalAccountCode: accruedLiabilityAccount ?? "2200",
              debit: 0,
              credit: commissionAmount,
              description: `Accrued commission payable — ${repIdentifier}`,
            },
          ],
        })

        accrual.journalPosted = true
        result.posted++
      }

      await prisma.aIDecisionLog.create({
        data: {
          organizationId,
          financialEventId: event.id,
          agentName: "Commission",
          decisionType: "COMMISSION_ACCRUAL" as any,
          inputSummary: { amount, rate, repIdentifier, source: event.source } as any,
          output: { commissionAmount, department: salesDept, posted: accrual.journalPosted } as any,
          confidence: applicableRule ? 0.95 : 0.80,
          reasoning: `Applied ${(rate * 100).toFixed(1)}% commission rate to $${amount.toFixed(2)} payment. Accrued $${commissionAmount.toFixed(2)} for rep ${repIdentifier}.${!applicableRule ? " Used default rate (no matching policy rule found)." : ""}`,
        },
      })

      result.accruals.push(accrual)
    } catch (err: any) {
      result.errors.push({ eventId: event.id, error: err.message })
    }
  }

  return result
}
