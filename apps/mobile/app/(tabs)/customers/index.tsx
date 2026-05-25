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

function CreateCustomerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [taxId, setTaxId] = useState("")
  const [creditLimit, setCreditLimit] = useState("")

  const mutation = useMutation({
    mutationFn: (data: any) => apiFetch("/customers", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-customers"] })
      setName(""); setEmail(""); setPhone(""); setTaxId(""); setCreditLimit("")
      onClose()
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  })

  const handleCreate = () => {
    if (!name.trim()) return Alert.alert("Required", "Customer name is required")
    mutation.mutate({ name, email, phone, taxId, creditLimit })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
          <Text style={{ flex: 1, fontSize: 20, fontWeight: "800", color: "#0F172A" }}>New Customer</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Field label="Name *" value={name} onChange={setName} placeholder="Acme Corporation" />
          <Field label="Email" value={email} onChange={setEmail} placeholder="contact@acme.com" keyboardType="email-address" />
          <Field label="Phone" value={phone} onChange={setPhone} placeholder="+1 555 000 0000" keyboardType="phone-pad" />
          <Field label="Tax ID / VAT" value={taxId} onChange={setTaxId} placeholder="GB123456789" />
          <Field label="Credit Limit ($)" value={creditLimit} onChange={setCreditLimit} placeholder="10000" keyboardType="decimal-pad" />
        </ScrollView>
        <View style={{ padding: 20, paddingTop: 12 }}>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={mutation.isPending}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#3B82F6", borderRadius: 16, paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
            }}
          >
            {mutation.isPending
              ? <ActivityIndicator color="#fff" />
              : <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Add Customer</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function CustomerRow({ item }: { item: any }) {
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
      onPress={() => router.push(`/(tabs)/customers/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: "#2563EB", fontWeight: "800", fontSize: 16 }}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", fontSize: 15, color: "#0F172A" }}>{item.name}</Text>
          <Text style={{ color: "#94A3B8", fontSize: 12, marginTop: 2 }}>{item.email || "No email"}</Text>
        </View>
        <View style={{ backgroundColor: isActive ? "#DCFCE7" : "#F1F5F9", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
          <Text style={{ fontSize: 10, fontWeight: "700", color: isActive ? "#15803D" : "#94A3B8" }}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function CustomersScreen() {
  const [showCreate, setShowCreate] = useState(false)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-customers"],
    queryFn: () => apiFetch<any[]>("/customers"),
  })

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 24, fontWeight: "800", color: "#0F172A" }}>Customers</Text>
        <TouchableOpacity
          onPress={() => setShowCreate(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: "#3B82F6", width: 36, height: 36,
            borderRadius: 12, alignItems: "center", justifyContent: "center",
            shadowColor: "#3B82F6", shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CustomerRow item={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 32 }}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}>
              <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Ionicons name="people-outline" size={32} color="#93C5FD" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>No customers yet</Text>
              <TouchableOpacity onPress={() => setShowCreate(true)} style={{ marginTop: 12, backgroundColor: "#3B82F6", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>Add first customer</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateCustomerModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  )
}
