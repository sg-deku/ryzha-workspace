"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from "recharts"
import {
  Zap, RefreshCw, ArrowLeft, Bot, MessageSquare, FileSearch, Cpu, Server,
} from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

function fmt(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

const FEATURE_LABELS: Record<string, { label: string; color: string }> = {
  chat:                   { label: "AI Chat",              color: "#6366f1" },
  report_query:           { label: "Report Queries",       color: "#0ea5e9" },
  report_narrative:       { label: "Report Narratives",    color: "#14b8a6" },
  agent_auditor:          { label: "Auditor Agent",        color: "#f59e0b" },
  agent_r2r:              { label: "R2R Agent",            color: "#10b981" },
  agent_om:               { label: "O&M Agent",            color: "#8b5cf6" },
  agent_fpna:             { label: "FP&A Agent",           color: "#ef4444" },
  agent_p2p_requisition:  { label: "P2P Requisition",      color: "#f97316" },
  agent_p2p_gl:           { label: "P2P GL Coding",        color: "#ec4899" },
  agent_p2p_approval:     { label: "P2P Approval",         color: "#84cc16" },
  agent_p2p_vendor:       { label: "P2P Vendor Intake",    color: "#06b6d4" },
  agent_p2p_invoice:      { label: "P2P Invoice Capture",  color: "#a855f7" },
  agent_o2c_credit:       { label: "O2C Credit",           color: "#f43f5e" },
  agent_o2c_pricing:      { label: "O2C Pricing",          color: "#22c55e" },
  agent_o2c_collections:  { label: "O2C Collections",      color: "#eab308" },
  agent_o2c_validation:   { label: "O2C Validation",       color: "#3b82f6" },
  agent_o2c_dispute:      { label: "O2C Dispute",          color: "#d946ef" },
  agent_o2c_order_intake: { label: "O2C Order Intake",     color: "#64748b" },
  unknown:                { label: "Other",                 color: "#94a3b8" },
}

function featureLabel(f: string) {
  return FEATURE_LABELS[f]?.label ?? f
}

function featureColor(f: string) {
  return FEATURE_LABELS[f]?.color ?? "#94a3b8"
}

const PROVIDER_COLORS: Record<string, string> = {
  groq: "#f97316", openai: "#10a37f", anthropic: "#c9a227", gemini: "#4285f4", ollama: "#64748b",
}

interface UsageData {
  today:    { totalTokens: number; promptTokens: number; completionTokens: number; calls: number }
  thisMonth:{ totalTokens: number; promptTokens: number; completionTokens: number; calls: number }
  allTime:  { totalTokens: number; promptTokens: number; completionTokens: number; calls: number }
  byFeature: { feature: string; totalTokens: number; promptTokens: number; completionTokens: number; calls: number }[]
  byModel:   { model: string; totalTokens: number; calls: number }[]
  byProvider:{ provider: string; totalTokens: number; calls: number }[]
  monthlyTrend: { month: string; tokens: number }[]
  recentLogs: { id: string; feature: string; model: string; provider: string; promptTokens: number; completionTokens: number; totalTokens: number; createdAt: string }[]
}

export function AIUsagePage() {
  const [data, setData] = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/ai-usage")
      if (res.ok) setData(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch_() }, [fetch_])

  const kpis = [
    {
      label: "Today",
      tokens: data?.today.totalTokens ?? 0,
      prompt: data?.today.promptTokens ?? 0,
      completion: data?.today.completionTokens ?? 0,
      calls: data?.today.calls ?? 0,
    },
    {
      label: "This Month",
      tokens: data?.thisMonth.totalTokens ?? 0,
      prompt: data?.thisMonth.promptTokens ?? 0,
      completion: data?.thisMonth.completionTokens ?? 0,
      calls: data?.thisMonth.calls ?? 0,
    },
    {
      label: "All Time",
      tokens: data?.allTime.totalTokens ?? 0,
      prompt: data?.allTime.promptTokens ?? 0,
      completion: data?.allTime.completionTokens ?? 0,
      calls: data?.allTime.calls ?? 0,
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/financial-engine?tab=ai">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Zap className="h-7 w-7 text-yellow-500" />
              AI Token Usage
            </h1>
            <p className="text-muted-foreground text-sm">Detailed breakdown of AI token consumption across all features</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetch_} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading && !data ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {kpis.map((k) => (
              <Card key={k.label} className="card-elevated">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-3xl font-bold tabular-nums">{fmt(k.tokens)}</p>
                    <p className="text-xs text-muted-foreground">{k.calls.toLocaleString()} API calls</p>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Prompt <strong className="text-foreground">{fmt(k.prompt)}</strong></span>
                    <span>Completion <strong className="text-foreground">{fmt(k.completion)}</strong></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    {k.tokens > 0 && (
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round((k.prompt / k.tokens) * 100)}%` }}
                      />
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Blue = prompt tokens</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">Monthly Trend (Last 6 Months)</CardTitle>
                <CardDescription>Total tokens consumed per month</CardDescription>
              </CardHeader>
              <CardContent>
                {data.monthlyTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.monthlyTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} width={48} />
                      <Tooltip formatter={((v: any) => [fmt(Number(v)), "Tokens"]) as any} />
                      <Bar dataKey="tokens" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base">This Month by Feature</CardTitle>
                <CardDescription>Token breakdown across all AI features</CardDescription>
              </CardHeader>
              <CardContent>
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
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Badge variant="secondary" className="font-mono text-xs">{fmt(f.totalTokens)}</Badge>
                              <span className="w-8 text-right text-xs">{pct}%</span>
                            </span>
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
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  By Model (All Time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.byModel.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <div className="space-y-2">
                    {data.byModel.map((m) => {
                      const pct = data.allTime.totalTokens > 0
                        ? Math.round((m.totalTokens / data.allTime.totalTokens) * 100)
                        : 0
                      return (
                        <div key={m.model} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{m.model}</code>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Badge variant="outline" className="font-mono text-xs">{fmt(m.totalTokens)}</Badge>
                              <span className="text-xs w-8 text-right">{pct}%</span>
                            </span>
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
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  By Provider (All Time)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data.byProvider.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No data</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.byProvider.map((p) => ({ name: p.provider, value: p.totalTokens }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        label={((props: any) => `${props.name ?? ""} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`) as any}
                        labelLine={false}
                      >
                        {data.byProvider.map((p) => (
                          <Cell key={p.provider} fill={PROVIDER_COLORS[p.provider] ?? "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={((v: any) => [fmt(Number(v)), "Tokens"]) as any} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="text-base">Recent Activity Log</CardTitle>
              <CardDescription>Last 100 AI calls across all features</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No logs yet. Run a workflow or use the AI chat to generate usage.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Feature</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead className="text-right">Prompt</TableHead>
                        <TableHead className="text-right">Completion</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                            {format(new Date(log.createdAt), "MMM d, HH:mm:ss")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className="text-xs"
                              style={{ backgroundColor: featureColor(log.feature) + "22", color: featureColor(log.feature) }}
                            >
                              {featureLabel(log.feature)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{log.model}</code>
                          </TableCell>
                          <TableCell>
                            <span
                              className="text-xs font-medium capitalize"
                              style={{ color: PROVIDER_COLORS[log.provider] ?? "inherit" }}
                            >
                              {log.provider}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-xs font-mono">{log.promptTokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs font-mono">{log.completionTokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs font-mono font-semibold">{log.totalTokens.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-12">Failed to load usage data.</p>
      )}
    </div>
  )
}
