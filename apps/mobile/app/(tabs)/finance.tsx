import { ScrollView, View, Text, TouchableOpacity, StatusBar } from "react-native"
import { useRouter } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"

interface ModuleItem {
  icon: string
  label: string
  description: string
  route: string
  color: string
  bg: string
}

const MODULES: ModuleItem[] = [
  {
    icon: "document-text-outline",
    label: "Invoices",
    description: "AR invoices & billing",
    route: "/(tabs)/invoices/index",
    color: "#4F46E5",
    bg: "#EEF2FF",
  },
  {
    icon: "receipt-outline",
    label: "Expenses",
    description: "Track & approve spend",
    route: "/(tabs)/expenses/index",
    color: "#F59E0B",
    bg: "#FFF7ED",
  },
  {
    icon: "card-outline",
    label: "Payments",
    description: "Stripe transactions",
    route: "/(tabs)/payments/index",
    color: "#10B981",
    bg: "#ECFDF5",
  },
  {
    icon: "document-outline",
    label: "AP Invoices",
    description: "Vendor accounts payable",
    route: "/(tabs)/vendor-invoices/index",
    color: "#EF4444",
    bg: "#FEF2F2",
  },
  {
    icon: "swap-horizontal-outline",
    label: "Transactions",
    description: "Audit trail & workflow",
    route: "/(tabs)/transactions/index",
    color: "#8B5CF6",
    bg: "#F5F3FF",
  },
]

function ModuleCard({ item }: { item: ModuleItem }) {
  const router = useRouter()
  return (
    <TouchableOpacity
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.8}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 1,
      }}
    >
      <View style={{
        width: 46, height: 46,
        borderRadius: 14,
        backgroundColor: item.bg,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 14,
      }}>
        <Ionicons name={item.icon as any} size={22} color={item.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>{item.label}</Text>
        <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
    </TouchableOpacity>
  )
}

export default function FinanceScreen() {
  return (
    <>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#065F46", "#047857", "#059669"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}>
            <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Module
            </Text>
            <Text style={{ color: "#fff", fontSize: 26, fontWeight: "900", marginTop: 4, letterSpacing: -0.5 }}>
              Finance
            </Text>
          </View>

          <ScrollView
            style={{ flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12, marginTop: 8 }}>
              Financial Modules
            </Text>
            {MODULES.map((item) => (
              <ModuleCard key={item.route} item={item} />
            ))}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
