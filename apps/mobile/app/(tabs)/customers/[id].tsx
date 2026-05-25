import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const SO_STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  APPROVED: "bg-blue-100 text-blue-700",
  INVOICED: "bg-purple-100 text-purple-700",
  PAID: "bg-green-100 text-green-700",
  SHIPPED: "bg-teal-100 text-teal-700",
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-slate-100">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-medium">{value}</Text>
    </View>
  )
}

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: customer, isLoading } = useQuery({
    queryKey: ["mobile-customer", id],
    queryFn: () => apiFetch<any>(`/customers/${id}`),
    enabled: !!id,
  })

  if (isLoading || !customer) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-1">
          <Ionicons name="arrow-back" size={22} color="#334155" />
        </TouchableOpacity>
        <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center">
          <Text className="text-blue-700 font-bold">{customer.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text className="text-xl font-bold text-slate-900 flex-1" numberOfLines={1}>{customer.name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Details</Text>
          <DetailRow label="Email" value={customer.email ?? "—"} />
          <DetailRow label="Tax ID" value={customer.taxId ?? "—"} />
          <DetailRow label="Credit Limit" value={`$${customer.creditLimit.toLocaleString()}`} />
          <DetailRow label="Status" value={customer.status} />
          <DetailRow label="Member since" value={new Date(customer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
        </View>

        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Sales Orders</Text>
          {customer.salesOrders?.length === 0 ? (
            <Text className="text-slate-400 text-sm py-2">No orders yet</Text>
          ) : (
            customer.salesOrders?.map((so: any) => {
              const style = SO_STATUS_COLOR[so.status] ?? "bg-slate-100 text-slate-600"
              const [bg, txt] = style.split(" ")
              return (
                <View key={so.id} className="flex-row items-center justify-between py-2.5 border-b border-slate-50">
                  <View>
                    <Text className="text-slate-800 text-sm font-medium">{so.orderNumber}</Text>
                    <Text className="text-slate-400 text-xs">{new Date(so.createdAt).toLocaleDateString("en-GB")}</Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-semibold text-slate-900">${so.totalAmount.toLocaleString()}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${bg}`}>
                      <Text className={`text-[10px] font-bold ${txt}`}>{so.status}</Text>
                    </View>
                  </View>
                </View>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
