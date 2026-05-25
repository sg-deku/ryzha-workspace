import { useState } from "react"
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const PAYMENT_TERMS = ["NET15", "NET30", "NET45", "NET60", "IMMEDIATE"]

function Field({ label, value, onChange, placeholder, keyboardType }: any) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 }}>{label}</Text>
      <TextInput
        style={{
          borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12,
          paddingHorizontal: 14, paddingVertical: 11, fontSize: 15,
          color: "#0F172A", backgroundColor: "#F8FAFC",
        }}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  )
}

function CreateVendorModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [paymentTerms, setPaymentTerms] = useState("NET30")

  const mutation = useMutation({
    mutationFn: (data: any) => apiFetch("/vendors", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-vendors"] })
      setName(""); setEmail(""); setPhone(""); setPaymentTerms("NET30")
      onClose()
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  })

  const handleCreate = () => {
    if (!name.trim()) return Alert.alert("Required", "Vendor name is required")
    mutation.mutate({ name, email, phone, paymentTerms })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: "#0F172A" }}>New Vendor</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Field label="Name *" value={name} onChange={setName} placeholder="Supplier Ltd" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="accounts@supplier.com" keyboardType="email-address" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" keyboardType="phone-pad" />

          <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 }}>Payment Terms</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
            {PAYMENT_TERMS.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setPaymentTerms(t)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
                  backgroundColor: paymentTerms === t ? "#7C3AED" : "#F1F5F9",
                  borderWidth: 1,
                  borderColor: paymentTerms === t ? "#7C3AED" : "#E2E8F0",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: paymentTerms === t ? "#fff" : "#64748B" }}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={{ padding: 20, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={mutation.isPending}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#7C3AED", borderRadius: 16, paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Add Vendor</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function VendorRow({ item }: { item: any }) {
  const router = useRouter()
  const isActive = item.status === "ACTIVE"

  return (
    <TouchableOpacity
      style={{
        backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10,
        borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F1F5F9",
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
      }}
      onPress={() => router.push(`/(tabs)/vendors/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#7C3AED", fontWeight: "800", fontSize: 16 }}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: "#0F172A" }}>{item.name}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>{item.paymentTerms ?? "NET30"}</Text>
        </View>
        <View style={{ backgroundColor: isActive ? "#DCFCE7" : "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: isActive ? "#15803D" : "#94A3B8" }}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function VendorsScreen() {
  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-vendors"],
    queryFn: () => apiFetch<any[]>("/vendors"),
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#0F172A" }}>Vendors</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#7C3AED", width: 36, height: 36,
            borderRadius: 12, alignItems: "center", justifyContent: "center",
            shadowColor: "#7C3AED", shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VendorRow item={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#7C3AED" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}>
              <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#F5F3FF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="business-outline" size={32} color="#C4B5FD" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>No vendors yet</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={{ marginTop: 12, backgroundColor: "#7C3AED", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Add first vendor</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateVendorModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  )
}
