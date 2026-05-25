import { useState, useRef } from "react"
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { apiFetch, API_BASE, getToken } from "@/lib/api"
import type { ChatMessage } from "@ryzha/api-types"

const SUGGESTED = [
  "What's our current runway?",
  "Show me overdue invoices",
  "What were our top expenses this month?",
  "How is revenue trending?",
]

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"
  return (
    <View className={`mb-3 ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && (
        <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mb-1">
          <Text className="text-white text-xs font-bold">A</Text>
        </View>
      )}
      <View
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-primary rounded-br-sm"
            : "bg-white border border-slate-100 rounded-bl-sm shadow-sm"
        }`}
      >
        <Text className={isUser ? "text-white text-sm" : "text-slate-800 text-sm"}>
          {message.content}
        </Text>
      </View>
    </View>
  )
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm Aria, your Ryzha financial assistant. Ask me anything about your finances." },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<FlatList>(null)

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    const userMsg: ChatMessage = { role: "user", content: text.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput("")
    setLoading(true)

    try {
      const token = await getToken()
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: updated }),
      })

      if (!res.ok) throw new Error("Chat unavailable")

      const data = await res.json()
      const reply = data?.content ?? data?.message ?? "Sorry, I couldn't process that."
      setMessages([...updated, { role: "assistant", content: reply }])
    } catch {
      setMessages([...updated, { role: "assistant", content: "Sorry, something went wrong. Please try again." }])
    } finally {
      setLoading(false)
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center gap-3 border-b border-slate-100 bg-white">
        <View className="w-9 h-9 rounded-full bg-primary items-center justify-center">
          <Text className="text-white font-bold text-sm">A</Text>
        </View>
        <View>
          <Text className="text-base font-bold text-slate-900">Aria</Text>
          <Text className="text-xs text-slate-400">Financial AI Assistant</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) => <MessageBubble message={item} />}
          contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          ListFooterComponent={
            loading ? (
              <View className="items-start mb-3">
                <View className="w-7 h-7 rounded-full bg-primary items-center justify-center mb-1">
                  <Text className="text-white text-xs font-bold">A</Text>
                </View>
                <View className="bg-white border border-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <ActivityIndicator size="small" color="#2563eb" />
                </View>
              </View>
            ) : null
          }
        />

        {messages.length === 1 && (
          <View className="px-4 pb-2">
            <Text className="text-xs text-slate-400 mb-2 font-medium">Suggested</Text>
            <View className="flex-row flex-wrap gap-2">
              {SUGGESTED.map((s) => (
                <TouchableOpacity
                  key={s}
                  className="bg-white border border-slate-200 rounded-full px-3 py-1.5"
                  onPress={() => send(s)}
                >
                  <Text className="text-xs text-slate-700">{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="flex-row items-end gap-2 px-4 pb-4 pt-2 bg-white border-t border-slate-100">
          <TextInput
            className="flex-1 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 bg-slate-50 max-h-28"
            placeholder="Ask Aria anything…"
            placeholderTextColor="#94a3b8"
            value={input}
            onChangeText={setInput}
            multiline
            onSubmitEditing={() => send(input)}
          />
          <TouchableOpacity
            className="w-10 h-10 rounded-full bg-primary items-center justify-center"
            onPress={() => send(input)}
            disabled={loading || !input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
