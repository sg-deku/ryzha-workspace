import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { encrypt, isEncrypted } from "@/lib/crypto"

export const dynamic = "force-dynamic";

const SECRET_FIELDS = ["stripeSecretKey", "stripeWebhookSecret", "elevenLabsApiKey", "twilioAuthToken", "smtpPass", "aiApiKey"] as const

function redactSecrets(settings: Record<string, any>) {
  const result = { ...settings }
  for (const field of SECRET_FIELDS) {
    if (result[field]) {
      result[field] = "••••••••"
    }
  }
  return result
}

function encryptSecrets(data: Record<string, any>) {
  const result = { ...data }
  for (const field of SECRET_FIELDS) {
    if (result[field] && typeof result[field] === "string" && !isEncrypted(result[field])) {
      result[field] = encrypt(result[field])
    }
  }
  return result
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let settings = await prisma.financialSettings.findUnique({
    where: { organizationId: session.user.organizationId }
  })

  if (!settings) {
    settings = await prisma.financialSettings.create({
      data: {
        organizationId: session.user.organizationId,
        deferredRevenueRules: ["annual", "yearly", "subscription"]
      }
    })
  }

  return NextResponse.json(redactSecrets(settings as Record<string, any>))
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { id, organizationId, ...rawData } = body

  try {
    if (rawData.stripeSecretKey && !isEncrypted(rawData.stripeSecretKey)) {
      try {
        const stripe = new Stripe(rawData.stripeSecretKey, {
          apiVersion: "2025-01-27.acacia" as any,
          typescript: true,
        })
        await stripe.balance.retrieve()
      } catch (stripeError: any) {
        return NextResponse.json({ error: "Invalid Stripe Secret Key: " + stripeError.message }, { status: 400 })
      }
    }

    if (rawData.stripeWebhookSecret && !isEncrypted(rawData.stripeWebhookSecret)) {
      const secret = rawData.stripeWebhookSecret.trim()
      if (!secret.startsWith("whsec_")) {
        return NextResponse.json({ error: "Invalid Webhook Signing Secret. It must start with 'whsec_'" }, { status: 400 })
      }
    }

    const updateData = process.env.ENCRYPTION_KEY ? encryptSecrets(rawData) : rawData

    const updated = await prisma.financialSettings.upsert({
      where: { organizationId: session.user.organizationId },
      update: updateData,
      create: {
        deferredRevenueRules: ["annual", "yearly", "subscription"],
        ...updateData,
        organizationId: session.user.organizationId,
      },
    })
    return NextResponse.json(redactSecrets(updated as Record<string, any>))
  } catch (err: any) {
    console.error("[settings/financial PUT]", err)
    return NextResponse.json({ error: err.message || "Failed to save settings" }, { status: 500 })
  }
}
