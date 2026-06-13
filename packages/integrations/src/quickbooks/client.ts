import axios, { AxiosInstance } from "axios"

const QB_API_PROD    = "https://quickbooks.api.intuit.com/v3/company"
const QB_API_SANDBOX = "https://sandbox-quickbooks.api.intuit.com/v3/company"

function isSandboxToken(accessToken: string): boolean {
  try {
    const header = JSON.parse(Buffer.from(accessToken.split(".")[0], "base64url").toString())
    return header["x.org"] === "H0"
  } catch {
    return false
  }
}

export function createQBClient(accessToken: string, realmId: string): AxiosInstance {
  const base = isSandboxToken(accessToken) ? QB_API_SANDBOX : QB_API_PROD
  return axios.create({
    baseURL: `${base}/${realmId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  })
}

export async function qbQuery<T = unknown>(
  client: AxiosInstance,
  query: string
): Promise<T> {
  const { data } = await client.get("/query", { params: { query, minorversion: 70 } })
  return data as T
}
