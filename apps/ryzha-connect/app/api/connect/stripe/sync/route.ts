import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"
import { pullStripeHistorical } from "@ryzha/integrations"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json().catch(() => ({}))
  const daysSince: number = body.daysSince ?? 90

  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "STRIPE_CONNECT" } },
    select: { scope: true, status: true },
  })

  if (!conn?.scope) {
    return NextResponse.json({ error: "Stripe not connected" }, { status: 400 })
  }

  let apiKey: string
  try {
    const parsed = JSON.parse(conn.scope)
    apiKey = parsed.apiKey
    if (!apiKey) throw new Error("missing apiKey")
  } catch {
    return NextResponse.json({ error: "Invalid Stripe configuration" }, { status: 400 })
  }

  try {
    const events = await pullStripeHistorical(apiKey, { daysSince })

    let created = 0
    let skipped = 0

    for (const ev of events) {
      try {
        const result = await prisma.financialEvent.upsert({
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
        if (result) created++
      } catch {
        skipped++
      }
    }

    await prisma.integrationConnection.update({
      where: { organizationId_provider: { organizationId, provider: "STRIPE_CONNECT" } },
      data: { lastSyncAt: new Date() },
    })

    return NextResponse.json({ ok: true, ingested: created, skipped, total: events.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
