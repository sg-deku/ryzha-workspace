import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useLocalSearchParams, useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const STATUS_COLOR: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-600",
  SENT: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-slate-100 text-slate-400",
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-2.5 border-b border-slate-100">
      <Text className="text-slate-500 text-sm">{label}</Text>
      <Text className="text-slate-900 text-sm font-medium text-right flex-1 ml-4" numberOfLines={2}>{value}</Text>
    </View>
  )
}

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ["mobile-invoice", id],
    queryFn: () => apiFetch<any>(`/invoices/${id}`),
    enabled: !!id,
  })

  const markSent = useMutation({
    mutationFn: () => apiFetch(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "SENT" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-invoice", id] })
      queryClient.invalidateQueries({ queryKey: ["mobile-invoices"] })
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  })

  const markPaid = useMutation({
    mutationFn: () => apiFetch(`/invoices/${id}`, { method: "PATCH", body: JSON.stringify({ status: "PAID" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-invoice", id] })
      queryClient.invalidateQueries({ queryKey: ["mobile-invoices"] })
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  })

  if (isLoading || !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    )
  }

  const statusStyle = STATUS_COLOR[invoice.status] ?? "bg-slate-100 text-slate-600"
  const [bgClass, textClass] = statusStyle.split(" ")

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-1">
          <Ionicons name="arrow-back" size={22} color="#334155" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-slate-900 flex-1" numberOfLines={1}>{invoice.invoiceNumber}</Text>
        <View className={`px-2.5 py-1 rounded-full ${bgClass}`}>
          <Text className={`text-xs font-semibold ${textClass}`}>{invoice.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Client</Text>
          <DetailRow label="Name" value={invoice.clientName} />
          <DetailRow label="Email" value={invoice.clientEmail} />
          <DetailRow label="Issue Date" value={new Date(invoice.issueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
          <DetailRow label="Due Date" value={new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} />
        </View>

        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Line Items</Text>
          {invoice.lineItems?.map((item: any) => (
            <View key={item.id} className="flex-row justify-between py-2 border-b border-slate-50">
              <View className="flex-1 mr-3">
                <Text className="text-slate-800 text-sm" numberOfLines={2}>{item.description}</Text>
                <Text className="text-slate-400 text-xs">Qty {item.quantity} × ${item.unitPrice.toFixed(2)}</Text>
              </View>
              <Text className="text-slate-900 font-semibold text-sm">${item.amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View className="bg-white mx-4 rounded-2xl p-4 mb-3 border border-slate-100">
          <Text className="text-xs font-semibold text-slate-400 uppercase mb-2">Summary</Text>
          <DetailRow label="Subtotal" value={`$${invoice.subtotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
          <DetailRow label="Tax" value={`$${invoice.totalTax.toLocaleString("en-US", { minimumFractionDigits: 2 })}`} />
          <View className="flex-row justify-between py-2.5 mt-1">
            <Text className="text-slate-900 font-bold text-base">Total</Text>
            <Text className="text-slate-900 font-bold text-base">${invoice.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {invoice.status === "DRAFT" && (
          <TouchableOpacity
            className="bg-blue-600 mx-4 rounded-2xl py-4 items-center mb-3"
            onPress={() => markSent.mutate()}
            disabled={markSent.isPending}
            activeOpacity={0.85}
          >
            {markSent.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Mark as Sent</Text>}
          </TouchableOpacity>
        )}

        {invoice.status === "SENT" && (
          <TouchableOpacity
            className="bg-green-600 mx-4 rounded-2xl py-4 items-center mb-3"
            onPress={() => markPaid.mutate()}
            disabled={markPaid.isPending}
            activeOpacity={0.85}
          >
            {markPaid.isPending ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Mark as Paid</Text>}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
