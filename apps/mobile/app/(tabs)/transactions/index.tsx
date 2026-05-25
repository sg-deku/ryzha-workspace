import {
  View, Text, FlatList, ActivityIndicator, RefreshControl,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const AUDIT_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  verified: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
}

const WORKFLOW_COLORS: Record<string, string> = {
  pending: "bg-slate-100 text-slate-500",
  running: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-600",
}

function TxRow({ item }: { item: any }) {
  const audit = AUDIT_COLORS[item.auditStatus] ?? "bg-slate-100 text-slate-500"
  const [aBg, aTxt] = audit.split(" ")
  const workflow = WORKFLOW_COLORS[item.workflowStatus] ?? "bg-slate-100 text-slate-500"
  const [wBg, wTxt] = workflow.split(" ")

  return (
    <View className="bg-white mx-4 mb-3 rounded-2xl p-4 border border-slate-100 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          <Text className="font-semibold text-slate-900 text-sm" numberOfLines={1}>
            {item.customerEmail ?? item.description ?? item.stripePaymentIntentId}
          </Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            {item.currency?.toUpperCase()} · {new Date(item.createdAt).toLocaleDateString("en-GB")}
          </Text>
        </View>
        <Text className="font-bold text-slate-900">${(item.amount / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
      </View>
      <View className="flex-row gap-2 mt-2">
        <View className={`px-2 py-0.5 rounded-full ${aBg}`}>
          <Text className={`text-[10px] font-bold ${aTxt}`}>Audit: {item.auditStatus}</Text>
        </View>
        <View className={`px-2 py-0.5 rounded-full ${wBg}`}>
          <Text className={`text-[10px] font-bold ${wTxt}`}>Workflow: {item.workflowStatus}</Text>
        </View>
      </View>
    </View>
  )
}

export default function TransactionsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-transactions"],
    queryFn: () => apiFetch<any[]>("/payments"),
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Transactions</Text>
        <View className="bg-slate-100 px-3 py-1.5 rounded-full">
          <Text className="text-slate-600 text-xs font-semibold">{data?.length ?? 0} total</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TxRow item={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="swap-horizontal-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-base">No transactions yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
