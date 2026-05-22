import { prisma } from "./prisma"

function todayUTC(): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
}

export async function trackApiCall(organizationId: string, tokensUsed = 0): Promise<void> {
  const date = todayUTC()
  await prisma.usageMetrics.upsert({
    where: { organizationId_date: { organizationId, date } },
    update: {
      apiCalls: { increment: 1 },
      aiTokensUsed: { increment: tokensUsed },
    },
    create: {
      organizationId,
      date,
      apiCalls: 1,
      aiTokensUsed: tokensUsed,
    },
  })
}

export async function trackAiTokens(organizationId: string, tokensUsed: number): Promise<void> {
  const date = todayUTC()
  await prisma.usageMetrics.upsert({
    where: { organizationId_date: { organizationId, date } },
    update: { aiTokensUsed: { increment: tokensUsed } },
    create: { organizationId, date, aiTokensUsed: tokensUsed },
  })
}

export async function checkLicenseLimits(
  organizationId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const license = await prisma.license.findUnique({
    where: { organizationId },
  })

  if (!license || license.status !== "ACTIVE") {
    return { allowed: true }
  }

  const date = todayUTC()
  const usage = await prisma.usageMetrics.findUnique({
    where: { organizationId_date: { organizationId, date } },
  })

  if (!usage) return { allowed: true }

  if (usage.apiCalls >= license.maxApiCalls) {
    return { allowed: false, reason: "API call limit exceeded for today." }
  }

  if (usage.aiTokensUsed >= license.maxAiTokens) {
    return { allowed: false, reason: "AI token limit exceeded for today." }
  }

  const userCount = await prisma.userOrganization.count({ where: { organizationId } })
  if (userCount > license.maxUsers) {
    return { allowed: false, reason: "User seat limit exceeded." }
  }

  return { allowed: true }
}
