import axios, { AxiosInstance } from "axios"

const QB_API_BASE = "https://quickbooks.api.intuit.com/v3/company"

export function createQBClient(accessToken: string, realmId: string): AxiosInstance {
  return axios.create({
    baseURL: `${QB_API_BASE}/${realmId}`,
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
