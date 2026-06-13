import { NextRequest, NextResponse } from "next/server"
import { after } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"
import { createStripeClient, normaliseStripeEvent } from "@ryzha/integrations"
import { runGLCodingAgent } from "@/lib/agents/gl-coding-agent"
import { runRevenueAgent } from "@/lib/agents/revenue-agent"
import { runCommissionAgent } from "@/lib/agents/commission-agent"

export const dynamic = "force-dynamic"

const HANDLED_EVENTS = new Set([
  "payment_intent.succeeded",
  "invoice.paid",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "charge.refunded",
])

async function getStripeConfig(organizationId: string) {
  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "STRIPE_CONNECT" } },
    select: { accessToken: true, scope: true },
  })
  if (!conn?.accessToken) return null
  let webhookSecret: string | undefined
  try {
    webhookSecret = conn.scope ? JSON.parse(conn.scope).webhookSecret : undefined
  } catch {}
  return { apiKey: conn.accessToken, webhookSecret }
}

export async function POST(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get("orgId")
  if (!orgId) return NextResponse.json({ error: "Missing orgId" }, { status: 400 })

  const config = await getStripeConfig(orgId)
  const webhookSecret = config?.webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !config?.apiKey) {
    return NextResponse.json({ error: "Stripe not configured for this organisation" }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Missing Stripe-Signature header" }, { status: 400 })

  let event: Stripe.Event
  try {
    const stripe = createStripeClient(config.apiKey)
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook verification failed: ${err.message}` }, { status: 400 })
  }

  if (!HANDLED_EVENTS.has(event.type)) {
    return NextResponse.json({ received: true, skipped: true })
  }

  const obj = event.data.object as any
  const normalised = normaliseStripeEvent(event.type, obj)

  if (!normalised) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    const isNew = await prisma.financialEvent.upsert({
      where: {
        organizationId_source_externalId: {
          organizationId: orgId,
          source: normalised.source,
          externalId: normalised.externalId,
        },
      },
      create: {
        organizationId: orgId,
        source: normalised.source,
        externalId: normalised.externalId,
        eventType: normalised.eventType as any,
        status: "INGESTED",
        amount: normalised.amount ?? null,
        currency: normalised.currency ?? "USD",
        rawPayload: normalised.rawPayload as any,
        normalisedData: normalised.normalisedData as any,
      },
      update: {},
    })

    after(async () => {
      try {
        await runGLCodingAgent(orgId)
        await runRevenueAgent(orgId)
        await runCommissionAgent(orgId)
      } catch (err: any) {
        console.error("[stripe webhook] agent pipeline error:", err?.message)
      }
    })

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error("[stripe webhook] DB error:", err.message)
    return NextResponse.json({ error: "Failed to store event" }, { status: 500 })
  }
}
