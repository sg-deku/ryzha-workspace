import "../global.css"
import { useEffect } from "react"
import { Stack, useRouter, useSegments } from "expo-router"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StatusBar } from "expo-status-bar"
import { AuthProvider, useAuth } from "@/lib/auth"

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function RootGuard() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    const inAuth = segments[0] === "(auth)"
    if (!user && !inAuth) {
      router.replace("/(auth)/login")
    } else if (user && inAuth) {
      router.replace("/(tabs)")
    }
  }, [user, loading, segments])

  return null
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootGuard />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  )
}
