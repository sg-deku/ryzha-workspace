import { prisma } from "@/lib/prisma"
import { resolveProviderForRole, parseScope } from "@/lib/role-resolver"
import { callAI } from "@/lib/ai-client"

export interface PipelineDiscrepancy {
  type: "BOOKING_WITHOUT_BILLING" | "BILLING_WITHOUT_BOOKING" | "AMOUNT_MISMATCH" | "TERM_MISMATCH"
  severity: "HIGH" | "MEDIUM" | "LOW"
  crmEventId?: string
  billingEventId?: string
  crmAmount?: number
  billedAmount?: number
  description: string
}

export interface PipelineAgentResult {
  crmProvider: string | null
  billingProvider: string | null
  crmBookingsScanned: number
  billingEventsScanned: number
  matched: number
  discrepancies: PipelineDiscrepancy[]
  aiSummary: string | null
}

const FUZZY_MATCH_TOLERANCE = 0.01

function amountsMatch(a: number, b: number): boolean {
  if (a === 0 && b === 0) return true
  const larger = Math.max(Math.abs(a), Math.abs(b))
  return Math.abs(a - b) / larger <= FUZZY_MATCH_TOLERANCE
}

export async function runPipelineAgent(organizationId: string): Promise<PipelineAgentResult> {
  const result: PipelineAgentResult = {
    crmProvider: null,
    billingProvider: null,
    crmBookingsScanned: 0,
    billingEventsScanned: 0,
    matched: 0,
    discrepancies: [],
    aiSummary: null,
  }

  const [crmConn, billingConn] = await Promise.all([
    resolveProviderForRole(organizationId, "crm"),
    resolveProviderForRole(organizationId, "billing"),
  ])

  result.crmProvider = crmConn?.provider ?? null
  result.billingProvider = billingConn?.provider ?? null

  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000)

  const crmSources = crmConn
    ? [crmConn.provider.toLowerCase()]
    : ["salesforce", "hubspot"]

  const billingSources = billingConn
    ? [billingConn.provider.toLowerCase().replace("_connect", "")]
    : ["stripe", "chargebee"]

  const [crmBookings, billingEvents] = await Promise.all([
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        source: { in: crmSources },
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID", "SUBSCRIPTION_CREATED"] },
        createdAt: { gte: since },
      },
      select: { id: true, source: true, externalId: true, amount: true, normalisedData: true, createdAt: true },
      take: 200,
    }),
    prisma.financialEvent.findMany({
      where: {
        organizationId,
        source: { in: billingSources },
        eventType: { in: ["PAYMENT_RECEIVED", "INVOICE_PAID", "SUBSCRIPTION_CREATED"] },
        status: { in: ["POSTED", "INGESTED", "APPROVED"] },
        createdAt: { gte: since },
      },
      select: { id: true, source: true, externalId: true, amount: true, normalisedData: true, createdAt: true },
      take: 200,
    }),
  ])

  result.crmBookingsScanned = crmBookings.length
  result.billingEventsScanned = billingEvents.length

  if (crmBookings.length === 0 && billingEvents.length === 0) {
    return result
  }

  const matchedBillingIds = new Set<string>()

  for (const booking of crmBookings) {
    const bookingAmount = booking.amount ?? 0
    const normData = booking.normalisedData as any

    const match = billingEvents.find((b) => {
      const bAmount = b.amount ?? 0
      if (!amountsMatch(bookingAmount, bAmount)) return false

      const timeDiff = Math.abs(new Date(b.createdAt).getTime() - new Date(booking.createdAt).getTime())
      return timeDiff < 7 * 24 * 3600 * 1000
    })

    if (match) {
      result.matched++
      matchedBillingIds.add(match.id)

      if (!amountsMatch(bookingAmount, match.amount ?? 0)) {
        result.discrepancies.push({
          type: "AMOUNT_MISMATCH",
          severity: "HIGH",
          crmEventId: booking.id,
          billingEventId: match.id,
          crmAmount: bookingAmount,
          billedAmount: match.amount ?? 0,
          description: `CRM booking of $${bookingAmount.toFixed(2)} does not match billed amount of $${(match.amount ?? 0).toFixed(2)} — contract term or discount may differ`,
        })
      }
    } else if (bookingAmount > 0) {
      result.discrepancies.push({
        type: "BOOKING_WITHOUT_BILLING",
        severity: "HIGH",
        crmEventId: booking.id,
        crmAmount: bookingAmount,
        description: `CRM booking of $${bookingAmount.toFixed(2)} from ${booking.source} (${normData?.dealName ?? normData?.opportunityName ?? booking.externalId}) has no corresponding billing event within 7 days`,
      })
    }
  }

  for (const billing of billingEvents) {
    if (!matchedBillingIds.has(billing.id) && (billing.amount ?? 0) > 500) {
      result.discrepancies.push({
        type: "BILLING_WITHOUT_BOOKING",
        severity: "MEDIUM",
        billingEventId: billing.id,
        billedAmount: billing.amount ?? 0,
        description: `Billing event of $${(billing.amount ?? 0).toFixed(2)} from ${billing.source} has no corresponding CRM booking — may be a renewal, self-serve, or missing deal record`,
      })
    }
  }

  if (result.discrepancies.length > 0) {
    const highCount = result.discrepancies.filter((d) => d.severity === "HIGH").length

    try {
      const aiResponse = await callAI(
        organizationId,
        [
          {
            role: "system",
            content: `You are a revenue operations AI for a startup. Analyse pipeline vs billing discrepancies and write a 2–3 sentence executive summary for the CFO. Focus on revenue leakage risk and what action is needed. Be specific about dollar amounts and counts.`,
          },
          {
            role: "user",
            content: JSON.stringify({
              crmBookings: result.crmBookingsScanned,
              billingEvents: result.billingEventsScanned,
              matched: result.matched,
              discrepancies: result.discrepancies.slice(0, 10),
            }),
          },
        ],
        { feature: "agent_pipeline", maxTokens: 300 }
      )
      result.aiSummary = aiResponse.content
    } catch { }

    for (const d of result.discrepancies.filter((x) => x.severity === "HIGH")) {
      await prisma.aIDecisionLog.create({
        data: {
          organizationId,
          financialEventId: d.crmEventId ?? d.billingEventId ?? "",
          agentName: "Pipeline",
          decisionType: "RECONCILIATION",
          inputSummary: { type: d.type, crmAmount: d.crmAmount, billedAmount: d.billedAmount } as any,
          output: { flagged: true } as any,
          confidence: 0.85,
          reasoning: d.description,
        },
      }).catch(() => {})
    }

    if (highCount > 0) {
      await (prisma.notification as any).create({
        data: {
          organizationId,
          type: "WARNING",
          title: `Pipeline Agent: ${highCount} revenue discrepanc${highCount === 1 ? "y" : "ies"} detected`,
          message: result.aiSummary ?? `${highCount} bookings in your CRM don't match billing records. Review the Reconcile dashboard.`,
          link: "/reconcile",
        },
      }).catch(() => {})
    }
  }

  return result
}
