import * as SecureStore from "expo-secure-store"
import { Platform } from "react-native"

export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE ?? "https://ryzha.vercel.app/api/mobile"

const TOKEN_KEY = "ryzha_token"

export async function getToken(): Promise<string | null> {
  if (Platform.OS === "web") {
    return typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
  }
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.setItem(TOKEN_KEY, token)
    return
  }
  return SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") localStorage.removeItem(TOKEN_KEY)
    return
  }
  return SecureStore.deleteItemAsync(TOKEN_KEY)
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
