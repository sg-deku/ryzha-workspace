import { prisma } from "@/lib/prisma"

export async function detectAnomalies(expenseId: string, organizationId: string) {
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
  })

  if (!expense) return

  const anomalies: { type: any; description: string }[] = []

  // 1. Duplicate Payment Check (same amount, same description/vendor, within 24h)
  const oneDayAgo = new Date(expense.date.getTime() - 24 * 60 * 60 * 1000)
  const oneDayAfter = new Date(expense.date.getTime() + 24 * 60 * 60 * 1000)

  const duplicates = await prisma.expense.findMany({
    where: {
      organizationId,
      amount: expense.amount,
      description: expense.description,
      id: { not: expense.id },
      date: { gte: oneDayAgo, lte: oneDayAfter }
    }
  })

  if (duplicates.length > 0) {
    anomalies.push({
      type: "DUPLICATE",
      description: "Possible duplicate payment detected within 24 hours."
    })
  }

  // 2. Unusual Amount Check (Baseline mean/std dev)
  const pastExpenses = await prisma.expense.findMany({
    where: {
      organizationId,
      description: expense.description,
      id: { not: expense.id }
    },
    take: 12,
    orderBy: { date: "desc" }
  })

  if (pastExpenses.length >= 3) {
    const amounts = pastExpenses.map(e => e.amount)
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const stdDev = Math.sqrt(amounts.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length)

    if (expense.amount > mean + 2.5 * stdDev) {
      anomalies.push({
        type: "UNUSUAL_AMOUNT",
        description: `Unusually large payment. Expected around $${mean.toFixed(2)}.`
      })
    }
  }

  // 3. Weekend Expense Check
  const day = expense.date.getDay()
  if (day === 0 || day === 6) { // Sunday or Saturday
    if (expense.description.toLowerCase().includes("office") || 
        expense.description.toLowerCase().includes("supplies")) {
      anomalies.push({
        type: "WEEKEND_EXPENSE",
        description: "Transaction occurred on a weekend for office-related expense."
      })
    }
  }

  // Save detected anomalies
  if (anomalies.length > 0) {
    await prisma.expenseAnomaly.createMany({
      data: anomalies.map(a => ({
        ...a,
        expenseId: expense.id,
        organizationId
      }))
    })
  }

  return anomalies
}
