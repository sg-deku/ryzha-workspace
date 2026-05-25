import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/lib/auth"

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing fields", "Please enter your email and password")
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      Alert.alert("Sign in failed", err.message || "Please check your credentials and try again")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    Alert.alert(
      "Reset your password",
      "Visit ryzha.vercel.app in your browser to reset your password.",
      [{ text: "OK" }]
    )
  }

  return (
    <LinearGradient
      colors={["#0F172A", "#1E1B4B", "#0F172A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="items-center mb-10">
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 20,
                  backgroundColor: "#4F46E5",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 20,
                  shadowColor: "#4F46E5",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.5,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", letterSpacing: -1 }}>R</Text>
              </View>
              <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800", letterSpacing: -0.5 }}>Ryzha</Text>
              <Text style={{ color: "#94A3B8", fontSize: 14, marginTop: 4 }}>Financial Intelligence</Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: 24,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                padding: 24,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 6 }}>
                Welcome back
              </Text>
              <Text style={{ color: "#64748B", fontSize: 14, marginBottom: 24 }}>
                Sign in to your workspace
              </Text>

              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: "#CBD5E1", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
                  Email
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    paddingHorizontal: 14,
                  }}
                >
                  <Ionicons name="mail-outline" size={16} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, color: "#F1F5F9", fontSize: 15, paddingVertical: 14 }}
                    placeholder="you@company.com"
                    placeholderTextColor="#475569"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={{ marginBottom: 8 }}>
                <Text style={{ color: "#CBD5E1", fontSize: 13, fontWeight: "600", marginBottom: 8 }}>
                  Password
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.12)",
                    paddingHorizontal: 14,
                  }}
                >
                  <Ionicons name="lock-closed-outline" size={16} color="#64748B" style={{ marginRight: 10 }} />
                  <TextInput
                    style={{ flex: 1, color: "#F1F5F9", fontSize: 15, paddingVertical: 14 }}
                    placeholder="••••••••"
                    placeholderTextColor="#475569"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} activeOpacity={0.7}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleForgotPassword}
                activeOpacity={0.7}
                style={{ alignSelf: "flex-end", marginBottom: 28, marginTop: 6 }}
              >
                <Text style={{ color: "#818CF8", fontSize: 13, fontWeight: "600" }}>
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.88}
                style={{
                  borderRadius: 14,
                  overflow: "hidden",
                }}
              >
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    alignItems: "center",
                    borderRadius: 14,
                    shadowColor: "#4F46E5",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700", letterSpacing: 0.2 }}>
                      Sign in
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: "center", marginTop: 28 }}>
              <Text style={{ color: "#475569", fontSize: 13 }}>
                Need an account?{" "}
                <Text
                  style={{ color: "#818CF8", fontWeight: "600" }}
                  onPress={() => Alert.alert("Sign up", "Visit ryzha.vercel.app to create your workspace.")}
                >
                  Contact us →
                </Text>
              </Text>
              <Text style={{ color: "#334155", fontSize: 11, marginTop: 24 }}>
                Ryzha © {new Date().getFullYear()}
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  )
}
