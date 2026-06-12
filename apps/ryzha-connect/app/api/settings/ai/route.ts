import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { aiProvider: true, aiModel: true, aiApiKey: true },
  })

  return NextResponse.json({
    aiProvider: settings?.aiProvider ?? "openai",
    aiModel: settings?.aiModel ?? "gpt-4o-mini",
    aiApiKey: settings?.aiApiKey ? "••••••••" : null,
    hasApiKey: !!settings?.aiApiKey,
  })
}

export async function PUT(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json()
  const { aiProvider, aiModel, aiApiKey } = body

  const updateData: any = {}
  if (aiProvider) updateData.aiProvider = aiProvider
  if (aiModel) updateData.aiModel = aiModel
  if (aiApiKey !== undefined) {
    updateData.aiApiKey = aiApiKey === "" ? null : aiApiKey
  }

  await prisma.financialSettings.upsert({
    where: { organizationId },
    create: {
      organizationId,
      baseCurrency: "USD",
      fiscalYearStart: "January",
      bankBalance: 0,
      deferredRevenueRules: ["annual"],
      deferralPeriodMonths: 12,
      contractVerificationSource: "manual",
      requireAuditSeal: true,
      autoRejectUnverified: false,
      targetMonthlyRevenue: 10000,
      lowRunwayAlertThreshold: 3,
      ...updateData,
    },
    update: updateData,
  })

  return NextResponse.json({ ok: true })
}
