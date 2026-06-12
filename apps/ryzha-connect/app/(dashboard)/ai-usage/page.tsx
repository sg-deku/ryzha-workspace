"use client"

import * as React from "react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { Zap, RefreshCw, Bot, Cpu, Server, Loader2 } from "lucide-react"
import Link from "next/link"

interface UsageData {
  today:     { totalTokens: number; promptTokens: number; completionTokens: number; calls: number }
  thisMonth: { totalTokens: number; promptTokens: number; completionTokens: number; calls: number }
  allTime:   { totalTokens: number; promptTokens: number; completionTokens: number; calls: number }
  byFeature: { feature: string; totalTokens: number; promptTokens: number; completionTokens: number; calls: number }[]
  byModel:   { model: string; totalTokens: number; calls: number }[]
  byProvider:{ provider: string; totalTokens: number; calls: number }[]
  monthlyTrend: { month: string; tokens: number }[]
  recentLogs: { id: string; feature: string; model: string; provider: string; promptTokens: number; completionTokens: number; totalTokens: number; createdAt: string }[]
}

const FEATURE_META: Record<string, { label: string; color: string }> = {
  agent_gl_coding:    { label: "GL Coding Agent",    color: "#6366f1" },
  agent_anomaly:      { label: "Anomaly Agent",       color: "#f59e0b" },
  agent_board_report: { label: "Board Report Agent",  color: "#10b981" },
  unknown:            { label: "Other",               color: "#94a3b8" },
}

const PROVIDER_COLORS: Record<string, string> = {
  openai:    "#10a37f",
  anthropic: "#c9a227",
  groq:      "#f97316",
  gemini:    "#4285f4",
  ollama:    "#64748b",
}

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function featureLabel(f: string) { return FEATURE_META[f]?.label ?? f }
function featureColor(f: string) { return FEATURE_META[f]?.color ?? "#94a3b8" }

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

function KPICard({ label, tokens, prompt, completion, calls }: {
  label: string; tokens: number; prompt: number; completion: number; calls: number
}) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <div>
        <p className="text-3xl font-bold tabular-nums">{fmt(tokens)}</p>
        <p className="text-xs text-muted-foreground">{calls.toLocaleString()} API calls</p>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        {tokens > 0 && (
          <div
            className="h-full rounded-full bg-primary"
            style={{ width: `${Math.round((prompt / tokens) * 100)}%` }}
          />
        )}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Prompt <strong className="text-foreground">{fmt(prompt)}</strong></span>
        <span>Completion <strong className="text-foreground">{fmt(completion)}</strong></span>
      </div>
    </div>
  )
}

export default function AIUsagePage() {
  const [data, setData] = React.useState<UsageData | null>(null)
  const [loading, setLoading] = React.useState(true)

  const load = React.useCallback(() => {
    setLoading(true)
    fetch("/api/settings/ai-usage")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => { load() }, [load])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            AI Token Monitoring
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Track token consumption across all Ryzha AI agents and features.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/settings?tab=ai"
            className="text-sm border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
          >
            AI Settings
          </Link>
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !data ? null : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard label="Today" tokens={data.today.totalTokens} prompt={data.today.promptTokens} completion={data.today.completionTokens} calls={data.today.calls} />
            <KPICard label="This Month" tokens={data.thisMonth.totalTokens} prompt={data.thisMonth.promptTokens} completion={data.thisMonth.completionTokens} calls={data.thisMonth.calls} />
            <KPICard label="All Time" tokens={data.allTime.totalTokens} prompt={data.allTime.promptTokens} completion={data.allTime.completionTokens} calls={data.allTime.calls} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm font-semibold mb-1">Monthly Trend</p>
              <p className="text-xs text-muted-foreground mb-4">Total tokens per month - last 6 months</p>
              {data.monthlyTrend.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data.monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={fmt} width={44} />
                    <Tooltip formatter={((v: any) => [fmt(Number(v)), "Tokens"]) as any} />
                    <Bar dataKey="tokens" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm font-semibold mb-1">This Month by Agent</p>
              <p className="text-xs text-muted-foreground mb-4">Token breakdown per AI feature</p>
              {data.byFeature.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No usage this month</p>
              ) : (
                <div className="space-y-3">
                  {data.byFeature.map((f) => {
                    const pct = data.thisMonth.totalTokens > 0
                      ? Math.round((f.totalTokens / data.thisMonth.totalTokens) * 100)
                      : 0
                    return (
                      <div key={f.feature} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{featureLabel(f.feature)}</span>
                          <span className="text-muted-foreground text-xs">{fmt(f.totalTokens)} · {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: featureColor(f.feature) }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {f.calls} calls · {fmt(f.promptTokens)} prompt · {fmt(f.completionTokens)} completion
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" /> By Model (All Time)
              </p>
              {data.byModel.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                <div className="space-y-2 mt-3">
                  {data.byModel.map((m) => {
                    const pct = data.allTime.totalTokens > 0
                      ? Math.round((m.totalTokens / data.allTime.totalTokens) * 100) : 0
                    return (
                      <div key={m.model} className="space-y-0.5">
                        <div className="flex justify-between text-sm">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{m.model}</code>
                          <span className="text-xs text-muted-foreground">{fmt(m.totalTokens)} · {pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">{m.calls} calls</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-sm font-semibold mb-1 flex items-center gap-2">
                <Server className="h-4 w-4 text-muted-foreground" /> By Provider (All Time)
              </p>
              {data.byProvider.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No data</p>
              ) : (
                <div className="flex flex-col gap-4 mt-3">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={data.byProvider.map((p) => ({ name: p.provider, value: p.totalTokens }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {data.byProvider.map((p) => (
                          <Cell key={p.provider} fill={PROVIDER_COLORS[p.provider] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={((v: any) => [fmt(Number(v)), "Tokens"]) as any} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-3">
                    {data.byProvider.map((p) => (
                      <div key={p.provider} className="flex items-center gap-1.5 text-xs">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PROVIDER_COLORS[p.provider] ?? "#94a3b8" }} />
                        <span className="capitalize font-medium">{p.provider}</span>
                        <span className="text-muted-foreground">{fmt(p.totalTokens)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-5 border-b flex items-center justify-between">
              <div>
                <p className="font-semibold">Recent Activity</p>
                <p className="text-xs text-muted-foreground mt-0.5">Last 100 AI calls across all agents</p>
              </div>
            </div>
            {data.recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <Bot className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No AI calls yet - run an agent to see usage here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="text-left px-5 py-3 font-medium">Time</th>
                      <th className="text-left px-5 py-3 font-medium">Agent / Feature</th>
                      <th className="text-left px-5 py-3 font-medium">Model</th>
                      <th className="text-left px-5 py-3 font-medium">Provider</th>
                      <th className="text-right px-5 py-3 font-medium">Prompt</th>
                      <th className="text-right px-5 py-3 font-medium">Completion</th>
                      <th className="text-right px-5 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.recentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {formatTime(log.createdAt)}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: featureColor(log.feature) + "22",
                              color: featureColor(log.feature),
                            }}
                          >
                            {featureLabel(log.feature)}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.model}</code>
                        </td>
                        <td className="px-5 py-3 text-xs capitalize text-muted-foreground">{log.provider}</td>
                        <td className="px-5 py-3 text-right text-xs tabular-nums">{fmt(log.promptTokens)}</td>
                        <td className="px-5 py-3 text-right text-xs tabular-nums">{fmt(log.completionTokens)}</td>
                        <td className="px-5 py-3 text-right text-xs tabular-nums font-medium">{fmt(log.totalTokens)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
