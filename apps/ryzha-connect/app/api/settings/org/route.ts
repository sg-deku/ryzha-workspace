import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

export async function PATCH(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json().catch(() => ({}))

  const { name, baseCurrency, fiscalYearEnd, timezone, dateFormat } = body as {
    name?: string
    baseCurrency?: string
    fiscalYearEnd?: string
    timezone?: string
    dateFormat?: string
  }

  const updates: Promise<unknown>[] = []

  if (name && typeof name === "string" && name.trim().length > 0) {
    updates.push(
      prisma.organization.update({
        where: { id: organizationId },
        data: { name: name.trim() },
      })
    )
  }

  const settingsData: Record<string, unknown> = {}
  if (baseCurrency) settingsData.baseCurrency = baseCurrency
  if (fiscalYearEnd) settingsData.fiscalYearStart = fiscalYearEnd
  if (timezone) settingsData.timezone = timezone
  if (dateFormat) settingsData.dateFormat = dateFormat

  if (Object.keys(settingsData).length > 0) {
    const existing = await prisma.financialSettings.findUnique({
      where: { organizationId },
      select: { id: true },
    })
    if (existing) {
      updates.push(
        prisma.financialSettings.update({
          where: { organizationId },
          data: settingsData as any,
        })
      )
    } else {
      updates.push(
        prisma.financialSettings.create({
          data: { organizationId, deferredRevenueRules: [], ...settingsData } as any,
        })
      )
    }
  }

  await Promise.all(updates)

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const [org, settings] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, currency: true },
    }),
    prisma.financialSettings.findUnique({
      where: { organizationId },
      select: { baseCurrency: true, fiscalYearStart: true },
    }),
  ])

  return NextResponse.json({
    name: org?.name ?? "",
    baseCurrency: settings?.baseCurrency ?? org?.currency ?? "USD",
    fiscalYearEnd: settings?.fiscalYearStart ?? "December",
  })
}
