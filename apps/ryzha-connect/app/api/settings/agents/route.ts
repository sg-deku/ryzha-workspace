import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

const DEFAULT_SCHEDULES = {
  sync: "*/15 * * * *",
  daily: "0 2 * * *",
  monthly: "1 0 1 * *",
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { agentConfig: true },
  })

  const raw = (settings?.agentConfig as Record<string, unknown> | null) ?? {}
  const { cronSchedules: stored, ...agentConfig } = raw as { cronSchedules?: Record<string, string>; [k: string]: unknown }

  const cronSchedules = {
    sync: stored?.sync ?? DEFAULT_SCHEDULES.sync,
    daily: stored?.daily ?? DEFAULT_SCHEDULES.daily,
    monthly: stored?.monthly ?? DEFAULT_SCHEDULES.monthly,
  }

  return NextResponse.json({ agentConfig, cronSchedules })
}

export async function PUT(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { agentConfig, cronSchedules } = body

  if (!agentConfig || typeof agentConfig !== "object") {
    return NextResponse.json({ error: "Invalid agentConfig" }, { status: 400 })
  }

  const merged = {
    ...agentConfig,
    ...(cronSchedules ? { cronSchedules } : {}),
  }

  const existing = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId },
    select: { id: true },
  })
  if (existing) {
    await prisma.financialSettings.update({
      where: { organizationId: session.user.organizationId },
      data: { agentConfig: merged },
    })
  } else {
    await prisma.financialSettings.create({
      data: { organizationId: session.user.organizationId, agentConfig: merged, deferredRevenueRules: [] },
    })
  }

  return NextResponse.json({ ok: true, agentConfig, cronSchedules })
}
