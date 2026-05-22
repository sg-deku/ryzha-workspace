import Stripe from "stripe"
import { prisma } from "@/lib/prisma"

let stripeInstance: Stripe | null = null

export const getStripe = () => {
  if (!stripeInstance) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey && process.env.NODE_ENV === "production") {
      throw new Error("STRIPE_SECRET_KEY is not set")
    }
    stripeInstance = new Stripe(apiKey || "dummy_key", {
      apiVersion: "2025-01-27.acacia" as any,
      typescript: true,
    })
  }
  return stripeInstance
}

export async function getStripeForOrg(organizationId: string): Promise<Stripe> {
  const settings = await prisma.financialSettings.findUnique({
    where: { organizationId },
    select: { stripeSecretKey: true },
  })

  const apiKey =
    settings?.stripeSecretKey?.trim() ||
    process.env.STRIPE_SECRET_KEY

  if (!apiKey) {
    throw new Error(
      "No Stripe Secret Key configured. Go to Settings → Integrations and connect your Stripe account."
    )
  }

  return new Stripe(apiKey, {
    apiVersion: "2025-01-27.acacia" as any,
    typescript: true,
  })
}

export async function getStripeWebhookSecret(organizationId?: string): Promise<string> {
  if (organizationId) {
    const settings = await prisma.financialSettings.findUnique({
      where: { organizationId },
      select: { stripeWebhookSecret: true },
    })
    if (settings?.stripeWebhookSecret?.trim()) {
      return settings.stripeWebhookSecret.trim()
    }
  }
  const envSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!envSecret) {
    throw new Error(
      "No Stripe Webhook Secret configured. Go to Settings → Integrations and add your webhook signing secret."
    )
  }
  return envSecret
}
