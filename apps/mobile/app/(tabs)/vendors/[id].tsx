import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const VI_STATUS_COLOR: Record<string, string> = {
  RECEIVED: "bg-slate-100 text-slate-600",
  MATCHED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-indigo-100 text-indigo-700",
  PAID: "bg-green-100 text-green-700",
  DISPUTED: "bg-red-100 text-red-600",
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-slate-100">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-medium">{value}</Text>
    </View>
  )
}

export default function VendorDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: vendor, isLoading } = useQuery({
    queryKey: ["mobile-vendor", id],
    queryFn: () => apiFetch<any>(`/vendors/${id}`),
    enabled: !!id,
  })

  if (isLoading || !vendor) {
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
        <View className="w-9 h-9 rounded-full bg-purple-100 items-center justify-center">
          <Text className="text-purple-700 font-bold">{vendor.name.charAt(0).toUpperCase()}</Text>
        </View>
        <Text className="text-xl font-bold text-slate-900 flex-1" numberOfLines={1}>{vendor.name}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Details</Text>
          <DetailRow label="Email" value={vendor.email ?? "—"} />
          <DetailRow label="Payment Terms" value={vendor.paymentTerms ?? "NET30"} />
          <DetailRow label="Status" value={vendor.status} />
          <DetailRow label="Added" value={new Date(vendor.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
        </View>

        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Vendor Invoices</Text>
          {vendor.invoices?.length === 0 ? (
            <Text className="text-slate-400 text-sm py-2">No invoices yet</Text>
          ) : (
            vendor.invoices?.map((vi: any) => {
              const style = VI_STATUS_COLOR[vi.status] ?? "bg-slate-100 text-slate-600"
              const [bg, txt] = style.split(" ")
              return (
                <View key={vi.id} className="flex-row items-center justify-between py-2.5 border-b border-slate-50">
                  <View>
                    <Text className="text-slate-800 text-sm font-medium">{vi.invoiceNumber}</Text>
                    <Text className="text-slate-400 text-xs">Due {new Date(vi.dueDate).toLocaleDateString("en-GB")}</Text>
                  </View>
                  <View className="items-end gap-1">
                    <Text className="font-semibold text-slate-900">${vi.amount.toLocaleString()}</Text>
                    <View className={`px-2 py-0.5 rounded-full ${bg}`}>
                      <Text className={`text-[10px] font-bold ${txt}`}>{vi.status}</Text>
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
