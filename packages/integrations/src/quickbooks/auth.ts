import axios from "axios"

const QB_AUTH_BASE = "https://appcenter.intuit.com/connect/oauth2"
const QB_TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer"
const QB_REVOKE_URL = "https://developer.api.intuit.com/v2/oauth2/tokens/revoke"

export interface QBTokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  x_refresh_token_expires_in: number
  token_type: string
}

export function getQBAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.QB_CLIENT_ID!,
    redirect_uri: process.env.QB_REDIRECT_URI!,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state,
  })
  return `${QB_AUTH_BASE}?${params.toString()}`
}

export async function exchangeQBCode(
  code: string,
  realmId: string
): Promise<QBTokenResponse & { realmId: string }> {
  const credentials = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString("base64")

  const { data } = await axios.post<QBTokenResponse>(
    QB_TOKEN_URL,
    new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: process.env.QB_REDIRECT_URI! }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    }
  )

  return { ...data, realmId }
}

export async function refreshQBToken(refreshToken: string): Promise<QBTokenResponse> {
  const credentials = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString("base64")

  const { data } = await axios.post<QBTokenResponse>(
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

  return data
}

export async function revokeQBToken(token: string): Promise<void> {
  const credentials = Buffer.from(
    `${process.env.QB_CLIENT_ID}:${process.env.QB_CLIENT_SECRET}`
  ).toString("base64")

  await axios.post(
    QB_REVOKE_URL,
    new URLSearchParams({ token }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
    }
  )
}
