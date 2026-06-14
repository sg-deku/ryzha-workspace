import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface CollectionsAgentResult {
  processed: number
  overdueCount: number
  totalOverdue: number
  dunningSent: number
  escalated: number
  drafts: DunningDraft[]
  errors: string[]
}

export interface DunningDraft {
  eventId: string
  customerId: string
  customerName: string
  amount: number
  daysOverdue: number
  tier: "REMINDER" | "FOLLOW_UP" | "ESCALATION"
  subject: string
  body: string
}

function getDunningTier(daysOverdue: number): DunningDraft["tier"] {
  if (daysOverdue >= 60) return "ESCALATION"
  if (daysOverdue >= 30) return "FOLLOW_UP"
  return "REMINDER"
}

function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000)
}

export async function runCollectionsAgent(organizationId: string): Promise<CollectionsAgentResult> {
  const result: CollectionsAgentResult = {
    processed: 0,
    overdueCount: 0,
    totalOverdue: 0,
    dunningSent: 0,
    escalated: 0,
    drafts: [],
    errors: [],
  }

  const arEvents = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      eventType: { in: ["INVOICE_PAID", "PAYMENT_RECEIVED"] },
      status: { notIn: ["POSTED", "SKIPPED"] },
    },
    orderBy: { createdAt: "asc" },
    take: 50,
  })

  result.processed = arEvents.length

  const overdueEvents = arEvents.filter((e) => {
    const normData = e.normalisedData as Record<string, unknown>
    const dueDate = normData?.dueDate ? new Date(normData.dueDate as string) : null
    if (dueDate) return dueDate < new Date()
    return daysSince(e.createdAt) > 30
  })

  result.overdueCount = overdueEvents.length
  result.totalOverdue = overdueEvents.reduce((s, e) => s + (e.amount ?? 0), 0)

  for (const event of overdueEvents) {
    const normData = event.normalisedData as Record<string, unknown>
    const customerName = (normData?.customerName as string) ?? (normData?.customerEmail as string) ?? "Customer"
    const customerId = (normData?.customerId as string) ?? event.externalId
    const daysOverdue = daysSince(event.createdAt)
    const tier = getDunningTier(daysOverdue)
    const amount = event.amount ?? 0

    try {
      const aiResponse = await callAI(organizationId, [
        {
          role: "system",
          content: `You are a professional accounts receivable specialist. Draft a concise, professional collections email. 
Tone: firm but polite for REMINDER, more urgent for FOLLOW_UP, direct for ESCALATION.
Output ONLY valid JSON with this exact shape: {"subject": "...", "body": "..."}
Keep body under 150 words. No markdown in the body.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            customerName,
            amount: `$${amount.toFixed(2)}`,
            daysOverdue,
            tier,
            currency: event.currency,
            invoiceRef: event.externalId,
          }),
        },
      ], {
        feature: "agent_collections_dunning",
        maxTokens: 400,
      })

      const text = aiResponse.content.trim()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error("AI returned no JSON")

      const parsed = JSON.parse(jsonMatch[0])
      if (!parsed.subject || !parsed.body) throw new Error("AI returned incomplete draft")

      const draft: DunningDraft = {
        eventId: event.id,
        customerId,
        customerName,
        amount,
        daysOverdue,
        tier,
        subject: parsed.subject,
        body: parsed.body,
      }

      result.drafts.push(draft)
      result.dunningSent++

      if (tier === "ESCALATION") result.escalated++

      await prisma.aIDecisionLog.create({
        data: {
          organizationId,
          financialEventId: event.id,
          agentName: "Collections",
          decisionType: "DUNNING_DRAFT",
          inputSummary: { customerName, amount, daysOverdue, tier } as any,
          output: { subject: parsed.subject, body: parsed.body } as any,
          confidence: 0.88,
          reasoning: `${tier} email drafted for ${customerName} - ${daysOverdue} days overdue, $${amount.toFixed(2)} outstanding`,
        },
      }).catch(() => {})
    } catch (err: any) {
      result.errors.push(`${event.id}: ${err.message}`)

      const fallbackSubject = tier === "REMINDER"
        ? `Payment Reminder: Invoice ${event.externalId}`
        : tier === "FOLLOW_UP"
        ? `Follow-up: Outstanding Payment ${event.externalId}`
        : `Urgent: Overdue Account ${event.externalId}`

      const fallbackBody = `Dear ${customerName},\n\nWe have an outstanding invoice of $${amount.toFixed(2)} that is ${daysOverdue} days past due (ref: ${event.externalId}).\n\nPlease arrange payment at your earliest convenience or contact us to discuss payment terms.\n\nThank you.`

      result.drafts.push({
        eventId: event.id,
        customerId,
        customerName,
        amount,
        daysOverdue,
        tier,
        subject: fallbackSubject,
        body: fallbackBody,
      })
      result.dunningSent++
    }
  }

  if (result.escalated > 0) {
    await prisma.notification.create({
      data: {
        organizationId,
        type: "WARNING",
        title: `${result.escalated} Account${result.escalated > 1 ? "s" : ""} Escalated to Collections`,
        message: `${result.escalated} overdue account${result.escalated > 1 ? "s" : ""} (60+ days) have been escalated. Total outstanding: $${result.totalOverdue.toFixed(2)}.`,
        link: "/collections",
      },
    }).catch(() => {})
  }

  return result
}
