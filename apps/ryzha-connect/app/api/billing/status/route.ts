import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  return new Stripe(key, { apiVersion: "2024-06-20" as any })
}

const PLAN_LIMITS: Record<string, { agents: number; connections: number; users: number }> = {
  FREE:  { agents: 3,   connections: 3,   users: 2  },
  PRO:   { agents: 15,  connections: 15,  users: 10 },
  SCALE: { agents: 999, connections: 999, users: 999 },
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { plan: true, stripeCustomerId: true, stripeSubscriptionId: true, name: true },
  })

  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 })

  let subscription: Stripe.Subscription | null = null
  const stripe = getStripe()

  if (stripe && org.stripeSubscriptionId) {
    try {
      subscription = await stripe.subscriptions.retrieve(org.stripeSubscriptionId)
    } catch {
      // subscription may have been deleted
    }
  }

  const plan = org.plan ?? "FREE"
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE

  return NextResponse.json({
    plan,
    limits,
    stripeCustomerId: org.stripeCustomerId,
    stripeSubscriptionId: org.stripeSubscriptionId,
    subscriptionStatus: subscription?.status ?? null,
    currentPeriodEnd: subscription?.current_period_end
      ? new Date(subscription.current_period_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
  })
}
