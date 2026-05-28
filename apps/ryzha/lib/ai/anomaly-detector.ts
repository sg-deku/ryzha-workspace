import { prisma } from "@/lib/prisma"

export async function detectAnomalies(expenseId: string, organizationId: string) {
  const [expense, settings] = await Promise.all([
    prisma.expense.findUnique({ where: { id: expenseId } }),
    prisma.financialSettings.findUnique({ where: { organizationId } }),
  ])

  if (!expense) return

  const anomalyThreshold = settings?.anomalyThreshold ?? 10000
  const anomalies: { type: any; description: string }[] = []

  // 1. Absolute threshold check — flags any expense exceeding the org threshold
  if (expense.amount >= anomalyThreshold) {
    anomalies.push({
      type: "UNUSUAL_AMOUNT",
      description: `High-value expense of $${expense.amount.toFixed(2)} exceeds the anomaly threshold of $${anomalyThreshold.toFixed(2)}. Manual approval required.`,
    })
  }

  // 2. Duplicate Payment Check (same amount, same description, within 24h)
  const oneDayAgo = new Date(expense.date.getTime() - 24 * 60 * 60 * 1000)
  const oneDayAfter = new Date(expense.date.getTime() + 24 * 60 * 60 * 1000)

  const duplicates = await prisma.expense.findMany({
    where: {
      organizationId,
      amount: expense.amount,
      description: expense.description,
      id: { not: expense.id },
      date: { gte: oneDayAgo, lte: oneDayAfter },
    },
  })

  if (duplicates.length > 0) {
    anomalies.push({
      type: "DUPLICATE",
      description: "Possible duplicate payment detected within 24 hours.",
    })
  }

  // 3. Statistical unusual amount check (requires 3+ historical entries for same category)
  const pastExpenses = await prisma.expense.findMany({
    where: {
      organizationId,
      category: expense.category ?? undefined,
      id: { not: expense.id },
    },
    take: 20,
    orderBy: { date: "desc" },
  })

  if (pastExpenses.length >= 3) {
    const amounts = pastExpenses.map((e) => e.amount)
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const stdDev = Math.sqrt(
      amounts.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / amounts.length
    )

    if (expense.amount > mean + 2.5 * stdDev) {
      anomalies.push({
        type: "UNUSUAL_AMOUNT",
        description: `Amount $${expense.amount.toFixed(2)} is statistically unusual for category "${expense.category ?? "Uncategorized"}". Typical is ~$${mean.toFixed(2)}.`,
      })
    }
  }

  // 4. Weekend expense check for office/supplies categories
  const day = expense.date.getDay()
  if (day === 0 || day === 6) {
    const desc = expense.description.toLowerCase()
    if (desc.includes("office") || desc.includes("supplies")) {
      anomalies.push({
        type: "WEEKEND_EXPENSE",
        description: "Office/supplies expense recorded on a weekend.",
      })
    }
  }

  if (anomalies.length > 0) {
    await prisma.expenseAnomaly.createMany({
      data: anomalies.map((a) => ({
        ...a,
        expenseId: expense.id,
        organizationId,
      })),
    })
  }

  return anomalies
}
