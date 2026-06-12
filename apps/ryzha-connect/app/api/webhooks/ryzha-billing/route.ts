import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const PLAN_MAP: Record<string, "FREE" | "PRO" | "SCALE"> = {
  [process.env.STRIPE_PRICE_ID_PRO  ?? "__pro__"]:   "PRO",
  [process.env.STRIPE_PRICE_ID_SCALE ?? "__scale__"]: "SCALE",
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: "2024-06-20" as any })
}

async function updateOrgPlan(
  subscriptionOrId: Stripe.Subscription | string,
  stripe: Stripe,
  status: "ACTIVE" | "CANCELLED"
) {
  const subscription = typeof subscriptionOrId === "string"
    ? await stripe.subscriptions.retrieve(subscriptionOrId)
    : subscriptionOrId

  const orgId = subscription.metadata?.organizationId
  if (!orgId) return

  const priceId = subscription.items.data[0]?.price?.id
  const plan = PLAN_MAP[priceId ?? ""] ?? "FREE"
  const newPlan = status === "ACTIVE" ? plan : "FREE"

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      plan: newPlan as any,
      stripeSubscriptionId: status === "ACTIVE" ? subscription.id : null,
    },
  })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_BILLING_WEBHOOK_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe billing not configured" }, { status: 503 })
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig) return NextResponse.json({ error: "Missing Stripe-Signature" }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook verification failed: ${err.message}` }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const isActive = ["active", "trialing"].includes(subscription.status)
        await updateOrgPlan(subscription, stripe, isActive ? "ACTIVE" : "CANCELLED")
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await updateOrgPlan(subscription, stripe, "CANCELLED")
        break
      }

      case "checkout.session.completed": {
        const checkout = event.data.object as Stripe.Checkout.Session
        if (checkout.mode === "subscription" && checkout.subscription) {
          await updateOrgPlan(checkout.subscription as string, stripe, "ACTIVE")
        }
        break
      }
    }
  } catch (err: any) {
    console.error("[ryzha-billing webhook]", err.message)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
