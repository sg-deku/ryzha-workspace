import {
  View, Text, ScrollView, ActivityIndicator, RefreshControl,
} from "react-native"
import { useQuery } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { SafeAreaView } from "react-native-safe-area-context"

function StatCard({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <View className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex-1">
      <Text className="text-xs text-slate-400 font-semibold uppercase mb-1">{label}</Text>
      <Text className={`text-xl font-bold ${positive === false ? "text-red-600" : positive ? "text-green-700" : "text-slate-900"}`}>{value}</Text>
      {sub && <Text className="text-slate-400 text-xs mt-0.5">{sub}</Text>}
    </View>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <Text className="text-sm font-bold text-slate-500 uppercase px-4 mb-2 mt-4">{title}</Text>
}

function CategoryBar({ category, amount, max }: { category: string; amount: number; max: number }) {
  const pct = max > 0 ? (amount / max) * 100 : 0
  return (
    <View className="mb-3">
      <View className="flex-row justify-between mb-1">
        <Text className="text-slate-700 text-sm">{category}</Text>
        <Text className="text-slate-900 text-sm font-semibold">${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
      </View>
      <View className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <View className="h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
      </View>
    </View>
  )
}

export default function ReportsScreen() {
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["mobile-reports"],
    queryFn: () => apiFetch<any>("/reports"),
  })

  const fmt = (n: number) =>
    `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

  const maxCat = data?.expenseByCategory?.[0]?.amount ?? 1

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-slate-900">Reports</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#2563eb" />}
        >
          {data?.snapshot && (
            <>
              <SectionHeader title="Cash Position" />
              <View className="px-4 flex-row gap-3">
                <StatCard label="Bank Balance" value={fmt(data.snapshot.bankBalance)} />
                <StatCard
                  label="Runway"
                  value={`${data.snapshot.runwayMonths?.toFixed(1) ?? "—"} mo`}
                  sub={data.snapshot.zeroCashDate ? `Zero cash: ${new Date(data.snapshot.zeroCashDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}` : undefined}
                />
              </View>
            </>
          )}

          <SectionHeader title="This Month" />
          <View className="px-4 gap-3">
            <View className="flex-row gap-3">
              <StatCard label="Revenue" value={fmt(data?.monthly?.revenue ?? 0)} positive />
              <StatCard label="Expenses" value={fmt(data?.monthly?.expenses ?? 0)} positive={false} />
            </View>
            <StatCard
              label="Net Income"
              value={fmt(data?.monthly?.netIncome ?? 0)}
              positive={(data?.monthly?.netIncome ?? 0) >= 0}
            />
          </View>

          <SectionHeader title="Year to Date" />
          <View className="px-4 gap-3">
            <View className="flex-row gap-3">
              <StatCard label="Revenue" value={fmt(data?.ytd?.revenue ?? 0)} positive />
              <StatCard label="Expenses" value={fmt(data?.ytd?.expenses ?? 0)} positive={false} />
            </View>
            <StatCard
              label="Net Income YTD"
              value={fmt(data?.ytd?.netIncome ?? 0)}
              positive={(data?.ytd?.netIncome ?? 0) >= 0}
            />
          </View>

          {data?.expenseByCategory?.length > 0 && (
            <>
              <SectionHeader title="Expenses by Category (YTD)" />
              <View className="bg-white mx-4 rounded-2xl p-4 border border-slate-100">
                {data.expenseByCategory.map((item: any) => (
                  <CategoryBar key={item.category} category={item.category} amount={item.amount} max={maxCat} />
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}
