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

interface PolicyDetection {
  policy: "ratable" | "point_in_time" | "milestone"
  termMonths: number
  reason: string
  confidence: number
}

function detectRevenuePolicy(
  eventType: string,
  source: string,
  normalisedData: unknown,
  rawPayload: unknown,
  architectureDefault: { policy: "ratable" | "point_in_time" | "milestone"; termMonths: number }
): PolicyDetection {
  const raw = (rawPayload ?? {}) as Record<string, any>
  const metadata = (raw.metadata ?? {}) as Record<string, any>

  if (source === "stripe") {
    if (eventType === "INVOICE_PAID") {
      const subscriptionId = raw.subscription as string | undefined
      const billingReason = raw.billing_reason as string | undefined
      const period = raw.lines?.data?.[0]?.period as { start?: number; end?: number } | undefined

      if (subscriptionId || billingReason?.startsWith("subscription")) {
        if (period?.start && period?.end) {
          const days = (period.end - period.start) / (60 * 60 * 24)
          const termMonths = Math.max(1, Math.round(days / 30))
          return {
            policy: "ratable",
            termMonths,
            reason: `Stripe subscription invoice (${subscriptionId ?? billingReason}) — ratable recognition over ${termMonths}-month billing period per ASC 606 §606-10-25-27.`,
            confidence: 0.97,
          }
        }
        return {
          policy: "ratable",
          termMonths: architectureDefault.termMonths,
          reason: `Stripe subscription invoice — ratable recognition. Billing period not available; using architecture default term of ${architectureDefault.termMonths} months.`,
          confidence: 0.9,
        }
      }

      return {
        policy: "point_in_time",
        termMonths: 0,
        reason: "Stripe invoice with no subscription link — recognised at point of payment per ASC 606 §606-10-25-23.",
        confidence: 0.85,
      }
    }

    if (eventType === "PAYMENT_RECEIVED") {
      const hasInvoice = !!raw.invoice
      const hasSubscription = !!raw.subscription
      const hasCustomer = !!raw.customer
      const hasSubscriptionMeta =
        !!(metadata.subscription_id || metadata.subscriptionId || metadata.plan_id || metadata.planId)
      const descriptionLower = ((raw.description as string) ?? "").toLowerCase()
      const looksRecurring = descriptionLower.includes("subscription") || descriptionLower.includes("renewal") || descriptionLower.includes("recurring")

      if (hasSubscription || hasInvoice) {
        return {
          policy: "ratable",
          termMonths: architectureDefault.termMonths,
          reason: `Stripe payment linked to ${hasSubscription ? "subscription" : "invoice"} — ratable recognition per ASC 606. Term from architecture default (${architectureDefault.termMonths} months).`,
          confidence: 0.95,
        }
      }

      if (hasSubscriptionMeta || looksRecurring) {
        return {
          policy: "ratable",
          termMonths: architectureDefault.termMonths,
          reason: `Recurring signals found in ${hasSubscriptionMeta ? "metadata" : "description"} — ratable recognition applied. Term: ${architectureDefault.termMonths} months.`,
          confidence: 0.8,
        }
      }

      if (!hasCustomer) {
        return {
          policy: "point_in_time",
          termMonths: 0,
          reason: "One-time Stripe payment — no customer, subscription, or invoice reference detected. Recognised in full at point of payment per ASC 606 §606-10-25-23.",
          confidence: 0.9,
        }
      }

      return {
        policy: architectureDefault.policy,
        termMonths: architectureDefault.termMonths,
        reason: `Payment from existing customer with no subscription signals — defaulting to organisation policy (${architectureDefault.policy}, ${architectureDefault.termMonths} months).`,
        confidence: 0.65,
      }
    }
  }

  return {
    policy: architectureDefault.policy,
    termMonths: architectureDefault.termMonths,
    reason: `Applied organisation default revenue recognition policy (${architectureDefault.policy}, ${architectureDefault.termMonths} months).`,
    confidence: 0.6,
  }
}

function calculateASC606(
  totalAmount: number,
  policy: "ratable" | "point_in_time" | "milestone",
  contractTermMonths: number,
): { recognised: number; deferred: number } {
  if (policy === "point_in_time") {
    return { recognised: totalAmount, deferred: 0 }
  }

  if (policy === "ratable" && contractTermMonths > 0) {
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

  const architectureDefault = {
    policy: ((architecture?.revenueRecognition as any)?.defaultPolicy ?? "ratable") as "ratable" | "point_in_time" | "milestone",
    termMonths: ((architecture?.revenueRecognition as any)?.defaultTermMonths ?? 12) as number,
  }

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

      const detection = detectRevenuePolicy(
        event.eventType,
        event.source ?? "",
        event.normalisedData,
        event.rawPayload,
        architectureDefault
      )

      const { recognised, deferred } = calculateASC606(
        event.amount,
        detection.policy,
        detection.termMonths,
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
            inputSummary: { amount: event.amount, policy: detection.policy, termMonths: detection.termMonths } as any,
            output: { recognised, deferred, revenuePolicy: detection.policy, accountingProvider: acctConn?.provider ?? null } as any,
            confidence: detection.confidence,
            reasoning: `${detection.reason}${recognised === event.amount ? ` Recognised in full: ${recognised}.` : ` Recognised ${recognised}, deferred ${deferred}.`}${acctConn ? ` Forwarding to ${acctConn.provider}.` : " No accounting system connected — journal entry skipped."}`,
          },
        }),
      ])

      result.posted++

      if (acctConn) {
        try {
          const [cashAccount, revenueAccount, deferredRevenueAccount] = await Promise.all([
            findCOAAccount(organizationId, acctConn.connectionId, ["checking", "cash", "bank"], ["Bank"]),
            findCOAAccount(organizationId, acctConn.connectionId, ["income", "revenue", "sales"], ["Income", "Other Income"]),
            findCOAAccount(organizationId, acctConn.connectionId, ["deferred revenue", "unearned", "deferred"], ["Other Current Liability", "Long Term Liability"]),
          ])

          if (!cashAccount || !revenueAccount) {
            result.errors.push({
              eventId: event.id,
              error: `ERP push skipped — could not resolve GL accounts from Chart of Accounts. Missing: ${[!cashAccount && "cash/bank account", !revenueAccount && "revenue/income account"].filter(Boolean).join(", ")}. Sync your COA from the Connections page.`,
            })
          } else {
            const lines = [
              { externalAccountCode: cashAccount, debit: event.amount, credit: 0, description },
            ]

            if (deferred > 0 && deferredRevenueAccount) {
              lines.push({ externalAccountCode: deferredRevenueAccount, debit: 0, credit: deferred, description: "Deferred revenue" })
              lines.push({ externalAccountCode: revenueAccount, debit: 0, credit: recognised, description: "Recognised revenue (ASC 606)" })
            } else {
              lines.push({ externalAccountCode: revenueAccount, debit: 0, credit: event.amount, description: "Revenue recognised" })
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
              update: { externalId: pushResult.externalId, externalUrl: pushResult.externalUrl ?? null },
            }).catch(() => {})

            result.journalEntriesPosted++
          }
        } catch (pushErr: any) {
          result.errors.push({ eventId: event.id, error: `ERP push failed: ${pushErr.message}` })
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
