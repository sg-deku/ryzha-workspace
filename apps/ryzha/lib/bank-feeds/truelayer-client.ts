import { encryptToken, safeDecrypt } from "@/lib/crypto/token-vault"
import { prisma } from "@/lib/prisma"

const TL_AUTH_URL = "https://auth.truelayer.com"
const TL_API_URL = "https://api.truelayer.com"
const REDIRECT_URI = process.env.TRUELAYER_REDIRECT_URI ?? "http://localhost:3000/api/bank-feeds/truelayer/callback"

export function getAuthorizationUrl(orgId: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TRUELAYER_CLIENT_ID ?? "",
    scope: "info accounts balance transactions offline_access",
    redirect_uri: REDIRECT_URI,
    providers: "uk-ob-all uk-oauth-all",
    state: orgId,
  })
  return `${TL_AUTH_URL}/?${params}`
}

export async function exchangeCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const res = await fetch(`${TL_AUTH_URL}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.TRUELAYER_CLIENT_ID ?? "",
      client_secret: process.env.TRUELAYER_CLIENT_SECRET ?? "",
      redirect_uri: REDIRECT_URI,
      code,
    }),
  })
  if (!res.ok) throw new Error(`TrueLayer token exchange failed: ${res.status}`)
  return res.json()
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
}> {
  const res = await fetch(`${TL_AUTH_URL}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.TRUELAYER_CLIENT_ID ?? "",
      client_secret: process.env.TRUELAYER_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) throw new Error(`TrueLayer token refresh failed: ${res.status}`)
  return res.json()
}

export async function getTrueLayerAccounts(accessToken: string) {
  const res = await fetch(`${TL_API_URL}/data/v1/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`TrueLayer accounts failed: ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

export async function getTrueLayerTransactions(accessToken: string, accountId: string, from: Date, to: Date) {
  const params = new URLSearchParams({
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  })
  const res = await fetch(`${TL_API_URL}/data/v1/accounts/${accountId}/transactions?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error(`TrueLayer transactions failed: ${res.status}`)
  const data = await res.json()
  return data.results ?? []
}

export async function getOrRefreshToken(bankAccountId: string): Promise<string> {
  const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } })
  if (!account) throw new Error("Account not found")

  const expiry = account.trueLayerTokenExpiry
  const needsRefresh = !expiry || expiry.getTime() < Date.now() + 5 * 60 * 1000

  if (needsRefresh) {
    const rt = safeDecrypt(account.trueLayerRefreshToken)
    if (!rt) throw new Error("No refresh token available")
    const refreshed = await refreshAccessToken(rt)
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000)
    const encryptedAt = encryptToken(refreshed.access_token)
    await prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { trueLayerAccessToken: encryptedAt, trueLayerTokenExpiry: newExpiry },
    })
    return refreshed.access_token
  }

  return safeDecrypt(account.trueLayerAccessToken) ?? ""
}

export async function storeTrueLayerConnection(
  organizationId: string,
  accountName: string,
  tokens: { access_token: string; refresh_token: string; expires_in: number },
  tlAccountId: string,
  institutionName?: string
) {
  const expiry = new Date(Date.now() + tokens.expires_in * 1000)
  const connectionId = crypto.randomUUID()

  return prisma.bankAccount.create({
    data: {
      id: crypto.randomUUID(),
      organizationId,
      name: accountName,
      connectionType: "TRUELAYER",
      syncStatus: "IDLE",
      trueLayerConnectionId: connectionId,
      trueLayerAccountId: tlAccountId,
      trueLayerAccessToken: encryptToken(tokens.access_token),
      trueLayerRefreshToken: encryptToken(tokens.refresh_token),
      trueLayerTokenExpiry: expiry,
      institutionName: institutionName ?? null,
    },
  })
}
