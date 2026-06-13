import { prisma } from "@/lib/prisma"
import axios from "axios"

const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"

const REFRESH_BUFFER_MS = 5 * 60 * 1000

async function getQBCredentials(organizationId: string): Promise<{ clientId: string; clientSecret: string } | null> {
  if (process.env.QB_CLIENT_ID && process.env.QB_CLIENT_SECRET) {
    return { clientId: process.env.QB_CLIENT_ID, clientSecret: process.env.QB_CLIENT_SECRET }
  }

  const conn = await prisma.integrationConnection.findUnique({
    where: { organizationId_provider: { organizationId, provider: "QUICKBOOKS" } },
    select: { scope: true },
  })

  if (!conn?.scope) return null
  try {
    const { clientId, clientSecret } = JSON.parse(conn.scope)
    if (clientId && clientSecret) return { clientId, clientSecret }
  } catch {}
  return null
}

export async function ensureFreshQBToken(
  organizationId: string,
  connectionId: string,
  currentAccessToken: string,
  refreshToken: string | null,
  expiresAt: Date | null
): Promise<string> {
  const isExpired = expiresAt
    ? expiresAt.getTime() - Date.now() < REFRESH_BUFFER_MS
    : false

  if (!isExpired) return currentAccessToken

  if (!refreshToken) {
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { status: "EXPIRED", errorMessage: "Access token expired and no refresh token available — please reconnect." },
    })
    throw new Error("QuickBooks token expired — please reconnect from the Connections page.")
  }

  const creds = await getQBCredentials(organizationId)
  if (!creds) {
    throw new Error("QuickBooks app credentials not found — cannot refresh token.")
  }

  try {
    const credentials = Buffer.from(`${creds.clientId}:${creds.clientSecret}`).toString("base64")
    const { data } = await axios.post(
      QB_TOKEN_URL,
      new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken }),
      {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
      }
    )

    const newExpiresAt = new Date(Date.now() + data.expires_in * 1000)

    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: newExpiresAt,
        status: "ACTIVE",
        errorMessage: null,
        updatedAt: new Date(),
      },
    })

    return data.access_token
  } catch (err: any) {
    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { status: "EXPIRED", errorMessage: `Token refresh failed: ${err?.response?.data?.error ?? err.message}` },
    }).catch(() => {})
    throw new Error(`QuickBooks token refresh failed — please reconnect from the Connections page.`)
  }
}
