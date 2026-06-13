import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/session"

const APIKEY_PROVIDERS = new Set([
  "STRIPE_CONNECT",
  "CHARGEBEE",
  "RAMP",
  "MERCURY",
  "HUBSPOT",
  "GUSTO",
])

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { organizationId } = session.user
  const body = await req.json()
  const { provider, fields } = body as { provider: string; fields: Record<string, string> }

  if (!APIKEY_PROVIDERS.has(provider)) {
    return NextResponse.json({ error: "Provider not supported for API key auth" }, { status: 400 })
  }

  if (!fields?.apiKey) {
    return NextResponse.json({ error: "API key is required" }, { status: 400 })
  }

  const extraMeta: Record<string, string> = {}
  if (fields.siteName) extraMeta.siteName = fields.siteName
  if (fields.webhookSecret) extraMeta.webhookSecret = fields.webhookSecret

  const realmId = provider === "GUSTO" ? fields.siteName ?? null
    : provider === "CHARGEBEE" ? fields.siteName ?? null
    : null

  await prisma.integrationConnection.upsert({
    where: {
      organizationId_provider: {
        organizationId,
        provider: provider as any,
      },
    },
    create: {
      organizationId,
      provider: provider as any,
      displayName: provider.replace(/_/g, " ").replace("CONNECT", "").trim(),
      accessToken: fields.apiKey,
      realmId,
      scope: JSON.stringify(extraMeta),
      status: "ACTIVE",
    },
    update: {
      accessToken: fields.apiKey,
      realmId,
      scope: JSON.stringify(extraMeta),
      status: "ACTIVE",
      errorMessage: null,
      updatedAt: new Date(),
    },
  })

  return NextResponse.json({ ok: true })
}
