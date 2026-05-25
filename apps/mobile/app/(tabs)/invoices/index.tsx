import { useState } from "react"
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import type { Invoice } from "@ryzha/api-types"

const STATUS: Record<string, { bg: string; text: string }> = {
  DRAFT:     { bg: "#F1F5F9", text: "#64748B" },
  SENT:      { bg: "#DBEAFE", text: "#1D4ED8" },
  PAID:      { bg: "#DCFCE7", text: "#15803D" },
  OVERDUE:   { bg: "#FEE2E2", text: "#B91C1C" },
  CANCELLED: { bg: "#F1F5F9", text: "#94A3B8" },
}

function Field({ label, value, onChange, placeholder, keyboardType, multiline }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{
          borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
          color: "#0F172A", backgroundColor: "#F8FAFC",
          minHeight: multiline ? 72 : undefined, textAlignVertical: multiline ? "top" : "auto",
        }}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        multiline={multiline}
      />
    </View>
  )
}

function CreateInvoiceModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [description, setDescription] = useState("")
  const [quantity, setQuantity] = useState("1")
  const [unitPrice, setUnitPrice] = useState("")
  const [notes, setNotes] = useState("")

  const mutation = useMutation({
    mutationFn: (data: any) => apiFetch("/invoices", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-invoices"] })
      queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] })
      setClientName(""); setClientEmail(""); setDueDate("")
      setDescription(""); setQuantity("1"); setUnitPrice(""); setNotes("")
      onClose()
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  })

  const handleCreate = () => {
    if (!clientName.trim()) return Alert.alert("Required", "Client name is required")
    if (!dueDate.trim()) return Alert.alert("Required", "Due date is required (YYYY-MM-DD)")
    if (!description.trim() || !unitPrice.trim()) return Alert.alert("Required", "Line item description and price are required")
    const qty = parseFloat(quantity) || 1
    const price = parseFloat(unitPrice)
    if (isNaN(price) || price <= 0) return Alert.alert("Invalid", "Enter a valid unit price")
    mutation.mutate({
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      dueDate,
      notes: notes.trim(),
      lineItems: [{ description: description.trim(), quantity: qty, unitPrice: price, taxRate: 0 }],
    })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: "#0F172A" }}>New Invoice</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={{ fontSize: 11, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 }}>Client</Text>
          <Field label="Client Name *" value={clientName} onChange={setClientName} placeholder="Acme Corp" />
          <Field label="Client Email" value={clientEmail} onChange={setClientEmail} placeholder="billing@acme.com" keyboardType="email-address" />
          <Field label="Due Date * (YYYY-MM-DD)" value={dueDate} onChange={setDueDate} placeholder={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]} />

          <Text style={{ fontSize: 11, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12, marginTop: 8 }}>Line Item</Text>
          <Field label="Description *" value={description} onChange={setDescription} placeholder="Services rendered" />
          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="Qty" value={quantity} onChange={setQuantity} placeholder="1" keyboardType="decimal-pad" />
            </View>
            <View style={{ flex: 2 }}>
              <Field label="Unit Price ($) *" value={unitPrice} onChange={setUnitPrice} placeholder="0.00" keyboardType="decimal-pad" />
            </View>
          </View>
          <Field label="Notes" value={notes} onChange={setNotes} placeholder="Payment terms, references…" multiline />

          {unitPrice && quantity && (
            <View style={{ backgroundColor: "#EEF2FF", borderRadius: 12, padding: 14, marginBottom: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ fontSize: 14, color: "#4338CA", fontWeight: "600" }}>Total</Text>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#4F46E5" }}>
                ${((parseFloat(unitPrice) || 0) * (parseFloat(quantity) || 1)).toFixed(2)}
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={{ padding: 20, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={mutation.isPending}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Create Invoice</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const s = STATUS[invoice.status] ?? STATUS.DRAFT

  return (
    <TouchableOpacity
      style={{
        backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10,
        borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
      }}
      onPress={() => router.push(`/(tabs)/invoices/${invoice.id}`)}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: "#0F172A" }}>{invoice.clientName}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>{invoice.invoiceNumber}</Text>
        </View>
        <View style={{ backgroundColor: s.bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, marginLeft: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: "700", color: s.text }}>{invoice.status}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10 }}>
        <Text style={{ color: "#64748B", fontSize: 12 }}>
          Due {new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </Text>
        <Text style={{ color: "#0F172A", fontWeight: "800", fontSize: 16 }}>${invoice.total.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function InvoicesScreen() {
  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-invoices"],
    queryFn: () => apiFetch<Invoice[]>("/invoices"),
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#0F172A" }}>Invoices</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#4F46E5", width: 36, height: 36,
            borderRadius: 12, alignItems: "center", justifyContent: "center",
            shadowColor: "#4F46E5", shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <InvoiceRow invoice={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#4F46E5" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}>
              <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="document-text-outline" size={32} color="#A5B4FC" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>No invoices yet</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={{ marginTop: 12, backgroundColor: "#4F46E5", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Create your first invoice</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateInvoiceModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  )
}
