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
} from "react-native"
import { useAuth } from "@/lib/auth"

export default function LoginScreen() {
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your email and password")
      return
    }
    setLoading(true)
    try {
      await login(email.trim(), password)
    } catch (err: any) {
      Alert.alert("Login failed", err.message || "Please check your credentials and try again")
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-8">
        <View className="mb-10">
          <View className="w-12 h-12 rounded-xl bg-primary items-center justify-center mb-4">
            <Text className="text-white text-xl font-bold">R</Text>
          </View>
          <Text className="text-3xl font-bold text-slate-900">Welcome back</Text>
          <Text className="text-base text-slate-500 mt-1">Sign in to your Ryzha account</Text>
        </View>

        <View className="space-y-4">
          <View>
            <Text className="text-sm font-semibold text-slate-700 mb-1.5">Email</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 bg-slate-50"
              placeholder="you@company.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View className="mt-4">
            <Text className="text-sm font-semibold text-slate-700 mb-1.5">Password</Text>
            <TextInput
              className="border border-slate-200 rounded-xl px-4 py-3.5 text-base text-slate-900 bg-slate-50"
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            className="mt-6 bg-primary rounded-xl py-4 items-center"
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-white text-base font-bold">Sign in</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-center text-xs text-slate-400 mt-10">
          Ryzha Financial Intelligence © {new Date().getFullYear()}
        </Text>
      </View>
    </KeyboardAvoidingView>
  )
}
