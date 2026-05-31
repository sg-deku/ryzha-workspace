import { prisma } from "@/lib/prisma"
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, getQuarter } from "date-fns"

export type BudgetPeriod = "MONTHLY" | "QUARTERLY" | "ANNUAL"

export function periodLabel(date: Date, period: BudgetPeriod): string {
  if (period === "MONTHLY") return format(date, "yyyy-MM")
  if (period === "QUARTERLY") return `${format(date, "yyyy")}-Q${getQuarter(date)}`
  return format(date, "yyyy")
}

export function periodRange(label: string, period: BudgetPeriod): { start: Date; end: Date } {
  if (period === "MONTHLY") {
    const d = new Date(`${label}-01`)
    return { start: startOfMonth(d), end: endOfMonth(d) }
  }
  if (period === "QUARTERLY") {
    const [year, q] = label.split("-Q")
    const quarterStart = new Date(Number(year), (Number(q) - 1) * 3, 1)
    return { start: startOfQuarter(quarterStart), end: endOfQuarter(quarterStart) }
  }
  const d = new Date(`${label}-01-01`)
  return { start: new Date(`${label}-01-01`), end: new Date(`${label}-12-31`) }
}

export async function getBudgetVariance(budgetId: string) {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: { lines: true },
  })
  if (!budget) throw new Error("Budget not found")

  const labels = [...new Set(budget.lines.map((l) => l.periodLabel))].sort()

  const results: Array<{
    periodLabel: string
    accountName: string
    accountType: string
    budgeted: number
    actual: number
    variance: number
    variancePct: number | null
  }> = []

  for (const label of labels) {
    const { start, end } = periodRange(label, budget.period as BudgetPeriod)

    const glActuals = await prisma.generalLedgerEntry.groupBy({
      by: ["accountName", "accountType"],
      where: {
        organizationId: budget.organizationId,
        date: { gte: start, lte: end },
      },
      _sum: { debit: true, credit: true },
    })

    const actualMap = new Map<string, number>()
    for (const row of glActuals) {
      const net = (row._sum.debit ?? 0) - (row._sum.credit ?? 0)
      actualMap.set(row.accountName, net)
    }

    const periodLines = budget.lines.filter((l) => l.periodLabel === label)
    for (const line of periodLines) {
      const actual = Math.abs(actualMap.get(line.accountName) ?? 0)
      const variance = line.budgeted - actual
      const variancePct = line.budgeted !== 0 ? (variance / line.budgeted) * 100 : null

      results.push({
        periodLabel: label,
        accountName: line.accountName,
        accountType: line.accountType,
        budgeted: line.budgeted,
        actual,
        variance,
        variancePct: variancePct != null ? Math.round(variancePct * 10) / 10 : null,
      })
    }
  }

  return { budget, results }
}

export function parseBudgetCsv(
  csv: string,
  budgetId: string
): Array<{ budgetId: string; accountName: string; accountType: string; periodLabel: string; budgeted: number }> {
  const lines = csv.trim().split("\n")
  if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row")

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
  const accountNameIdx = headers.findIndex((h) => /account.*name/i.test(h))
  const accountTypeIdx = headers.findIndex((h) => /account.*type/i.test(h))
  const periodIdx = headers.findIndex((h) => /period/i.test(h))
  const budgetedIdx = headers.findIndex((h) => /budget/i.test(h))

  if (accountNameIdx < 0 || periodIdx < 0 || budgetedIdx < 0) {
    throw new Error("CSV must have columns: Account Name, Account Type, Period, Budgeted")
  }

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
    const accountName = cols[accountNameIdx]
    const accountType = accountTypeIdx >= 0 ? cols[accountTypeIdx] : "Expenses"
    const period = cols[periodIdx]
    const budgeted = parseFloat(cols[budgetedIdx])

    if (!accountName || !period || isNaN(budgeted)) continue

    rows.push({ budgetId, accountName, accountType, periodLabel: period, budgeted })
  }
  return rows
}
