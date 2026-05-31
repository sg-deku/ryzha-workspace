import { prisma } from "@/lib/prisma"
import { createSystemJournalEntry } from "@/lib/reports/general-ledger/je-factory"
import { startOfDay } from "date-fns"

const OPEN_EXCHANGE_URL = "https://openexchangerates.org/api/latest.json"
const FRANKFURTER_URL = "https://api.frankfurter.app/latest"
const FREE_EXCHANGE_URL = "https://open.er-api.com/v6/latest"

const NO_STORE = { cache: "no-store" } as const

export async function fetchLiveRateWithSource(
  fromCurrency: string,
  toCurrency: string
): Promise<{ rate: number; source: string } | null> {
  if (fromCurrency === toCurrency) return { rate: 1, source: "IDENTITY" }

  const appId = process.env.OPEN_EXCHANGE_APP_ID
  if (appId) {
    try {
      const res = await fetch(
        `${OPEN_EXCHANGE_URL}?app_id=${appId}&base=USD&symbols=${fromCurrency},${toCurrency}`,
        NO_STORE
      )
      if (res.ok) {
        const data = await res.json()
        const rates: Record<string, number> = data.rates ?? {}
        const fromRate = rates[fromCurrency]
        const toRate = rates[toCurrency]
        if (fromRate && toRate) {
          let rate: number
          if (fromCurrency === "USD") rate = toRate
          else if (toCurrency === "USD") rate = 1 / fromRate
          else rate = toRate / fromRate
          return { rate, source: "OPEN_EXCHANGE" }
        }
      }
    } catch (e) {
      console.warn("[FX] OpenExchangeRates failed:", e)
    }
  }

  try {
    const res = await fetch(`${FREE_EXCHANGE_URL}/${fromCurrency}`, NO_STORE)
    if (res.ok) {
      const data = await res.json()
      if (data.result === "success") {
        const rate: number | undefined = data.rates?.[toCurrency]
        if (rate) return { rate, source: "ECB" }
      }
    }
  } catch (e) {
    console.warn("[FX] open.er-api.com failed:", e)
  }

  try {
    const res = await fetch(
      `${FRANKFURTER_URL}?from=${fromCurrency}&to=${toCurrency}`,
      NO_STORE
    )
    if (res.ok) {
      const data = await res.json()
      const rate: number | undefined = data.rates?.[toCurrency]
      if (rate) return { rate, source: "ECB" }
    }
  } catch (e) {
    console.warn("[FX] Frankfurter (ECB) failed:", e)
  }

  console.error(`[FX] All providers failed for ${fromCurrency}→${toCurrency}`)
  return null
}

export async function fetchLiveRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  const result = await fetchLiveRateWithSource(fromCurrency, toCurrency)
  return result?.rate ?? null
}

export async function getOrFetchRate(
  organizationId: string,
  fromCurrency: string,
  toCurrency: string,
  date: Date = new Date()
): Promise<{ rate: number; source: string }> {
  if (fromCurrency === toCurrency) return { rate: 1, source: "IDENTITY" }

  const dayStart = startOfDay(date)

  const cached = await prisma.exchangeRate.findFirst({
    where: {
      organizationId,
      fromCurrency,
      toCurrency,
      rateDate: dayStart,
    },
    orderBy: { createdAt: "desc" },
  })
  if (cached) return { rate: cached.rate, source: cached.source }

  const live = await fetchLiveRateWithSource(fromCurrency, toCurrency)
  if (live === null) {
    throw new Error(`FX rate unavailable for ${fromCurrency}→${toCurrency}. All providers failed.`)
  }

  await prisma.exchangeRate.upsert({
    where: {
      organizationId_fromCurrency_toCurrency_rateDate: {
        organizationId,
        fromCurrency,
        toCurrency,
        rateDate: dayStart,
      },
    },
    create: {
      id: crypto.randomUUID(),
      organizationId,
      fromCurrency,
      toCurrency,
      rate: live.rate,
      source: live.source,
      rateDate: dayStart,
    },
    update: { rate: live.rate, source: live.source },
  })

  return { rate: live.rate, source: live.source }
}

export async function convertAmount(
  organizationId: string,
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  date: Date = new Date()
): Promise<{ converted: number; rate: number; source: string }> {
  const { rate, source } = await getOrFetchRate(organizationId, fromCurrency, toCurrency, date)
  return { converted: Math.round(amount * rate * 100) / 100, rate, source }
}

export async function revaluateOpenItems(organizationId: string): Promise<{
  invoicesRevalued: number
  expensesRevalued: number
  jeId: string | null
}> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { currency: true },
  })
  const functionalCurrency = org?.currency ?? "USD"
  const today = new Date()

  const openInvoices = await prisma.invoice.findMany({
    where: {
      organizationId,
      status: { in: ["SENT", "PARTIAL", "OVERDUE"] },
      NOT: { currency: functionalCurrency },
    },
  })

  const openExpenses = await prisma.expense.findMany({
    where: {
      organizationId,
      status: { in: ["PENDING", "APPROVED"] },
      NOT: { currency: functionalCurrency },
    },
  })

  const fxLines: Array<{ accountName: string; accountType: string; debit: number; credit: number; description: string }> = []
  let invoicesRevalued = 0
  let expensesRevalued = 0

  for (const inv of openInvoices) {
    const { rate } = await getOrFetchRate(organizationId, inv.currency, functionalCurrency, today)
    const newFunctional = Math.round(inv.total * rate * 100) / 100
    const oldFunctional = inv.totalFunctional ?? inv.total
    const diff = newFunctional - oldFunctional

    if (Math.abs(diff) > 0.01) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { fxRate: rate, totalFunctional: newFunctional },
      })

      if (diff > 0) {
        fxLines.push({
          accountName: "Accounts Receivable",
          accountType: "Assets",
          debit: diff,
          credit: 0,
          description: `FX revaluation — Invoice ${inv.invoiceNumber}`,
        })
        fxLines.push({
          accountName: "FX Gain",
          accountType: "Revenue",
          debit: 0,
          credit: diff,
          description: `FX revaluation — Invoice ${inv.invoiceNumber}`,
        })
      } else {
        fxLines.push({
          accountName: "FX Loss",
          accountType: "Expenses",
          debit: Math.abs(diff),
          credit: 0,
          description: `FX revaluation — Invoice ${inv.invoiceNumber}`,
        })
        fxLines.push({
          accountName: "Accounts Receivable",
          accountType: "Assets",
          debit: 0,
          credit: Math.abs(diff),
          description: `FX revaluation — Invoice ${inv.invoiceNumber}`,
        })
      }
      invoicesRevalued++
    }
  }

  for (const exp of openExpenses) {
    const { rate } = await getOrFetchRate(organizationId, exp.currency, functionalCurrency, today)
    const newFunctional = Math.round(exp.amount * rate * 100) / 100
    const oldFunctional = exp.amountFunctional ?? exp.amount
    const diff = newFunctional - oldFunctional

    if (Math.abs(diff) > 0.01) {
      await prisma.expense.update({
        where: { id: exp.id },
        data: { fxRate: rate, amountFunctional: newFunctional },
      })
      expensesRevalued++
    }
  }

  let jeId: string | null = null
  if (fxLines.length > 0) {
    const je = await createSystemJournalEntry({
      organizationId,
      sourceType: "FXRevaluation",
      sourceId: `reval-${today.toISOString().slice(0, 10)}`,
      reference: `FX-REVAL-${today.toISOString().slice(0, 10)}`,
      description: `Month-end FX revaluation — ${today.toISOString().slice(0, 10)}`,
      entryDate: today,
      type: "ADJUSTING",
      lines: fxLines,
    }).catch(() => null)
    jeId = je?.id ?? null
  }

  return { invoicesRevalued, expensesRevalued, jeId }
}
