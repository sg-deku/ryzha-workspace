import { prisma } from "@/lib/prisma"

export async function getRunway(_params: any, orgId: string) {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId: orgId },
    select: { bankBalance: true, averageMonthlyExpenses: true },
  })

  const balance = settings?.bankBalance ?? 0
  const monthlyBurn = settings?.averageMonthlyExpenses ?? 0
  const runwayMonths = monthlyBurn > 0 ? Math.round((balance / monthlyBurn) * 10) / 10 : null

  return {
    bankBalance: balance,
    averageMonthlyExpenses: monthlyBurn,
    runwayMonths,
    zeroCashDate: runwayMonths
      ? new Date(Date.now() + runwayMonths * 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      : null,
  }
}
