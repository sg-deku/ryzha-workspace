import { prisma } from "@/lib/prisma"

const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
const BUFFER_MS = 5 * 60 * 1000

interface QBTokenResult {
  accessToken: string
  realmId: string
  connectionId: string
}

async function refreshQBToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")
  const res = await fetch(QB_TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`QB token refresh failed: ${text}`)
  }
  return res.json()
}

export async function getValidQBToken(organizationId: string): Promise<QBTokenResult | null> {
  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
  })

  if (!conn || conn.status !== "ACTIVE" || !conn.realmId) return null

  const isExpired = conn.expiresAt
    ? conn.expiresAt.getTime() - Date.now() < BUFFER_MS
    : false

  if (!isExpired) {
    return { accessToken: conn.accessToken, realmId: conn.realmId, connectionId: conn.id }
  }

  if (!conn.refreshToken) {
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { status: "EXPIRED", errorMessage: "Access token expired and no refresh token stored" },
    })
    return null
  }

  let clientId = process.env.QB_CLIENT_ID
  let clientSecret = process.env.QB_CLIENT_SECRET

  if ((!clientId || !clientSecret) && conn.scope) {
    try {
      const parsed = JSON.parse(conn.scope)
      clientId = parsed.clientId
      clientSecret = parsed.clientSecret
    } catch {}
  }

  if (!clientId || !clientSecret) {
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { status: "ERROR", errorMessage: "QB credentials not configured - cannot refresh token" },
    })
    return null
  }

  try {
    const tokens = await refreshQBToken(conn.refreshToken, clientId, clientSecret)
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        status: "ACTIVE",
        errorMessage: null,
        updatedAt: new Date(),
      },
    })

    return { accessToken: tokens.access_token, realmId: conn.realmId, connectionId: conn.id }
  } catch (err: any) {
    await prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { status: "ERROR", errorMessage: `Token refresh failed: ${err.message}` },
    })
    return null
  }
}
