import { useState } from "react"
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  RefreshControl, Modal, TextInput, Alert, KeyboardAvoidingView, Platform,
} from "react-native"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import type { Expense } from "@ryzha/api-types"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-600",
}

function ExpenseRow({ expense }: { expense: Expense }) {
  const statusStyle = STATUS_COLORS[expense.status] ?? "bg-slate-100 text-slate-500"
  return (
    <View className="bg-white mx-4 mb-3 rounded-2xl p-4 border border-slate-100 shadow-sm">
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-2">
          <Text className="font-semibold text-slate-900" numberOfLines={1}>{expense.description}</Text>
          <Text className="text-slate-400 text-xs mt-0.5">
            {expense.category ?? "Uncategorised"} · {new Date(expense.date).toLocaleDateString("en-GB")}
          </Text>
        </View>
        <View className="items-end gap-1.5">
          <Text className="font-bold text-slate-900">${expense.amount.toFixed(2)}</Text>
          <View className={`px-2 py-0.5 rounded-full ${statusStyle.split(" ")[0]}`}>
            <Text className={`text-[10px] font-bold ${statusStyle.split(" ")[1]}`}>{expense.status}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

function AddExpenseModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [category, setCategory] = useState("")

  const mutation = useMutation({
    mutationFn: (data: { description: string; amount: number; category: string; date: string }) =>
      apiFetch("/expenses", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mobile-expenses"] })
      setDescription(""); setAmount(""); setCategory("")
      onClose()
    },
    onError: (err: any) => Alert.alert("Error", err.message),
  })

  const handleAdd = () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert("Error", "Description and amount are required")
      return
    }
    const parsed = parseFloat(amount)
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Enter a valid amount")
      return
    }
    mutation.mutate({
      description: description.trim(),
      amount: parsed,
      category: category.trim() || "Other",
      date: new Date().toISOString(),
    })
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView className="flex-1 bg-white" behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="px-5 pt-6 pb-3 flex-row items-center justify-between border-b border-slate-100">
          <Text className="text-xl font-bold text-slate-900">Add Expense</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View className="px-5 pt-5 space-y-4 flex-1">
          <Field label="Description" value={description} onChange={setDescription} placeholder="Coffee with client" />
          <Field label="Amount ($)" value={amount} onChange={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <Field label="Category" value={category} onChange={setCategory} placeholder="Travel, Software, Meals…" />
        </View>

        <View className="px-5 pb-8 pt-3">
          <TouchableOpacity
            className="bg-primary rounded-2xl py-4 items-center"
            onPress={handleAdd}
            disabled={mutation.isPending}
            activeOpacity={0.85}
          >
            {mutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-bold text-base">Add Expense</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function Field({ label, value, onChange, placeholder, keyboardType }: any) {
  return (
    <View>
      <Text className="text-sm font-semibold text-slate-700 mb-1.5">{label}</Text>
      <TextInput
        className="border border-slate-200 rounded-xl px-4 py-3 text-base text-slate-900 bg-slate-50"
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  )
}

export default function ExpensesScreen() {
  const [showAdd, setShowAdd] = useState(false)
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-expenses"],
    queryFn: () => apiFetch<Expense[]>("/expenses"),
  })

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-slate-900">Expenses</Text>
        <TouchableOpacity
          className="bg-primary rounded-full w-9 h-9 items-center justify-center"
          onPress={() => setShowAdd(true)}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExpenseRow expense={item} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 24 }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-20">
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text className="text-slate-400 mt-3 text-base">No expenses yet</Text>
            </View>
          }
        />
      )}

      <AddExpenseModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </SafeAreaView>
  )
}
