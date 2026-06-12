import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { prisma } from "@/lib/prisma"

const QB_AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2"

async function getQBAppConfig(organizationId: string) {
  if (process.env.QB_CLIENT_ID && process.env.QB_REDIRECT_URI) {
    return {
      clientId: process.env.QB_CLIENT_ID,
      redirectUri: process.env.QB_REDIRECT_URI,
    }
  }

  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
  })
  if (!conn?.scope) return null

  try {
    const { clientId, redirectUri } = JSON.parse(conn.scope)
    if (clientId && redirectUri) return { clientId, redirectUri }
  } catch {}
  return null
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const config = await getQBAppConfig(session.user.organizationId)

  if (!config) {
    return NextResponse.json(
      { error: "QuickBooks OAuth not configured. Enter your Client ID and Client Secret on the Connections page." },
      { status: 503 }
    )
  }

  const state = Buffer.from(
    JSON.stringify({ organizationId: session.user.organizationId, ts: Date.now() })
  ).toString("base64url")

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state,
  })

  return NextResponse.redirect(`${QB_AUTH_BASE}?${params.toString()}`)
}
