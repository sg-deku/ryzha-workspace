import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface AnomalyFlag {
  eventId: string
  type: "AMOUNT_SPIKE" | "DUPLICATE_SUSPECT" | "UNUSUAL_VENDOR" | "POLICY_BREACH" | "TIMING_ANOMALY"
  severity: "HIGH" | "MEDIUM" | "LOW"
  description: string
  confidence: number
}

export interface AnomalyAgentResult {
  scanned: number
  flagged: number
  flags: AnomalyFlag[]
}

function detectStatisticalAnomalies(
  events: { id: string; source: string; amount: number | null; eventType: string; normalisedData: any }[],
  history: { source: string; eventType: string; _avg: { amount: number | null }; _count: { id: number } }[]
): AnomalyFlag[] {
  const flags: AnomalyFlag[] = []
  const histMap = new Map(history.map((h) => [`${h.source}_${h.eventType}`, h]))

  for (const event of events) {
    const key = `${event.source}_${event.eventType}`
    const hist = histMap.get(key)
    const amount = event.amount ?? 0

    if (hist?._avg.amount && amount > 0) {
      const avg = hist._avg.amount
      const ratio = amount / avg
      if (ratio > 3 && amount > 500) {
        flags.push({
          eventId: event.id,
          type: "AMOUNT_SPIKE",
          severity: ratio > 10 ? "HIGH" : "MEDIUM",
          description: `Amount $${amount.toFixed(0)} is ${ratio.toFixed(1)}× the average of $${avg.toFixed(0)} for ${event.source} ${event.eventType} events`,
          confidence: Math.min(0.95, 0.6 + (ratio / 20)),
        })
      }
    }
  }

  const seenAmounts = new Map<string, string[]>()
  for (const event of events) {
    const key = `${event.source}_${(event.amount ?? 0).toFixed(2)}`
    if (!seenAmounts.has(key)) seenAmounts.set(key, [])
    seenAmounts.get(key)!.push(event.id)
  }
  for (const [, ids] of seenAmounts) {
    if (ids.length > 1) {
      for (const id of ids.slice(1)) {
        flags.push({
          eventId: id,
          type: "DUPLICATE_SUSPECT",
          severity: "HIGH",
          description: `Possible duplicate - same amount as another recent event from same source`,
          confidence: 0.75,
        })
      }
    }
  }

  return flags
}

export async function runAnomalyAgent(organizationId: string): Promise<AnomalyAgentResult> {
  const result: AnomalyAgentResult = { scanned: 0, flagged: 0, flags: [] }

  const since = new Date(Date.now() - 24 * 3600 * 1000)
  const histSince = new Date(Date.now() - 90 * 24 * 3600 * 1000)

  const [recentEvents, history] = await Promise.all([
    prisma.financialEvent.findMany({
      where: { organizationId, createdAt: { gte: since } },
      select: { id: true, source: true, amount: true, eventType: true, normalisedData: true, status: true },
      take: 200,
    }),
    prisma.financialEvent.groupBy({
      by: ["source", "eventType"],
      where: { organizationId, createdAt: { gte: histSince } },
      _avg: { amount: true },
      _count: { id: true },
    }),
  ])

  result.scanned = recentEvents.length
  if (result.scanned === 0) return result

  const statisticalFlags = detectStatisticalAnomalies(recentEvents as any, history as any)
  result.flags.push(...statisticalFlags)

  if (recentEvents.length > 0) {
    try {
      const summary = recentEvents.slice(0, 20).map((e) => ({
        id: e.id,
        source: e.source,
        type: e.eventType,
        amount: e.amount,
        vendor: (e.normalisedData as any)?.merchantName ?? (e.normalisedData as any)?.counterpartyName ?? null,
      }))

      const aiResponse = await callAI(organizationId, [
        {
          role: "system",
          content: `You are a financial anomaly detection AI for a startup's finance platform. Analyse the events and identify any that look suspicious, unusual, or worth flagging for a CFO. Return JSON array of flags: [{eventId, type, severity (HIGH/MEDIUM/LOW), description, confidence (0-1)}]. Only flag genuine concerns - don't flag normal transactions. Return [] if nothing looks unusual.`,
        },
        { role: "user", content: JSON.stringify(summary) },
      ], {
        feature: "agent_anomaly",
        maxTokens: 600,
      })

      const text = aiResponse.content ?? "[]"
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const aiFlags: AnomalyFlag[] = JSON.parse(jsonMatch[0])
        result.flags.push(...aiFlags.filter((f) => f.eventId && f.severity))
      }
    } catch (err: any) {
      console.error("[anomaly-agent] AI error:", err.message)
    }
  }

  const uniqueFlags = result.flags.filter(
    (f, i, arr) => arr.findIndex((x) => x.eventId === f.eventId && x.type === f.type) === i
  )
  result.flags = uniqueFlags
  result.flagged = uniqueFlags.length

  for (const flag of uniqueFlags) {
    await prisma.aIDecisionLog.create({
      data: {
        organizationId,
        financialEventId: flag.eventId,
        agentName: "Anomaly",
        decisionType: "ANOMALY_CHECK",
        inputSummary: { type: flag.type, severity: flag.severity } as any,
        output: { flagged: true, description: flag.description } as any,
        confidence: flag.confidence,
        reasoning: flag.description,
      },
    }).catch(() => {})
  }

  return result
}
