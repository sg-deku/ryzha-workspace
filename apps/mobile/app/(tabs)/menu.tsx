import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, StatusBar, Image,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme, ACCENT_THEMES } from "@/lib/theme"

interface MenuItem {
  icon: string
  label: string
  sub?: string
  onPress: () => void
  danger?: boolean
  badge?: number
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <TouchableOpacity
      onPress={item.onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#F8FAFC",
      }}
    >
      <View style={{
        width: 36, height: 36, borderRadius: 10,
        backgroundColor: item.danger ? "#FEF2F2" : "#F1F5F9",
        alignItems: "center", justifyContent: "center", marginRight: 14,
      }}>
        <Ionicons name={item.icon as any} size={18} color={item.danger ? "#EF4444" : "#475569"} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: item.danger ? "#EF4444" : "#0F172A" }}>
          {item.label}
        </Text>
        {item.sub && (
          <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>{item.sub}</Text>
        )}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {(item.badge ?? 0) > 0 && (
          <View style={{
            backgroundColor: "#EF4444", borderRadius: 10,
            paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{item.badge}</Text>
          </View>
        )}
        {!item.danger && <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />}
      </View>
    </TouchableOpacity>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 11, fontWeight: "700", color: "#94A3B8",
        textTransform: "uppercase", letterSpacing: 0.8,
        paddingHorizontal: 16, marginBottom: 8,
      }}>
        {title}
      </Text>
      <View style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        marginHorizontal: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        overflow: "hidden",
      }}>
        {children}
      </View>
    </View>
  )
}

export default function MenuScreen() {
  const { logout } = useAuth()
  const router = useRouter()
  const { colors, accentTheme } = useTheme()

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: () => apiFetch<any>("/profile"),
  })

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ])
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
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/logo.png")}
              style={{ width: 28, height: 28, tintColor: "#fff", marginRight: 10, opacity: 0.9 }}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Workspace
              </Text>
              <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", letterSpacing: -0.5 }}>
                Menu
              </Text>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{
              marginHorizontal: 16,
              marginBottom: 20,
              backgroundColor: "#fff",
              borderRadius: 20,
              padding: 16,
              borderWidth: 1,
              borderColor: "#F1F5F9",
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 2,
            }}>
              {isLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => router.push("/(tabs)/settings")}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14 }}
                >
                  <LinearGradient
                    colors={colors.gradient}
                    style={{
                      width: 56, height: 56, borderRadius: 18,
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800" }}>{initials}</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 17, fontWeight: "800", color: "#0F172A" }}>{profile?.name ?? "—"}</Text>
                    <Text style={{ fontSize: 13, color: "#64748B", marginTop: 1 }}>{profile?.email ?? "—"}</Text>
                    {profile?.organization && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <View style={{ backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, color: colors.primary, fontWeight: "700" }}>
                            {profile.organization.name}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>

            <Section title="Profile">
              <MenuRow item={{
                icon: "person-circle-outline",
                label: "Profile Settings",
                sub: "Name, email, password",
                onPress: () => router.push("/(tabs)/settings"),
              }} />
            </Section>

            <Section title="Organisation">
              <MenuRow item={{
                icon: "business-outline",
                label: "Organisation Settings",
                sub: profile?.organization?.name ?? "Manage your workspace",
                onPress: () => router.push("/(tabs)/settings/organization"),
              }} />
            </Section>

            <Section title="Preferences">
              <MenuRow item={{
                icon: "language-outline",
                label: "Language",
                sub: "English (US)",
                onPress: () => Alert.alert("Language", "Language settings coming soon."),
              }} />
              <MenuRow item={{
                icon: "color-palette-outline",
                label: "Theme & Appearance",
                sub: ACCENT_THEMES[accentTheme].name,
                onPress: () => router.push("/(tabs)/settings/appearance"),
              }} />
            </Section>

            <Section title="Support">
              <MenuRow item={{
                icon: "help-circle-outline",
                label: "Help & FAQ",
                sub: "Documentation & guides",
                onPress: () => Alert.alert("Help", "Visit ryzha.vercel.app for documentation."),
              }} />
              <MenuRow item={{
                icon: "mail-outline",
                label: "Contact Support",
                sub: "Get help from the team",
                onPress: () => Alert.alert("Contact Support", "Email sushmit.ghosh@icloud.com for support."),
              }} />
            </Section>

            <Section title="Session">
              <MenuRow item={{
                icon: "log-out-outline",
                label: "Sign out",
                danger: true,
                onPress: handleLogout,
              }} />
            </Section>

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, marginBottom: 8 }}>
              <Image
                source={require("../../assets/logo.png")}
                style={{ width: 14, height: 14, tintColor: "#CBD5E1" }}
                resizeMode="contain"
              />
              <Text style={{ color: "#CBD5E1", fontSize: 11 }}>
                Ryzha Financial Intelligence · v1.0.0
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
