import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncQBChartOfAccounts } from "@ryzha/integrations"
import axios from "axios"

const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"

async function getQBAppCredentials(organizationId: string) {
  if (process.env.QB_CLIENT_ID && process.env.QB_CLIENT_SECRET && process.env.QB_REDIRECT_URI) {
    return {
      clientId: process.env.QB_CLIENT_ID,
      clientSecret: process.env.QB_CLIENT_SECRET,
      redirectUri: process.env.QB_REDIRECT_URI,
    }
  }

  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
  })
  if (!conn?.scope) return null

  try {
    const { clientId, clientSecret, redirectUri } = JSON.parse(conn.scope)
    if (clientId && clientSecret && redirectUri) return { clientId, clientSecret, redirectUri }
  } catch {}
  return null
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")
  const realmId = searchParams.get("realmId")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) return NextResponse.redirect(new URL(`/connect?error=${error}`, req.url))
  if (!code || !realmId || !state) return NextResponse.redirect(new URL("/connect?error=missing_params", req.url))

  let organizationId: string
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString())
    organizationId = decoded.organizationId
    if (!organizationId) throw new Error("no org")
  } catch {
    return NextResponse.redirect(new URL("/connect?error=invalid_state", req.url))
  }

  const creds = await getQBAppCredentials(organizationId)
  if (!creds) return NextResponse.redirect(new URL("/connect?error=app_not_configured", req.url))

  try {
    const credentials = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")
    const { data: tokens } = await axios.post(
      QB_TOKEN_URL,
      new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: creds.redirectUri }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }
    )

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    const connection = await prisma.integrationConnection.upsert({
      where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
      create: {
        organizationId,
        provider: "QUICKBOOKS",
        displayName: "QuickBooks Online",
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId,
        expiresAt,
        status: "ACTIVE",
        scope: JSON.stringify({ clientId: creds.clientId, clientSecret: creds.clientSecret, redirectUri: creds.redirectUri }),
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        realmId,
        expiresAt,
        status: "ACTIVE",
        errorMessage: null,
        scope: JSON.stringify({ clientId: creds.clientId, clientSecret: creds.clientSecret, redirectUri: creds.redirectUri }),
        updatedAt: new Date(),
      },
    })

    try {
      const coaAccounts = await syncQBChartOfAccounts(tokens.access_token, realmId)
      await prisma.cOAMapping.deleteMany({ where: { organizationId, integrationConnectionId: connection.id } })
      if (coaAccounts.length > 0) {
        await prisma.cOAMapping.createMany({
          data: coaAccounts.map((a) => ({
            organizationId,
            integrationConnectionId: connection.id,
            externalCode: a.externalCode,
            externalName: a.externalName,
            accountType: a.accountType,
            accountSubType: a.accountSubType ?? null,
            isActive: a.isActive,
          })),
          skipDuplicates: true,
        })
      }
    } catch {}

    return NextResponse.redirect(new URL("/settings/integrations?connected=quickbooks", req.url))
  } catch (err: any) {
    console.error("QB callback error:", err?.message)
    return NextResponse.redirect(new URL("/connect?error=token_exchange_failed", req.url))
  }
}
