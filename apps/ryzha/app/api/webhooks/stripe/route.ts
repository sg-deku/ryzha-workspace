import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { startAgentWorkflow } from "@/lib/agents/orchestrator"

export const dynamic = "force-dynamic"

async function resolveWebhookSecret(): Promise<string | null> {
  if (process.env.STRIPE_WEBHOOK_SECRET) return process.env.STRIPE_WEBHOOK_SECRET

  const settings = await prisma.financialSettings.findFirst({
    where: { stripeWebhookSecret: { not: null } },
    select: { stripeWebhookSecret: true },
  })
  return settings?.stripeWebhookSecret ?? null
}

export async function POST(req: Request) {
  const stripe = getStripe()
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!

  const webhookSecret = await resolveWebhookSecret()
  if (!webhookSecret) {
    console.error("[stripe webhook] No webhook secret configured")
    return NextResponse.json(
      { error: "Missing Stripe Webhook Secret. Set STRIPE_WEBHOOK_SECRET in .env or go to Settings → Integrations." },
      { status: 500 }
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error("[stripe webhook] Signature verification failed:", err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as any
    const { id, amount, currency, description, customer_email, metadata } = paymentIntent

    const orgId = metadata?.organizationId
    if (!orgId) {
      console.error("[stripe webhook] Missing organizationId in payment_intent metadata. Event ignored.")
      return NextResponse.json({ received: true, warning: "Missing organizationId in metadata" })
    }

    const transaction = await prisma.transaction.create({
      data: {
        stripePaymentIntentId: id,
        amount: amount / 100,
        currency,
        description: description || metadata?.product_description || "Stripe payment",
        customerEmail: customer_email || metadata?.customer_email,
        organizationId: orgId,
        workflowStatus: "running",
        agentLogs: [],
      },
    })

    console.log(`[stripe webhook] Transaction ${transaction.id} created for org ${orgId}. Starting agent workflow.`)
    startAgentWorkflow(transaction.id).catch(console.error)
  }

  return NextResponse.json({ received: true })
}
