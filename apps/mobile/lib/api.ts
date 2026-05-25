import * as SecureStore from "expo-secure-store"

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "https://ryzha.vercel.app/api/mobile"

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("ryzha_token")
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync("ryzha_token", token)
}

export async function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync("ryzha_token")
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken()
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Unknown error" }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }

  return res.json()
}
