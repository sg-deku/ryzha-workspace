import { useState, useEffect } from "react"
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, KeyboardAvoidingView, Platform, StatusBar,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useNavigation } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme } from "@/lib/theme"

function Field({
  label, value, onChange, placeholder, keyboardType, secureTextEntry, editable = true,
}: {
  label: string; value: string; onChange?: (v: string) => void
  placeholder?: string; keyboardType?: any; secureTextEntry?: boolean; editable?: boolean
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
        secureTextEntry={secureTextEntry}
        editable={editable}
        autoCapitalize="none"
      />
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: 11, fontWeight: "700", color: "#94A3B8",
      textTransform: "uppercase", letterSpacing: 0.8,
      marginBottom: 12, marginTop: 4,
    }}>
      {title}
    </Text>
  )
}

export default function ProfileSettingsScreen() {
  const { logout } = useAuth()
  const navigation = useNavigation()
  const queryClient = useQueryClient()
  const { colors } = useTheme()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: () => apiFetch<any>("/profile"),
  })

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name ?? "")
      setEmail(profile.email ?? "")
    }
  }, [profile])

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/profile", { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-profile"] })
      Alert.alert("Saved", "Profile updated successfully.")
    },
    onError: (err: any) => Alert.alert("Error", err.message ?? "Failed to update profile."),
  })

  const passwordMutation = useMutation({
    mutationFn: (data: any) => apiFetch("/profile/password", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      Alert.alert("Password Changed", "Your password has been updated.")
    },
    onError: (err: any) => Alert.alert("Error", err.message ?? "Failed to change password."),
  })

  const handleSaveProfile = () => {
    if (!name.trim()) return Alert.alert("Required", "Name cannot be empty.")
    updateMutation.mutate({ name: name.trim() })
  }

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword)
      return Alert.alert("Required", "Please fill in all password fields.")
    if (newPassword !== confirmPassword)
      return Alert.alert("Mismatch", "New passwords do not match.")
    if (newPassword.length < 8)
      return Alert.alert("Too Short", "Password must be at least 8 characters.")
    passwordMutation.mutate({ currentPassword, newPassword })
  }

  const initials = profile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("") ?? "?"

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
                Account
              </Text>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                Profile Settings
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
                <View style={{ alignItems: "center", paddingVertical: 32 }}>
                  <ActivityIndicator size="large" color="#4F46E5" />
                </View>
              ) : (
                <>
                  <View style={{ alignItems: "center", marginBottom: 28 }}>
                    <LinearGradient
                      colors={colors.gradient}
                      style={{
                        width: 80, height: 80, borderRadius: 26,
                        alignItems: "center", justifyContent: "center",
                        marginBottom: 12,
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 6,
                      }}
                    >
                      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800" }}>{initials}</Text>
                    </LinearGradient>
                    <Text style={{ fontSize: 18, fontWeight: "800", color: "#0F172A" }}>{profile?.name ?? "—"}</Text>
                    {profile?.organization && (
                      <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 6 }}>
                        <Text style={{ fontSize: 12, color: colors.primary, fontWeight: "700" }}>{profile.organization.name}</Text>
                      </View>
                    )}
                  </View>

                  <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9" }}>
                    <SectionHeader title="Personal Info" />
                    <Field label="Full Name" value={name} onChange={setName} placeholder="Your full name" />
                    <Field label="Email" value={email} editable={false} placeholder="your@email.com" keyboardType="email-address" />
                    {profile?.role && (
                      <Field label="Role" value={profile.role} editable={false} />
                    )}
                    <TouchableOpacity
                      onPress={handleSaveProfile}
                      disabled={updateMutation.isPending}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14,
                        alignItems: "center", marginTop: 4,
                        shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
                      }}
                    >
                      {updateMutation.isPending
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Save Changes</Text>
                      }
                    </TouchableOpacity>
                  </View>

                  <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9" }}>
                    <SectionHeader title="Change Password" />
                    <Field
                      label="Current Password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      placeholder="Enter current password"
                      secureTextEntry={!showPassword}
                    />
                    <Field
                      label="New Password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Min. 8 characters"
                      secureTextEntry={!showPassword}
                    />
                    <Field
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Repeat new password"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 }}
                    >
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={16} color="#64748B" />
                      <Text style={{ fontSize: 13, color: "#64748B" }}>{showPassword ? "Hide passwords" : "Show passwords"}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleChangePassword}
                      disabled={passwordMutation.isPending}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: "#0F172A", borderRadius: 14, paddingVertical: 14,
                        alignItems: "center",
                      }}
                    >
                      {passwordMutation.isPending
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>Update Password</Text>
                      }
                    </TouchableOpacity>
                  </View>

                  <View style={{ backgroundColor: "#FEF2F2", borderRadius: 20, padding: 20, borderWidth: 1, borderColor: "#FECACA" }}>
                    <SectionHeader title="Danger Zone" />
                    <TouchableOpacity
                      onPress={() => Alert.alert("Sign out", "Are you sure you want to sign out?", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Sign out", style: "destructive", onPress: logout },
                      ])}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: "row", alignItems: "center", gap: 10,
                        borderWidth: 1, borderColor: "#FECACA", borderRadius: 14,
                        paddingVertical: 14, paddingHorizontal: 16,
                        backgroundColor: "#fff",
                      }}
                    >
                      <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                      <Text style={{ fontSize: 15, fontWeight: "600", color: "#EF4444" }}>Sign out of all devices</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
