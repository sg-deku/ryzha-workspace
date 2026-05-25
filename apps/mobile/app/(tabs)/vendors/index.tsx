import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"

function VendorRow({ item }: { item: any }) {
  const router = useRouter()
  const isActive = item.status === "ACTIVE"

  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-2xl p-4 border border-slate-100 shadow-sm"
      onPress={() => router.push(`/(tabs)/vendors/${item.id}`)}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center gap-3">
        <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center">
          <Text className="text-purple-700 font-bold text-base">{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-slate-900">{item.name}</Text>
          <Text className="text-slate-400 text-xs mt-0.5">{item.paymentTerms ?? "NET30"}</Text>
        </View>
        <View className={`px-2 py-0.5 rounded-full ${isActive ? "bg-green-100" : "bg-slate-100"}`}>
          <Text className={`text-[10px] font-bold ${isActive ? "text-green-700" : "text-slate-500"}`}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function VendorsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-vendors"],
    queryFn: () => apiFetch<any[]>("/vendors"),
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Vendors</Text>
        <View className="bg-slate-100 px-3 py-1.5 rounded-full">
          <Text className="text-slate-600 text-xs font-semibold">{data?.length ?? 0} total</Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <VendorRow item={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="business-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-base">No vendors yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}
