import { prisma } from "@/lib/prisma"
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
