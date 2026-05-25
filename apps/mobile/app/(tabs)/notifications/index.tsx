import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

const TYPE_ICONS: Record<string, { name: string; color: string; bg: string }> = {
  INFO: { name: "information-circle-outline", color: "#2563eb", bg: "bg-blue-100" },
  SUCCESS: { name: "checkmark-circle-outline", color: "#16a34a", bg: "bg-green-100" },
  WARNING: { name: "warning-outline", color: "#d97706", bg: "bg-amber-100" },
  ERROR: { name: "close-circle-outline", color: "#dc2626", bg: "bg-red-100" },
}

function NotifRow({ item, onMarkRead }: { item: any; onMarkRead: (id: string) => void }) {
  const icon = TYPE_ICONS[item.type] ?? TYPE_ICONS.INFO

  return (
    <TouchableOpacity
      className={`bg-white mx-4 mb-3 rounded-2xl p-4 border shadow-sm ${item.read ? "border-slate-100 opacity-60" : "border-blue-100"}`}
      onPress={() => !item.read && onMarkRead(item.id)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-start gap-3">
        <View className={`${icon.bg} rounded-full p-2 mt-0.5`}>
          <Ionicons name={icon.name as any} size={18} color={icon.color} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-slate-900 text-sm flex-1 mr-2" numberOfLines={1}>{item.title}</Text>
            {!item.read && <View className="w-2 h-2 rounded-full bg-blue-500" />}
          </View>
          <Text className="text-slate-500 text-xs mt-1" numberOfLines={3}>{item.message}</Text>
          <Text className="text-slate-400 text-xs mt-1.5">
            {new Date(item.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function NotificationsScreen() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-notifications"],
    queryFn: () => apiFetch<any[]>("/notifications"),
  })

  const markRead = useMutation({
    mutationFn: (id: string) => apiFetch("/notifications", { method: "PATCH", body: JSON.stringify({ id }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mobile-notifications"] }),
  })

  const unreadCount = data?.filter((n) => !n.read).length ?? 0

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
        {unreadCount > 0 && (
          <View className="bg-blue-500 px-2.5 py-1 rounded-full">
            <Text className="text-white text-xs font-bold">{unreadCount} new</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotifRow item={item} onMarkRead={(id) => markRead.mutate(id)} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="notifications-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-base">No notifications</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
