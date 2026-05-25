import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import type { Invoice } from "@ryzha/api-types"

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  DRAFT: { bg: "#f1f5f9", text: "#475569" },
  SENT: { bg: "#dbeafe", text: "#1d4ed8" },
  PAID: { bg: "#dcfce7", text: "#15803d" },
  OVERDUE: { bg: "#fee2e2", text: "#dc2626" },
  CANCELLED: { bg: "#f1f5f9", text: "#94a3b8" },
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["mobile-invoice", id],
    queryFn: () => apiFetch<Invoice>(`/invoices/${id}`),
    enabled: !!id,
  })

  const colors = STATUS_COLORS[invoice?.status ?? "DRAFT"]

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-white border border-slate-200 items-center justify-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={18} color="#475569" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900">Invoice Detail</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : invoice ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, paddingTop: 4 }}>
          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-4">
            <View className="flex-row items-start justify-between mb-4">
              <View>
                <Text className="text-xs text-slate-500 font-medium">Invoice</Text>
                <Text className="text-xl font-bold text-slate-900">{invoice.invoiceNumber}</Text>
              </View>
              <View style={{ backgroundColor: colors.bg }} className="px-3 py-1.5 rounded-full">
                <Text style={{ color: colors.text }} className="text-xs font-bold">{invoice.status}</Text>
              </View>
            </View>

            <View className="border-t border-slate-100 pt-4 space-y-2">
              <Row label="Client" value={invoice.clientName} />
              <Row label="Email" value={invoice.clientEmail} />
              <Row label="Issue Date" value={new Date(invoice.issueDate).toLocaleDateString("en-GB")} />
              <Row label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString("en-GB")} />
            </View>
          </View>

          {(invoice.lineItems ?? []).length > 0 && (
            <View className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 overflow-hidden">
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wide px-5 pt-4 pb-2">Line Items</Text>
              {(invoice.lineItems ?? []).map((item, i) => (
                <View key={item.id} className={`px-5 py-3 ${i > 0 ? "border-t border-slate-50" : ""}`}>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-900 font-medium flex-1 mr-2" numberOfLines={2}>{item.description}</Text>
                    <Text className="text-slate-900 font-bold">${item.amount.toFixed(2)}</Text>
                  </View>
                  <Text className="text-slate-400 text-xs mt-0.5">{item.quantity} × ${item.unitPrice.toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <Row label="Subtotal" value={`$${invoice.subtotal.toFixed(2)}`} />
            <Row label="Tax" value={`$${invoice.totalTax.toFixed(2)}`} />
            <View className="border-t border-slate-100 mt-3 pt-3 flex-row justify-between">
              <Text className="font-bold text-slate-900 text-base">Total</Text>
              <Text className="font-bold text-primary text-lg">${invoice.total.toFixed(2)}</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-slate-400">Invoice not found</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-medium">{value}</Text>
    </View>
  )
}
