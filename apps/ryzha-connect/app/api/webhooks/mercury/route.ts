import { type NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { runCashAgent } from "@/lib/agents/cash-agent"
import { runAnomalyAgent } from "@/lib/agents/anomaly-agent"

export const dynamic = "force-dynamic"

function normaliseMercuryWebhookEvent(eventType: string, data: any): {
  externalId: string
  eventType: string
  amount: number | null
  currency: string
  rawPayload: any
  normalisedData: any
} | null {
  switch (eventType) {
    case "transaction:created":
    case "transaction:updated":
    case "transaction:failed": {
      const tx = data.transaction ?? data
      const amount = Math.abs(tx.amount ?? 0)
      const isCredit = (tx.amount ?? 0) > 0 || tx.kind === "creditCard"
      return {
        externalId: tx.id,
        eventType: "BANK_TRANSACTION",
        amount,
        currency: "USD",
        rawPayload: data,
        normalisedData: {
          accountId: tx.bankAccount?.id ?? null,
          accountName: tx.bankAccount?.name ?? null,
          direction: isCredit ? "credit" : "debit",
          description: tx.externalMemo ?? tx.note ?? tx.bankDescription ?? null,
          counterpartyName: tx.counterpartyName ?? null,
          postedAt: tx.postedAt ?? null,
          status: tx.status ?? null,
          kind: tx.kind ?? null,
        },
      }
    }
    default:
      return null
  }
}

async function verifyMercurySignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false
  const expected = createHmac("sha256", secret).update(body).digest("hex")
  try {
    return timingSafeEqual(
      Buffer.from(signatureHeader.replace("sha256=", ""), "hex"),
      Buffer.from(expected, "hex")
    )
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  const conn = await prisma.integrationConnection.findFirst({
    where: { organizationId: orgId, provider: "MERCURY", status: "ACTIVE" },
    select: { scope: true },
  })
  if (!conn) return NextResponse.json({ error: "Mercury not connected" }, { status: 503 })

  const body = await req.text()

  let scopeData: Record<string, string> = {}
  try { scopeData = conn.scope ? JSON.parse(conn.scope) : {} } catch {}

  const webhookSecret = scopeData?.webhookSecret ?? process.env.MERCURY_WEBHOOK_SECRET

  if (webhookSecret) {
    const sig = req.headers.get("x-mercury-signature") ?? req.headers.get("mercury-signature")
    const valid = await verifyMercurySignature(body, sig, webhookSecret)
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType: string = payload.eventType ?? payload.type ?? payload.event ?? ""
  const normalised = normaliseMercuryWebhookEvent(eventType, payload.data ?? payload)

  if (!normalised) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    await prisma.financialEvent.upsert({
      where: {
        organizationId_source_externalId: {
          organizationId: orgId,
          source: "mercury",
          externalId: normalised.externalId,
        },
      },
      create: {
        organizationId: orgId,
        source: "mercury",
        externalId: normalised.externalId,
        eventType: normalised.eventType as any,
        status: "INGESTED",
        amount: normalised.amount,
        currency: normalised.currency,
        rawPayload: normalised.rawPayload,
        normalisedData: normalised.normalisedData,
      },
      update: {},
    })

    after(async () => {
      try {
        await runCashAgent(orgId)
        await runAnomalyAgent(orgId)
      } catch (err: any) {
        console.error("[mercury webhook] agent pipeline error:", err?.message)
      }
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[mercury webhook] DB error:", err.message)
    return NextResponse.json({ error: "Failed to store event" }, { status: 500 })
  }
}
