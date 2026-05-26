import {
  ScrollView, View, Text, TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useAuth } from "@/lib/auth"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { LinearGradient } from "expo-linear-gradient"

const INVOICE_STATUS: Record<string, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: "#1E293B", text: "#94A3B8", label: "Draft" },
  SENT: { bg: "#1E3A5F", text: "#60A5FA", label: "Sent" },
  PAID: { bg: "#14532D", text: "#4ADE80", label: "Paid" },
  VOID: { bg: "#1C1917", text: "#78716C", label: "Void" },
}

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function relativeDate(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Today"
  if (days === 1) return "Yesterday"
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

function KpiCard({ kpi }: { kpi: any }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>
        {kpi.title}
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A", letterSpacing: -0.5 }}>
        {kpi.value}
      </Text>
      {!!kpi.change && (
        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4, gap: 3 }}>
          {kpi.positive !== null && (
            <Ionicons
              name={kpi.positive ? "trending-up" : "trending-down"}
              size={12}
              color={kpi.positive ? "#10B981" : "#EF4444"}
            />
          )}
          <Text style={{
            fontSize: 11,
            fontWeight: "600",
            color: kpi.positive === true ? "#10B981" : kpi.positive === false ? "#EF4444" : "#64748B",
          }}>
            {kpi.change}
          </Text>
        </View>
      )}
    </View>
  )
}

function QuickAction({ icon, label, onPress, accent }: {
  icon: string; label: string; onPress: () => void; accent?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        flex: 1,
        alignItems: "center",
        backgroundColor: accent ? "#4F46E5" : "#fff",
        borderRadius: 16,
        paddingVertical: 16,
        borderWidth: 1,
        borderColor: accent ? "#4F46E5" : "#F1F5F9",
        shadowColor: accent ? "#4F46E5" : "#000",
        shadowOffset: { width: 0, height: accent ? 4 : 2 },
        shadowOpacity: accent ? 0.25 : 0.04,
        shadowRadius: accent ? 12 : 6,
        elevation: accent ? 4 : 1,
      }}
    >
      <Ionicons name={icon as any} size={22} color={accent ? "#fff" : "#4F46E5"} />
      <Text style={{
        fontSize: 11, fontWeight: "700", marginTop: 6,
        color: accent ? "#fff" : "#374151",
        letterSpacing: 0.1,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

export default function DashboardScreen() {
  const { user } = useAuth()
  const router = useRouter()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-dashboard"],
    queryFn: () => apiFetch<any>("/dashboard"),
  })

  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there"
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })

  const runwayColor = (data?.runwayMonths ?? 0) >= 6 ? "#10B981"
    : (data?.runwayMonths ?? 0) >= 3 ? "#F59E0B"
    : "#EF4444"

  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#1E1B4B", "#312E81", "#4338CA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{today}</Text>
                <Text style={{ color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 2, letterSpacing: -0.5 }}>
                  {greeting()}, {firstName} 👋
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/notifications")}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.12)",
                    alignItems: "center", justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="notifications-outline" size={19} color="#fff" />
                  {(data?.unreadNotifications ?? 0) > 0 && (
                    <View style={{
                      position: "absolute", top: 6, right: 6,
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: "#EF4444",
                      borderWidth: 1.5, borderColor: "#312E81",
                    }} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/menu")}
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    alignItems: "center", justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }}>
                    {firstName.charAt(0).toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#4F46E5"
                progressViewOffset={20}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80 }}>
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text style={{ color: "#94A3B8", marginTop: 12, fontSize: 14 }}>Loading your finances…</Text>
              </View>
            ) : (
              <>
                <View style={{ marginHorizontal: 16, marginTop: -1 }}>
                  <View
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 20,
                      padding: 20,
                      marginTop: 20,
                      shadowColor: "#4F46E5",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.12,
                      shadowRadius: 16,
                      elevation: 4,
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Cash Balance
                        </Text>
                        <Text style={{ fontSize: 32, fontWeight: "900", color: "#0F172A", letterSpacing: -1, marginTop: 4 }}>
                          {data?.cashBalanceFmt ?? "—"}
                        </Text>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.5 }}>
                          Runway
                        </Text>
                        <Text style={{ fontSize: 24, fontWeight: "800", color: runwayColor, letterSpacing: -0.5, marginTop: 4 }}>
                          {data?.runwayMonths > 0 ? `${data.runwayMonths.toFixed(1)}mo` : "—"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 14 }} />
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <View>
                        <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "600" }}>Burn Rate</Text>
                        <Text style={{ fontSize: 14, color: "#374151", fontWeight: "700", marginTop: 2 }}>{data?.burnRateFmt ?? "—"}</Text>
                      </View>
                      {data?.zeroCashDate && (
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ fontSize: 11, color: "#94A3B8", fontWeight: "600" }}>Zero Cash Date</Text>
                          <Text style={{ fontSize: 14, color: "#374151", fontWeight: "700", marginTop: 2 }}>
                            {new Date(data.zeroCashDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                    Key Metrics
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    {data?.kpis?.slice(0, 2).map((kpi: any) => (
                      <KpiCard key={kpi.title} kpi={kpi} />
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    {data?.kpis?.slice(2, 4).map((kpi: any) => (
                      <KpiCard key={kpi.title} kpi={kpi} />
                    ))}
                  </View>
                </View>

                <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                    Quick Actions
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
                    <QuickAction
                      icon="document-text-outline"
                      label="Invoices"
                      onPress={() => router.push("/(tabs)/invoices")}
                      accent
                    />
                    <QuickAction
                      icon="receipt-outline"
                      label="Expenses"
                      onPress={() => router.push("/(tabs)/expenses")}
                    />
                    <QuickAction
                      icon="sparkles-outline"
                      label="Ask Lyla"
                      onPress={() => router.push("/(tabs)/chat")}
                    />
                    <QuickAction
                      icon="bar-chart-outline"
                      label="Reports"
                      onPress={() => router.push("/(tabs)/reports")}
                    />
                  </View>
                </View>

                {(data?.recentInvoices?.length ?? 0) > 0 && (
                  <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                        Recent Invoices
                      </Text>
                      <TouchableOpacity onPress={() => router.push("/(tabs)/invoices")}>
                        <Text style={{ fontSize: 12, color: "#4F46E5", fontWeight: "700" }}>View all →</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#F1F5F9",
                      overflow: "hidden",
                    }}>
                      {data.recentInvoices.map((inv: any, idx: number) => {
                        const s = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.DRAFT
                        return (
                          <TouchableOpacity
                            key={inv.id}
                            onPress={() => router.push(`/(tabs)/invoices/${inv.id}`)}
                            activeOpacity={0.7}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: 16,
                              paddingVertical: 14,
                              borderBottomWidth: idx < data.recentInvoices.length - 1 ? 1 : 0,
                              borderBottomColor: "#F8FAFC",
                            }}
                          >
                            <View style={{
                              width: 36, height: 36, borderRadius: 10,
                              backgroundColor: "#EEF2FF",
                              alignItems: "center", justifyContent: "center", marginRight: 12,
                            }}>
                              <Text style={{ fontSize: 13, fontWeight: "800", color: "#4F46E5" }}>
                                {inv.clientName?.charAt(0)?.toUpperCase() ?? "?"}
                              </Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 14, fontWeight: "600", color: "#0F172A" }} numberOfLines={1}>
                                {inv.clientName}
                              </Text>
                              <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
                                {inv.invoiceNumber} · {relativeDate(inv.createdAt)}
                              </Text>
                            </View>
                            <View style={{ alignItems: "flex-end", gap: 4 }}>
                              <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }}>
                                ${inv.total.toLocaleString("en-US", { minimumFractionDigits: 0 })}
                              </Text>
                              <View style={{ backgroundColor: s.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                                <Text style={{ fontSize: 10, fontWeight: "700", color: s.text }}>{s.label}</Text>
                              </View>
                            </View>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                )}

                {(data || !isLoading) && (
                  <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>
                      Lyla AI Usage · This Month
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push("/(tabs)/chat")}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: "#fff",
                        borderRadius: 16,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: "#F1F5F9",
                        shadowColor: "#7C3AED",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                        <View style={{
                          width: 40, height: 40, borderRadius: 12,
                          backgroundColor: "#F5F3FF",
                          alignItems: "center", justifyContent: "center", marginRight: 12,
                        }}>
                          <Ionicons name="sparkles" size={20} color="#7C3AED" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Lyla Assistant</Text>
                          <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>AI-powered financial insights</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={15} color="#CBD5E1" />
                      </View>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, alignItems: "center" }}>
                          <Text style={{ fontSize: 20, fontWeight: "800", color: "#7C3AED" }}>{data?.aiUsage?.tokensFmt ?? "0"}</Text>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "#94A3B8", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 }}>Tokens</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, alignItems: "center" }}>
                          <Text style={{ fontSize: 20, fontWeight: "800", color: "#4F46E5" }}>{data?.aiUsage?.requests ?? 0}</Text>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "#94A3B8", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 }}>Requests</Text>
                        </View>
                        <View style={{ flex: 1, backgroundColor: "#F8FAFC", borderRadius: 10, padding: 12, alignItems: "center" }}>
                          <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A" }}>{data?.aiUsage?.chatMessages ?? 0}</Text>
                          <Text style={{ fontSize: 10, fontWeight: "600", color: "#94A3B8", marginTop: 2, textTransform: "uppercase", letterSpacing: 0.4 }}>Messages</Text>
                        </View>
                      </View>
                      {(data?.aiUsage?.tokensThisMonth ?? 0) > 0 && (
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 4 }}>
                          <Ionicons
                            name={data.aiUsage.positive ? "trending-down" : "trending-up"}
                            size={13}
                            color={data.aiUsage.positive ? "#10B981" : "#F59E0B"}
                          />
                          <Text style={{ fontSize: 12, color: data.aiUsage.positive ? "#10B981" : "#F59E0B", fontWeight: "600" }}>
                            {data.aiUsage.tokenChange} vs last month
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {(data?.recentExpenses?.length ?? 0) > 0 && (
                  <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                        Recent Expenses
                      </Text>
                      <TouchableOpacity onPress={() => router.push("/(tabs)/expenses")}>
                        <Text style={{ fontSize: 12, color: "#4F46E5", fontWeight: "700" }}>View all →</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{
                      backgroundColor: "#fff",
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#F1F5F9",
                      overflow: "hidden",
                    }}>
                      {data.recentExpenses.map((exp: any, idx: number) => (
                        <View
                          key={exp.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 14,
                            borderBottomWidth: idx < data.recentExpenses.length - 1 ? 1 : 0,
                            borderBottomColor: "#F8FAFC",
                          }}
                        >
                          <View style={{
                            width: 36, height: 36, borderRadius: 10,
                            backgroundColor: "#FFF7ED",
                            alignItems: "center", justifyContent: "center", marginRight: 12,
                          }}>
                            <Ionicons name="receipt-outline" size={16} color="#F59E0B" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#0F172A" }} numberOfLines={1}>
                              {exp.description}
                            </Text>
                            <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
                              {exp.category ?? "Uncategorised"} · {relativeDate(exp.date)}
                            </Text>
                          </View>
                          <Text style={{ fontSize: 14, fontWeight: "700", color: "#EF4444" }}>
                            −${exp.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
