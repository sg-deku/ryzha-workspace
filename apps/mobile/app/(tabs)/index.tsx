import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import type { KpiCard } from "@ryzha/api-types"

function KpiTile({ kpi }: { kpi: KpiCard }) {
  const isPositive = kpi.change.startsWith("+")
  const isNegative = kpi.change.startsWith("-")

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex-1 min-w-[44%]">
      <Text className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{kpi.title}</Text>
      <Text className="text-2xl font-bold text-slate-900">{kpi.value}</Text>
      {!!kpi.change && (
        <Text
          className={`text-xs mt-1 font-medium ${
            isPositive ? "text-green-600" : isNegative ? "text-red-500" : "text-slate-400"
          }`}
        >
          {kpi.change}
        </Text>
      )}
    </View>
  )
}

export default function DashboardScreen() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-dashboard"],
    queryFn: () => apiFetch<{ kpis: KpiCard[] }>("/dashboard"),
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
      >
        <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-slate-900">Dashboard</Text>
            <Text className="text-sm text-slate-500">{user?.name || user?.email}</Text>
          </View>
          <TouchableOpacity
            className="w-9 h-9 rounded-full bg-slate-100 items-center justify-center"
            onPress={logout}
          >
            <Ionicons name="log-out-outline" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center mt-20">
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        ) : (
          <View className="px-5 mt-4">
            <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Key Metrics</Text>
            <View className="flex-row flex-wrap gap-3">
              {(data?.kpis ?? []).map((kpi) => (
                <KpiTile key={kpi.title} kpi={kpi} />
              ))}
            </View>

            <View className="mt-6 space-y-3">
              <Text className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1">Quick Actions</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-2xl p-4 items-center"
                  onPress={() => router.push("/(tabs)/invoices/index")}
                >
                  <Ionicons name="document-text-outline" size={22} color="#fff" />
                  <Text className="text-white text-xs font-semibold mt-1.5">Invoices</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 items-center"
                  onPress={() => router.push("/(tabs)/expenses/index")}
                >
                  <Ionicons name="receipt-outline" size={22} color="#2563eb" />
                  <Text className="text-primary text-xs font-semibold mt-1.5">Expenses</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 items-center"
                  onPress={() => router.push("/(tabs)/chat")}
                >
                  <Ionicons name="sparkles-outline" size={22} color="#2563eb" />
                  <Text className="text-primary text-xs font-semibold mt-1.5">Ask Aria</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
