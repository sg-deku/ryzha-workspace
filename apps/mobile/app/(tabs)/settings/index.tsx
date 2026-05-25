import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

function SettingRow({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-4 border-b border-slate-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${danger ? "bg-red-100" : "bg-slate-100"}`}>
        <Ionicons name={icon as any} size={16} color={danger ? "#dc2626" : "#64748b"} />
      </View>
      <Text className={`flex-1 text-base font-medium ${danger ? "text-red-600" : "text-slate-900"}`}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />}
    </TouchableOpacity>
  )
}

export default function SettingsScreen() {
  const { logout } = useAuth()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: () => apiFetch<any>("/profile"),
  })

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: logout },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-slate-900">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {isLoading ? (
          <View className="items-center py-8">
            <ActivityIndicator color="#2563eb" />
          </View>
        ) : (
          <View className="bg-white mx-4 rounded-2xl mb-4 border border-slate-100 overflow-hidden">
            <View className="px-4 py-4 flex-row items-center gap-3 border-b border-slate-100">
              <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center">
                <Text className="text-blue-700 font-bold text-xl">
                  {profile?.name?.charAt(0)?.toUpperCase() ?? "?"}
                </Text>
              </View>
              <View>
                <Text className="text-slate-900 font-bold text-base">{profile?.name ?? "—"}</Text>
                <Text className="text-slate-500 text-sm">{profile?.email ?? "—"}</Text>
                {profile?.organization && (
                  <Text className="text-slate-400 text-xs mt-0.5">{profile.organization.name}</Text>
                )}
              </View>
            </View>
          </View>
        )}

        <View className="bg-white mx-4 rounded-2xl mb-4 border border-slate-100 overflow-hidden">
          <Text className="text-xs font-semibold text-slate-400 uppercase px-4 pt-3 pb-1">Account</Text>
          <SettingRow icon="person-outline" label="Profile" onPress={() => {}} />
          <SettingRow icon="business-outline" label="Organisation" onPress={() => {}} />
          <SettingRow icon="notifications-outline" label="Notifications" onPress={() => {}} />
        </View>

        <View className="bg-white mx-4 rounded-2xl mb-4 border border-slate-100 overflow-hidden">
          <Text className="text-xs font-semibold text-slate-400 uppercase px-4 pt-3 pb-1">Preferences</Text>
          <SettingRow icon="moon-outline" label="Appearance" onPress={() => {}} />
          <SettingRow icon="language-outline" label="Language" onPress={() => {}} />
        </View>

        <View className="bg-white mx-4 rounded-2xl mb-4 border border-slate-100 overflow-hidden">
          <Text className="text-xs font-semibold text-slate-400 uppercase px-4 pt-3 pb-1">Support</Text>
          <SettingRow icon="help-circle-outline" label="Help & FAQ" onPress={() => {}} />
          <SettingRow icon="mail-outline" label="Contact Us" onPress={() => {}} />
        </View>

        <View className="bg-white mx-4 rounded-2xl border border-slate-100 overflow-hidden">
          <SettingRow icon="log-out-outline" label="Sign Out" onPress={handleLogout} danger />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
