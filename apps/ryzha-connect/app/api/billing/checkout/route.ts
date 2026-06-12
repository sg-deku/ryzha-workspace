import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

const PRICE_IDS: Record<string, string | undefined> = {
  PRO:   process.env.STRIPE_PRICE_ID_PRO,
  SCALE: process.env.STRIPE_PRICE_ID_SCALE,
}

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY not configured")
  return new Stripe(key, { apiVersion: "2024-06-20" as any })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const { plan } = await req.json() as { plan: string }

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return NextResponse.json({ error: `No Stripe price configured for plan: ${plan}. Set STRIPE_PRICE_ID_${plan} in environment variables.` }, { status: 400 })
  }

  const stripe = getStripe()

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { stripeCustomerId: true, name: true },
  })

  let customerId = org?.stripeCustomerId

  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org?.name ?? "Ryzha Customer",
      metadata: { organizationId },
    })
    customerId = customer.id
    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customerId },
    })
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3001"

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings/billing?success=1`,
    cancel_url: `${origin}/settings/billing?cancelled=1`,
    metadata: { organizationId, plan },
    subscription_data: {
      metadata: { organizationId, plan },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
