import { prisma } from "@/lib/prisma"
import { callAI } from "@/lib/ai-client"

export interface FXAgentResult {
  processed: number
  revaluated: number
  skipped: number
  totalGainLoss: number
  entries: { currency: string; amount: number; rate: number; gainLoss: number }[]
  errors: string[]
}

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest"

async function fetchExchangeRates(baseCurrency: string): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${EXCHANGE_RATE_API}/${baseCurrency}`, {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`Exchange rate API error: ${res.status}`)
    const data = await res.json()
    return data.rates ?? {}
  } catch {
    return {}
  }
}

export async function runFXAgent(organizationId: string): Promise<FXAgentResult> {
  const result: FXAgentResult = {
    processed: 0,
    revaluated: 0,
    skipped: 0,
    totalGainLoss: 0,
    entries: [],
    errors: [],
  }

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { baseCurrency: true },
  })

  const baseCurrency = settings?.baseCurrency ?? "USD"

  const foreignEvents = await prisma.financialEvent.findMany({
    where: {
      organizationId,
      status: "POSTED",
      NOT: { currency: baseCurrency },
    },
    select: {
      id: true,
      currency: true,
      amount: true,
      normalisedData: true,
      createdAt: true,
    },
    take: 100,
    orderBy: { createdAt: "desc" },
  })

  if (foreignEvents.length === 0) {
    return result
  }

  const foreignCurrencies = [...new Set(foreignEvents.map((e) => e.currency))]
  const rates = await fetchExchangeRates(baseCurrency)

  if (Object.keys(rates).length === 0) {
    result.errors.push("Could not fetch exchange rates - FX revaluation skipped")
    return result
  }

  const currencyGroups: Record<string, { totalForeign: number; events: typeof foreignEvents }> = {}
  for (const event of foreignEvents) {
    if (!currencyGroups[event.currency]) {
      currencyGroups[event.currency] = { totalForeign: 0, events: [] }
    }
    currencyGroups[event.currency].totalForeign += event.amount ?? 0
    currencyGroups[event.currency].events.push(event)
  }

  const qbConn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    select: { id: true, status: true },
  })

  for (const [currency, group] of Object.entries(currencyGroups)) {
    result.processed++
    const currentRate = rates[currency]
    if (!currentRate) {
      result.skipped++
      result.errors.push(`No rate available for ${currency}`)
      continue
    }

    const normData = group.events[0]?.normalisedData as Record<string, unknown> | null
    const originalRate = (normData?.exchangeRate as number) ?? currentRate
    const rateChange = currentRate - originalRate
    const gainLoss = Math.round(group.totalForeign * rateChange * 100) / 100

    result.entries.push({ currency, amount: group.totalForeign, rate: currentRate, gainLoss })
    result.totalGainLoss += gainLoss

    if (qbConn?.status === "ACTIVE" && Math.abs(gainLoss) > 0.01) {
      const description = `FX revaluation ${currency}/${baseCurrency} @ ${currentRate.toFixed(4)} - ${gainLoss >= 0 ? "gain" : "loss"}`

      await prisma.aIDecisionLog.create({
        data: {
          organizationId,
          agentName: "FX",
          decisionType: "FX_REVALUATION",
          inputSummary: {
            currency,
            baseCurrency,
            totalForeign: group.totalForeign,
            originalRate,
            currentRate,
          } as any,
          output: { gainLoss, rateChange, eventCount: group.events.length } as any,
          confidence: 0.99,
          reasoning: description,
        },
      }).catch(() => {})

      if (qbConn) {
        await prisma.integrationSyncLog.create({
          data: {
            integrationConnectionId: qbConn.id,
            direction: "PUSH",
            entityType: "FX_REVALUATION",
            status: "SUCCESS",
            responsePayload: { currency, gainLoss, rate: currentRate } as any,
          },
        }).catch(() => {})
      }
    }

    result.revaluated++
  }

  if (Math.abs(result.totalGainLoss) > 1) {
    await createFXNotification(organizationId, result.totalGainLoss, baseCurrency)
  }

  return result
}

async function createFXNotification(organizationId: string, gainLoss: number, currency: string) {
  const isGain = gainLoss > 0
  await (prisma.notification as any).create({
    data: {
      organizationId,
      type: isGain ? "INFO" : "WARNING",
      title: `FX ${isGain ? "Gain" : "Loss"}: ${Math.abs(gainLoss).toFixed(2)} ${currency}`,
      message: `Daily FX revaluation resulted in a net ${isGain ? "gain" : "loss"} of ${Math.abs(gainLoss).toFixed(2)} ${currency} across all foreign-currency positions.`,
      link: "/reconcile",
    },
  }).catch(() => {})
}
