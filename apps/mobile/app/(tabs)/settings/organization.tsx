import { useState, useEffect } from "react"
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, KeyboardAvoidingView, Platform, StatusBar,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useNavigation } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/lib/theme"

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "SGD", "INR", "JPY"]
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function Field({
  label, value, onChange, placeholder, keyboardType, editable = true,
}: {
  label: string; value: string; onChange?: (v: string) => void
  placeholder?: string; keyboardType?: any; editable?: boolean
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </Text>
      <TextInput
        style={{
          borderWidth: 1,
          borderColor: editable ? "#E2E8F0" : "#F1F5F9",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontSize: 15,
          color: editable ? "#0F172A" : "#94A3B8",
          backgroundColor: editable ? "#fff" : "#F8FAFC",
        }}
        placeholder={placeholder}
        placeholderTextColor="#CBD5E1"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
        editable={editable}
        autoCapitalize="none"
      />
    </View>
  )
}

function PickerRow<T extends string>({
  label, options, selected, onSelect, renderLabel,
}: {
  label: string; options: T[]; selected: T
  onSelect: (v: T) => void; renderLabel?: (v: T) => string
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
        {label}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => onSelect(opt)}
            style={{
              paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10,
              backgroundColor: selected === opt ? "#4F46E5" : "#F8FAFC",
              borderWidth: 1,
              borderColor: selected === opt ? "#4F46E5" : "#E2E8F0",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: selected === opt ? "#fff" : "#64748B" }}>
              {renderLabel ? renderLabel(opt) : opt}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

export default function OrganisationSettingsScreen() {
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { colors } = useTheme()

  const { data: org, isLoading } = useQuery({
    queryKey: ["mobile-organization"],
    queryFn: () => apiFetch<any>("/organization"),
  })

  const [name, setName] = useState("")
  const [legalName, setLegalName] = useState("")
  const [taxId, setTaxId] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [defaultTaxRate, setDefaultTaxRate] = useState("0")
  const [fiscalYearStart, setFiscalYearStart] = useState("January")

  useEffect(() => {
    if (org) {
      setName(org.name ?? "")
      setLegalName(org.legalName ?? "")
      setTaxId(org.taxId ?? "")
      setCurrency(org.currency ?? "USD")
      setDefaultTaxRate(String(org.defaultTaxRate ?? 0))
      setFiscalYearStart(org.fiscalYearStart ?? "January")
    }
  }, [org])

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/organization", { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-organization"] })
      queryClient.invalidateQueries({ queryKey: ["mobile-profile"] })
      queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] })
      Alert.alert("Saved", "Organisation settings updated.")
    },
    onError: (err: any) => Alert.alert("Error", err.message ?? "Failed to save."),
  })

  const handleSave = () => {
    if (!name.trim()) return Alert.alert("Required", "Organisation name is required.")
    saveMutation.mutate({ name, legalName, taxId, currency, defaultTaxRate: parseFloat(defaultTaxRate) || 0, fiscalYearStart })
  }

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
                marginRight: 12,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Workspace
              </Text>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                Organisation
              </Text>
            </View>
          </View>

          <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView
              contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {isLoading ? (
                <View style={{ alignItems: "center", paddingVertical: 48 }}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : (
                <>
                  <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="business-outline" size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Organisation Details</Text>
                        <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>Company profile and legal identity</Text>
                      </View>
                    </View>
                    <Field label="Organisation Name *" value={name} onChange={setName} placeholder="Acme Inc." />
                    <Field label="Legal Entity Name" value={legalName} onChange={setLegalName} placeholder="Acme Corporation Ltd." />
                    <Field label="Tax ID / VAT Number" value={taxId} onChange={setTaxId} placeholder="GB123456789" />
                  </View>

                  <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9" }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }}>
                        <Ionicons name="cash-outline" size={18} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Financial Settings</Text>
                        <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>Currency, tax & fiscal year</Text>
                      </View>
                    </View>

                    <PickerRow
                      label="Base Currency"
                      options={CURRENCIES}
                      selected={currency}
                      onSelect={setCurrency}
                    />

                    <Field
                      label="Default Tax Rate (%)"
                      value={defaultTaxRate}
                      onChange={setDefaultTaxRate}
                      placeholder="0"
                      keyboardType="decimal-pad"
                    />

                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#64748B", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
                      Fiscal Year Start
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
                      {MONTHS.map((m) => (
                        <TouchableOpacity
                          key={m}
                          onPress={() => setFiscalYearStart(m)}
                          style={{
                            paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
                            backgroundColor: fiscalYearStart === m ? colors.primary : "#F8FAFC",
                            borderWidth: 1,
                            borderColor: fiscalYearStart === m ? colors.primary : "#E2E8F0",
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: "600", color: fiscalYearStart === m ? "#fff" : "#64748B" }}>
                            {m.slice(0, 3)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleSave}
                    disabled={saveMutation.isPending}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: colors.primary, borderRadius: 16, paddingVertical: 16,
                      alignItems: "center",
                      shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3, shadowRadius: 10, elevation: 4,
                    }}
                  >
                    {saveMutation.isPending
                      ? <ActivityIndicator color="#fff" />
                      : (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>Save Organisation Settings</Text>
                        </View>
                      )
                    }
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
