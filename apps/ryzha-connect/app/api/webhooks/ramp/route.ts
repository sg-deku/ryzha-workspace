import { type NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import { createHmac, timingSafeEqual } from "crypto"
import { prisma } from "@/lib/prisma"
import { runAPAgent } from "@/lib/agents/ap-agent"
import { runAnomalyAgent } from "@/lib/agents/anomaly-agent"

export const dynamic = "force-dynamic"

function normaliseRampWebhookEvent(eventType: string, data: any): {
  externalId: string
  eventType: string
  amount: number | null
  currency: string
  rawPayload: any
  normalisedData: any
} | null {
  switch (eventType) {
    case "TRANSACTION_CREATED":
    case "TRANSACTION_UPDATED": {
      const tx = data.transaction ?? data
      return {
        externalId: tx.id,
        eventType: "EXPENSE_CREATED",
        amount: tx.amount != null ? Math.abs(tx.amount) / 100 : null,
        currency: tx.currency_code ?? "USD",
        rawPayload: data,
        normalisedData: {
          merchantName: tx.merchant_name ?? null,
          merchantCategory: tx.merchant_category_code ?? null,
          categoryHint: tx.sk_category_name ?? null,
          cardholderName: tx.cardholder_name ?? null,
          department: tx.department?.name ?? null,
          memoNote: tx.memo ?? null,
          policyViolations: tx.policy_violations ?? [],
          status: tx.state ?? null,
        },
      }
    }
    case "BILL_CREATED":
    case "BILL_UPDATED": {
      const bill = data.bill ?? data
      return {
        externalId: `ramp_bill_${bill.id}`,
        eventType: "BILL_CREATED",
        amount: bill.amount?.amount ? parseFloat(bill.amount.amount) : null,
        currency: bill.amount?.currency_code ?? "USD",
        rawPayload: data,
        normalisedData: {
          vendorName: bill.vendor?.name ?? null,
          dueDate: bill.due_date ?? null,
          invoiceNumber: bill.invoice_number ?? null,
          description: bill.description ?? null,
          paymentStatus: bill.payment_status ?? null,
        },
      }
    }
    default:
      return null
  }
}

async function verifyRampSignature(
  body: string,
  signatureHeader: string | null,
  secret: string
): Promise<boolean> {
  if (!signatureHeader) return false
  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  )
  const timestamp = parts.t
  const signature = parts.v1
  if (!timestamp || !signature) return false

  const signedPayload = `${timestamp}.${body}`
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex")

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  const conn = await prisma.integrationConnection.findFirst({
    where: { organizationId: orgId, provider: "RAMP", status: "ACTIVE" },
    select: { scope: true },
  })
  if (!conn) return NextResponse.json({ error: "Ramp not connected" }, { status: 503 })

  const body = await req.text()
  const scopeData = conn.scope ? JSON.parse(conn.scope).catch?.(() => {}) ?? JSON.parse(conn.scope) : {}
  const webhookSecret = scopeData?.webhookSecret ?? process.env.RAMP_WEBHOOK_SECRET

  if (webhookSecret) {
    const sig = req.headers.get("ramp-hmac-signature")
    const valid = await verifyRampSignature(body, sig, webhookSecret)
    if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const eventType: string = payload.type ?? payload.event_type ?? ""
  const normalised = normaliseRampWebhookEvent(eventType, payload.data ?? payload)

  if (!normalised) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    await prisma.financialEvent.upsert({
      where: {
        organizationId_source_externalId: {
          organizationId: orgId,
          source: "ramp",
          externalId: normalised.externalId,
        },
      },
      create: {
        organizationId: orgId,
        source: "ramp",
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
        await runAPAgent(orgId)
        await runAnomalyAgent(orgId)
      } catch (err: any) {
        console.error("[ramp webhook] agent pipeline error:", err?.message)
      }
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[ramp webhook] DB error:", err.message)
    return NextResponse.json({ error: "Failed to store event" }, { status: 500 })
  }
}
