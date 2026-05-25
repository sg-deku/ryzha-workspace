import { Tabs } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { Platform } from "react-native"

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4F46E5",
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#F1F5F9",
          borderTopWidth: 1,
          paddingBottom: Platform.OS === "ios" ? 8 : 6,
          paddingTop: 6,
          height: Platform.OS === "ios" ? 78 : 62,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: "700", letterSpacing: 0.2, marginBottom: 2 },
        tabBarIconStyle: { marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="finance"
        options={{
          title: "Finance",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "wallet" : "wallet-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="operations"
        options={{
          title: "Operations",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Aria",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sparkles" : "sparkles-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "Menu",
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "menu" : "menu-outline"} size={25} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="reports/index" options={{ href: null }} />
      <Tabs.Screen name="invoices/index" options={{ href: null }} />
      <Tabs.Screen name="invoices/[id]" options={{ href: null }} />
      <Tabs.Screen name="expenses/index" options={{ href: null }} />
      <Tabs.Screen name="payments/index" options={{ href: null }} />
      <Tabs.Screen name="vendor-invoices/index" options={{ href: null }} />
      <Tabs.Screen name="transactions/index" options={{ href: null }} />
      <Tabs.Screen name="customers/index" options={{ href: null }} />
      <Tabs.Screen name="customers/[id]" options={{ href: null }} />
      <Tabs.Screen name="vendors/index" options={{ href: null }} />
      <Tabs.Screen name="vendors/[id]" options={{ href: null }} />
      <Tabs.Screen name="sales-orders/index" options={{ href: null }} />
      <Tabs.Screen name="purchases/index" options={{ href: null }} />
      <Tabs.Screen name="notifications/index" options={{ href: null }} />
      <Tabs.Screen name="settings/index" options={{ href: null }} />
    </Tabs>
  )
}
