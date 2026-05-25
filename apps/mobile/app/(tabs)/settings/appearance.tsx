import { useState } from "react"
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar, Image,
} from "react-native"
import { useNavigation } from "expo-router"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { LinearGradient } from "expo-linear-gradient"
import { useTheme, ACCENT_THEMES, type ColorScheme, type AccentTheme } from "@/lib/theme"

const COLOR_SCHEMES: { value: ColorScheme; label: string; icon: string; sub: string }[] = [
  { value: "light", label: "Light", icon: "sunny-outline", sub: "Always use light mode" },
  { value: "dark", label: "Dark", icon: "moon-outline", sub: "Always use dark mode" },
  { value: "system", label: "System", icon: "phone-portrait-outline", sub: "Follow device setting" },
]

export default function AppearanceScreen() {
  const navigation = useNavigation()
  const { colorScheme, accentTheme, colors, setColorScheme, setAccentTheme } = useTheme()
  const [saved, setSaved] = useState(false)

  const handleColorScheme = (s: ColorScheme) => {
    setColorScheme(s)
    flashSaved()
  }

  const handleAccent = (t: AccentTheme) => {
    setAccentTheme(t)
    flashSaved()
  }

  const flashSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

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
          <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.15)",
                alignItems: "center", justifyContent: "center",
                marginRight: 12,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Preferences
              </Text>
              <Text style={{ color: "#fff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                Theme & Appearance
              </Text>
            </View>
            {saved && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }}>
                <Ionicons name="checkmark" size={14} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>Saved</Text>
              </View>
            )}
          </View>

          <ScrollView
            style={{ flex: 1, backgroundColor: "#F8FAFC", borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
            contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="contrast-outline" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Colour Mode</Text>
                  <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>Light, dark, or follow your device</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {COLOR_SCHEMES.map((scheme) => {
                  const isActive = colorScheme === scheme.value
                  return (
                    <TouchableOpacity
                      key={scheme.value}
                      onPress={() => handleColorScheme(scheme.value)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isActive ? colors.primary : "#F1F5F9",
                        backgroundColor: isActive ? colors.primaryLight : "#F8FAFC",
                      }}
                    >
                      <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: isActive ? colors.primary : "#E2E8F0",
                        alignItems: "center", justifyContent: "center",
                        marginRight: 14,
                      }}>
                        <Ionicons name={scheme.icon as any} size={20} color={isActive ? "#fff" : "#64748B"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: isActive ? colors.primary : "#0F172A" }}>
                          {scheme.label}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{scheme.sub}</Text>
                      </View>
                      {isActive && (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="checkmark" size={13} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#F1F5F9" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight, alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="color-palette-outline" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}>Colour Theme</Text>
                  <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 1 }}>Choose your accent colour palette</Text>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                {(Object.entries(ACCENT_THEMES) as [AccentTheme, typeof ACCENT_THEMES[AccentTheme]][]).map(([key, theme]) => {
                  const isActive = accentTheme === key
                  return (
                    <TouchableOpacity
                      key={key}
                      onPress={() => handleAccent(key)}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isActive ? theme.primary : "#F1F5F9",
                        backgroundColor: isActive ? `${theme.primary}12` : "#F8FAFC",
                      }}
                    >
                      <LinearGradient
                        colors={theme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{
                          width: 44, height: 44, borderRadius: 14,
                          marginRight: 14,
                          alignItems: "center", justifyContent: "center",
                        }}
                      >
                        <Image
                          source={require("../../../assets/logo.png")}
                          style={{ width: 26, height: 26, tintColor: "#fff", opacity: 0.9 }}
                          resizeMode="contain"
                        />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: isActive ? theme.primary : "#0F172A" }}>
                          {theme.name}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
                          <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: theme.primary }} />
                          <Text style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{theme.primary}</Text>
                        </View>
                      </View>
                      {isActive && (
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: theme.primary, alignItems: "center", justifyContent: "center" }}>
                          <Ionicons name="checkmark" size={13} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <View style={{
              backgroundColor: "#fff", borderRadius: 20, padding: 20,
              borderWidth: 1, borderColor: "#F1F5F9",
              flexDirection: "row", alignItems: "center", gap: 14,
            }}>
              <LinearGradient
                colors={colors.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
              >
                <Image
                  source={require("../../../assets/logo.png")}
                  style={{ width: 28, height: 28, tintColor: "#fff" }}
                  resizeMode="contain"
                />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#0F172A" }}>Preview</Text>
                <Text style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>
                  {ACCENT_THEMES[accentTheme].name} · {colorScheme === "system" ? "System default" : colorScheme === "dark" ? "Dark mode" : "Light mode"}
                </Text>
              </View>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary }} />
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </>
  )
}
