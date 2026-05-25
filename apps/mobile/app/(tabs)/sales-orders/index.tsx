import {
  View, Text, FlatList, ActivityIndicator, RefreshControl,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-700",
  INVOICED: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  SHIPPED: "bg-teal-100 text-teal-700",
}

function SORow({ item }: { item: any }) {
  const style = STATUS_COLORS[item.status] ?? "bg-slate-100 text-slate-500"
  const [bg, txt] = style.split(" ")

  return (
    <View className="bg-white mx-4 mb-3 rounded-2xl p-4 border border-slate-100 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          <Text className="font-semibold text-slate-900">{item.orderNumber}</Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            {item.customer?.name ?? "Unknown"} · {new Date(item.createdAt).toLocaleDateString("en-GB")}
          </Text>
        </View>
        <View className="items-end gap-1">
          <Text className="font-bold text-slate-900">${item.totalAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
          <View className={`px-2 py-0.5 rounded-full ${bg}`}>
            <Text className={`text-[10px] font-bold ${txt}`}>{item.status}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

export default function SalesOrdersScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-sales-orders"],
    queryFn: () => apiFetch<any[]>("/sales-orders"),
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Sales Orders</Text>
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
          renderItem={({ item }) => <SORow item={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="cart-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-base">No sales orders yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
