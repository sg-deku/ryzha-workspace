import { ScrollView, View, Text, TouchableOpacity, Alert, StatusBar, ActivityIndicator } from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

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

  const { data: profile, isLoading } = useQuery({
    queryKey: ["mobile-profile"],
    queryFn: () => apiFetch<any>("/profile"),
  })

  const { data: dashboard } = useQuery({
    queryKey: ["mobile-dashboard"],
    queryFn: () => apiFetch<any>("/dashboard"),
    staleTime: 60_000,
  })

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: logout },
    ])
  }

  const firstName = profile?.name?.split(" ")[0] ?? "—"
  const initials = profile?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("") ?? "?"

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1E1B4B", "#3730A3", "#4F46E5"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Workspace
            </Text>
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 4, letterSpacing: -0.5 }}>
              Menu
            </Text>
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
              shadowColor: "#4F46E5",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              elevation: 2,
            }}>
              {isLoading ? (
                <ActivityIndicator color="#4F46E5" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <LinearGradient
                    colors={["#4F46E5", "#7C3AED"]}
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
                        <View style={{ backgroundColor: "#EEF2FF", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                          <Text style={{ fontSize: 11, color: "#4F46E5", fontWeight: "700" }}>
                            {profile.organization.name}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>

            <Section title="Activity">
              <MenuRow item={{
                icon: "notifications-outline",
                label: "Notifications",
                sub: dashboard?.unreadNotifications > 0 ? `${dashboard.unreadNotifications} unread` : "All caught up",
                badge: dashboard?.unreadNotifications,
                onPress: () => router.push("/(tabs)/notifications"),
              }} />
              <MenuRow item={{
                icon: "bar-chart-outline",
                label: "Reports",
                sub: "P&L, cash flow, expenses",
                onPress: () => router.push("/(tabs)/reports"),
              }} />
            </Section>

            <Section title="Account">
              <MenuRow item={{
                icon: "person-outline",
                label: "Profile",
                sub: `Signed in as ${firstName}`,
                onPress: () => router.push("/(tabs)/settings"),
              }} />
              <MenuRow item={{
                icon: "business-outline",
                label: "Organisation",
                sub: profile?.organization?.name ?? "—",
                onPress: () => router.push("/(tabs)/settings"),
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
                sub: "sushmit.ghosh@icloud.com",
                onPress: () => Alert.alert("Contact", "Email sushmit.ghosh@icloud.com for support."),
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

            <Text style={{ textAlign: "center", color: "#CBD5E1", fontSize: 11, marginTop: 12, marginBottom: 8 }}>
              Ryzha Financial Intelligence · v1.0.0
            </Text>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
