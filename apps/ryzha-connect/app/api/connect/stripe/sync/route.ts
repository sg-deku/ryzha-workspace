import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { pullStripeHistorical } from "@ryzha/integrations"

export async function runStripeSync(organizationId: string, daysSince: number) {
  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "STRIPE_CONNECT" } },
    select: { accessToken: true, status: true },
  })

  if (!conn?.accessToken) {
    throw new Error("Stripe not connected")
  }

  const apiKey = conn.accessToken

  const events = await pullStripeHistorical(apiKey, { daysSince })

  let created = 0
  let skipped = 0

  for (const ev of events) {
    try {
      await prisma.financialEvent.upsert({
        where: {
          organizationId_source_externalId: {
            organizationId,
            source: ev.source,
            externalId: ev.externalId,
          },
        },
        create: {
          organizationId,
          source: ev.source,
          externalId: ev.externalId,
          eventType: ev.eventType as any,
          status: "INGESTED",
          amount: ev.amount ?? null,
          currency: ev.currency ?? "USD",
          rawPayload: ev.rawPayload as any,
          normalisedData: ev.normalisedData as any,
        },
        update: {},
      })
      created++
    } catch {
      skipped++
    }
  }

  await prisma.integrationConnection.update({
    where: { organizationId_provider: { organizationId, provider: "STRIPE_CONNECT" } },
    data: { lastSyncAt: new Date() },
  })

  return { ok: true, ingested: created, skipped, total: events.length }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const daysSince = parseInt(req.nextUrl.searchParams.get("daysSince") ?? "90", 10)

  try {
    const result = await runStripeSync(session.user.organizationId, daysSince)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const daysSince: number = body.daysSince ?? 90

  try {
    const result = await runStripeSync(session.user.organizationId, daysSince)
    return NextResponse.json(result)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
