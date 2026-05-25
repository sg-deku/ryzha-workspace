import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import type { Invoice } from "@ryzha/api-types"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-400",
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const statusStyle = STATUS_COLORS[invoice.status] ?? "bg-slate-100 text-slate-600"

  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-2xl p-4 border border-slate-100 shadow-sm"
      onPress={() => router.push(`/(tabs)/invoices/${invoice.id}`)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="font-bold text-slate-900 text-base">{invoice.clientName}</Text>
          <Text className="text-slate-500 text-sm mt-0.5">{invoice.invoiceNumber}</Text>
        </View>
        <View className={`px-2.5 py-1 rounded-full ${statusStyle.split(" ")[0]}`}>
          <Text className={`text-xs font-semibold ${statusStyle.split(" ")[1]}`}>{invoice.status}</Text>
        </View>
      </View>
      <View className="flex-row items-center justify-between mt-3">
        <Text className="text-slate-500 text-xs">
          Due {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
        <Text className="text-slate-900 font-bold text-base">${invoice.total.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function InvoicesScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-invoices"],
    queryFn: () => apiFetch<Invoice[]>("/invoices"),
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Invoices</Text>
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
          renderItem={({ item }) => <InvoiceRow invoice={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-base">No invoices yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
