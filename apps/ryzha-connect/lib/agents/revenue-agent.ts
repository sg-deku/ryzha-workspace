import { prisma } from "@/lib/prisma"
import { resolveAccountingSystem } from "@/lib/role-resolver"
import { dispatchJournalEntry, findCOAAccount } from "@/lib/accounting-dispatch"

interface RevenueAgentResult {
  processed: number
  posted: number
  failed: number
  skipped: number
  accountingProvider: string | null
  journalEntriesPosted: number
  errors: { eventId: string; error: string }[]
}

function calculateASC606(
  totalAmount: number,
  policy: "ratable" | "point_in_time" | "milestone",
  contractTermMonths: number,
  billingMonth: number
): { recognised: number; deferred: number } {
  if (policy === "point_in_time") {
    return { recognised: totalAmount, deferred: 0 }
  }

  if (policy === "ratable") {
    const monthlyAmount = totalAmount / contractTermMonths
    const recognised = Math.round(monthlyAmount * 100) / 100
    const deferred = Math.round((totalAmount - recognised) * 100) / 100
    return { recognised, deferred }
  }

  return { recognised: totalAmount, deferred: 0 }
}

export async function runRevenueAgent(organizationId: string): Promise<RevenueAgentResult> {
  const result: RevenueAgentResult = { processed: 0, posted: 0, failed: 0, skipped: 0, accountingProvider: null, journalEntriesPosted: 0, errors: [] }

  const acctConn = await resolveAccountingSystem(organizationId)
  result.accountingProvider = acctConn?.provider ?? null

  const architecture = await prisma.financialArchitecture.findUnique({
    where: { organizationId },
  })

  const revenuePolicy: "ratable" | "point_in_time" | "milestone" =
    (architecture?.revenueRecognition as any)?.defaultPolicy ?? "ratable"
  const contractTermMonths: number =
    (architecture?.revenueRecognition as any)?.defaultTermMonths ?? 12

  const staleThreshold = new Date(Date.now() - 30 * 60 * 1000)
  await prisma.financialEvent.updateMany({
    where: {
      organizationId,
      status: { in: ["FAILED", "PROCESSING"] },
      eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
      updatedAt: { lt: staleThreshold },
    },
    data: { status: "INGESTED" },
  })

  const events = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      status: "INGESTED",
      eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID"] },
    },
    take: 50,
    orderBy: { createdAt: "asc" },
  })

  for (const event of events) {
    result.processed++

    try {
      if (!event.amount || event.amount <= 0) {
        await prisma.financialEvent.update({
          where: { id: event.id },
          data: { status: "SKIPPED" },
        })
        result.skipped++
        continue
      }

      await prisma.financialEvent.update({
        where: { id: event.id },
        data: { status: "PROCESSING" },
      })

      const { recognised, deferred } = calculateASC606(
        event.amount,
        revenuePolicy,
        contractTermMonths,
        1
      )

      const normData = event.normalisedData as any
      const description =
        event.eventType === "INVOICE_PAID"
          ? `Invoice paid – ${normData?.invoiceNumber ?? event.externalId}`
          : `Payment received – ${normData?.customerEmail ?? event.externalId}`

      await Promise.all([
        prisma.financialEvent.update({
          where: { id: event.id },
          data: { status: "POSTED", pushedAt: new Date() },
        }),
        prisma.aIDecisionLog.create({
          data: {
            organizationId,
            financialEventId: event.id,
            agentName: "Revenue",
            decisionType: "REV_REC",
            inputSummary: { amount: event.amount, policy: revenuePolicy, termMonths: contractTermMonths } as any,
            output: { recognised, deferred, accountingProvider: acctConn?.provider ?? null } as any,
            confidence: 0.95,
            reasoning: `Applied ${revenuePolicy} recognition policy over ${contractTermMonths} months. Recognised $${recognised}, deferred $${deferred}.${acctConn ? ` Forwarding to ${acctConn.provider}.` : " No accounting system connected — journal entry skipped."}`,
          },
        }),
      ])

      result.posted++

      if (acctConn) {
        try {
          const [cashAccount, revenueAccount, deferredRevenueAccount] = await Promise.all([
            findCOAAccount(organizationId, acctConn.connectionId, ["cash", "bank", "checking"]),
            findCOAAccount(organizationId, acctConn.connectionId, ["saas revenue", "revenue", "income"]),
            findCOAAccount(organizationId, acctConn.connectionId, ["deferred revenue", "unearned"]),
          ])

          const lines = [
            { externalAccountCode: cashAccount ?? "1000", debit: event.amount, credit: 0, description },
          ]

          if (deferred > 0) {
            lines.push({ externalAccountCode: deferredRevenueAccount ?? "2100", debit: 0, credit: deferred, description: "Deferred revenue" })
            lines.push({ externalAccountCode: revenueAccount ?? "4000", debit: 0, credit: recognised, description: "Recognised revenue (ASC 606)" })
          } else {
            lines.push({ externalAccountCode: revenueAccount ?? "4000", debit: 0, credit: event.amount, description: "Revenue recognised" })
          }

          const pushResult = await dispatchJournalEntry(organizationId, {
            agentName: "Revenue",
            financialEventId: event.id,
            organizationId,
            date: event.createdAt,
            description,
            reference: `RYZ-${event.id.slice(-8).toUpperCase()}`,
            lines,
          })

          await prisma.externalReference.upsert({
            where: { financialEventId_provider_entityType: { financialEventId: event.id, provider: acctConn.provider as any, entityType: "JOURNAL_ENTRY" } },
            create: {
              financialEventId: event.id,
              provider: acctConn.provider as any,
              externalId: pushResult.externalId,
              entityType: "JOURNAL_ENTRY",
              externalUrl: pushResult.externalUrl ?? null,
            },
            update: { externalId: pushResult.externalId },
          }).catch(() => {})

          result.journalEntriesPosted++
        } catch (pushErr: any) {
          result.errors.push({ eventId: event.id, error: `QB push failed: ${pushErr.message}` })
        }
      }
    } catch (err: any) {
      result.failed++
      result.errors.push({ eventId: event.id, error: err.message })

      await prisma.financialEvent.update({
        where: { id: event.id },
        data: { status: "FAILED" },
      }).catch(() => {})
    }
  }

  return result
}
