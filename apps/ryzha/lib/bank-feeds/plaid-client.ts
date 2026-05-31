import { encryptToken, safeDecrypt } from "@/lib/crypto/token-vault"
import { prisma } from "@/lib/prisma"

const PLAID_ENV = process.env.PLAID_ENV || "sandbox"
const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: "https://sandbox.plaid.com",
  development: "https://development.plaid.com",
  production: "https://production.plaid.com",
}
const BASE_URL = PLAID_BASE_URLS[PLAID_ENV] ?? PLAID_BASE_URLS.sandbox

async function plaidPost(path: string, body: object) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.PLAID_CLIENT_ID,
      secret: process.env.PLAID_SECRET,
      ...body,
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_message || `Plaid error: ${res.status}`)
  return data
}

export async function createLinkToken(userId: string, orgId: string) {
  return plaidPost("/link/token/create", {
    user: { client_user_id: `${orgId}:${userId}` },
    client_name: "Ryzha",
    products: ["transactions"],
    country_codes: ["US", "CA", "GB"],
    language: "en",
  })
}

export async function exchangePublicToken(publicToken: string) {
  return plaidPost("/item/public_token/exchange", { public_token: publicToken })
}

export async function getPlaidAccounts(accessToken: string) {
  return plaidPost("/accounts/get", { access_token: accessToken })
}

export async function syncPlaidTransactions(accessToken: string, cursor?: string | null) {
  return plaidPost("/transactions/sync", {
    access_token: accessToken,
    cursor: cursor || undefined,
    count: 500,
  })
}

export async function storePlaidConnection(
  organizationId: string,
  bankAccountName: string,
  { accessToken, itemId, accountId, institutionName }: {
    accessToken: string
    itemId: string
    accountId: string
    institutionName?: string
  }
) {
  const encrypted = encryptToken(accessToken)

  return prisma.bankAccount.upsert({
    where: { plaidItemId: itemId },
    create: {
      organizationId,
      name: bankAccountName,
      connectionType: "PLAID",
      syncStatus: "IDLE",
      plaidItemId: itemId,
      plaidAccountId: accountId,
      plaidAccessToken: encrypted,
      institutionName: institutionName ?? null,
    },
    update: {
      plaidAccessToken: encrypted,
      syncStatus: "IDLE",
      institutionName: institutionName ?? null,
    },
  })
}

export function decryptPlaidToken(encrypted: string | null | undefined): string | null {
  return safeDecrypt(encrypted)
}
