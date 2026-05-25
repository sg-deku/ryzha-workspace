import { useRef, useEffect } from "react"
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Animated, StatusBar,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useNavigation } from "expo-router"

const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  INFO:    { icon: "information-circle",  color: "#3B82F6", bg: "#EFF6FF" },
  SUCCESS: { icon: "checkmark-circle",    color: "#10B981", bg: "#ECFDF5" },
  WARNING: { icon: "warning",             color: "#F59E0B", bg: "#FFFBEB" },
  ERROR:   { icon: "close-circle",        color: "#EF4444", bg: "#FEF2F2" },
}

function NotifCard({ item, onMarkRead, index }: { item: any; onMarkRead: (id: string) => void; index: number }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.INFO
  const slideAnim = useRef(new Animated.Value(60)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }], opacity: fadeAnim }}>
      <TouchableOpacity
        onPress={() => !item.read && onMarkRead(item.id)}
        activeOpacity={0.8}
        style={{
          backgroundColor: "#fff",
          marginHorizontal: 16,
          marginBottom: 10,
          borderRadius: 16,
          padding: 14,
          borderWidth: 1,
          borderColor: item.read ? "#F1F5F9" : "#DBEAFE",
          borderLeftWidth: item.read ? 1 : 3,
          borderLeftColor: item.read ? "#F1F5F9" : meta.color,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: item.read ? 0.03 : 0.06,
          shadowRadius: 6,
          elevation: item.read ? 1 : 2,
          opacity: item.read ? 0.65 : 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <View style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: meta.bg,
            alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A", flex: 1, marginRight: 8 }} numberOfLines={1}>
                {item.title}
              </Text>
              {!item.read && (
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#3B82F6", flexShrink: 0 }} />
              )}
            </View>
            <Text style={{ fontSize: 13, color: "#64748B", lineHeight: 18 }} numberOfLines={3}>
              {item.message}
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 6 }}>
              {new Date(item.createdAt).toLocaleDateString("en-GB", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient()
  const navigation = useNavigation()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: () => apiFetch<any[]>("/notifications"),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch("/notifications", { method: "PATCH", body: JSON.stringify({ id }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] })
      queryClient.invalidateQueries({ queryKey: ["mobile-dashboard"] })
    },
  })

  const unreadCount = data?.filter((n) => !n.read).length ?? 0

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }} edges={["top"]}>
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#F8FAFC",
          borderBottomWidth: 1,
          borderBottomColor: "#F1F5F9",
        }}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{
              width: 36, height: 36, borderRadius: 10,
              backgroundColor: "#fff",
              alignItems: "center", justifyContent: "center",
              marginRight: 12,
              borderWidth: 1, borderColor: "#E2E8F0",
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "800", color: "#0F172A" }}>Notifications</Text>
          </View>
          {unreadCount > 0 && (
            <View style={{ backgroundColor: "#3B82F6", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>{unreadCount} new</Text>
            </View>
          )}
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
        ) : (
          <FlatList
            data={data ?? []}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <NotifCard item={item} index={index} onMarkRead={(id) => markRead.mutate(id)} />
            )}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3B82F6" />}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
            ListEmptyComponent={
              <View style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: 80 }}>
                <View style={{ width: 72, height: 72, borderRadius: 24, backgroundColor: "#EFF6FF", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                  <Ionicons name="notifications-outline" size={32} color="#93C5FD" />
                </View>
                <Text style={{ fontSize: 17, fontWeight: "700", color: "#0F172A" }}>All caught up</Text>
                <Text style={{ fontSize: 14, color: "#94A3B8", marginTop: 6 }}>No notifications right now</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </>
  )
}
