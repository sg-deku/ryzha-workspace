"use client"

import * as React from "react"
import {
  CheckCircle2, AlertCircle, Clock, XCircle,
  RefreshCw, Unplug, ExternalLink, Loader2, X, ChevronRight, Copy, Check,
} from "lucide-react"
import { PROVIDERS } from "@/lib/providers"
import type { ProviderConfig } from "@/lib/providers"
import { ConnectModal } from "./connect-modal"
import { cn } from "@/lib/utils"

function ProviderLogo({ provider, size = "md" }: { provider: ProviderConfig; size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = React.useState(false)
  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10"
  const textSize = size === "sm" ? "text-[10px]" : size === "lg" ? "text-base" : "text-xs"

  if (provider.logoUrl && !imgError) {
    return (
      <div className={`${dim} rounded-xl bg-white dark:bg-zinc-900 border border-border/60 flex items-center justify-center shrink-0 overflow-hidden p-1.5`}>
        <img
          src={provider.logoUrl}
          alt={provider.name}
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  return (
    <div className={`${dim} rounded-xl ${provider.color} flex items-center justify-center shrink-0`}>
      <span className={`text-white font-bold ${textSize}`}>{provider.logo}</span>
    </div>
  )
}

export type ConnectionStatus = "ACTIVE" | "EXPIRED" | "DISCONNECTED" | "ERROR"

export interface SerializedConnection {
  provider: string
  status: ConnectionStatus
  lastSyncAt: Date | null
  expiresAt?: Date | null
  realmId?: string | null
  tenantId?: string | null
  displayName?: string | null
  errorMessage?: string | null
  coaCount?: number
  lastOperation?: { status: string; direction: string } | null
}

interface Props {
  connections: SerializedConnection[]
  qbConfigured: boolean
  organizationId?: string
}

const WEBHOOK_PROVIDERS: Record<string, string> = {
  STRIPE_CONNECT: "stripe",
  RAMP:           "ramp",
  MERCURY:        "mercury",
  GUSTO:          "gusto",
}

function fmt(d: Date | null | undefined): string {
  if (!d) return "—"
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const STATUS_CFG: Record<string, { label: string; dot: string; text: string; bg: string; border: string }> = {
  ACTIVE:        { label: "Connected",     dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-900" },
  EXPIRED:       { label: "Expired",       dot: "bg-amber-500",   text: "text-amber-700 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-950/40",   border: "border-amber-200 dark:border-amber-900"   },
  ERROR:         { label: "Error",         dot: "bg-red-500",     text: "text-red-600 dark:text-red-400",       bg: "bg-red-50 dark:bg-red-950/40",       border: "border-red-200 dark:border-red-900"       },
  DISCONNECTED:  { label: "Disconnected",  dot: "bg-zinc-400",    text: "text-muted-foreground",                bg: "bg-muted",                            border: "border-border"                            },
  NOT_CONNECTED: { label: "Not connected", dot: "bg-transparent", text: "text-muted-foreground/50",             bg: "bg-muted/40",                         border: "border-transparent"                       },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.NOT_CONNECTED
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border ${cfg.text} ${cfg.bg} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

const ALL_CATEGORIES = ["All", ...Array.from(new Set(PROVIDERS.map((p) => p.category)))]

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b last:border-0">
      <p className="text-xs text-muted-foreground shrink-0 pt-0.5">{label}</p>
      <div className="text-xs font-medium text-right leading-relaxed">{value ?? <span className="text-muted-foreground/30">—</span>}</div>
    </div>
  )
}

function WebhookUrlRow({ providerId, orgId }: { providerId: string; orgId?: string }) {
  const [copied, setCopied] = React.useState(false)
  const webhookPath = WEBHOOK_PROVIDERS[providerId]
  if (!webhookPath || !orgId) return null

  const appUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL ?? "https://ryzha.vercel.app"
  const url = `${appUrl}/api/webhooks/${webhookPath}?orgId=${orgId}`

  function copy() {
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="py-2.5 border-b last:border-0">
      <p className="text-xs text-muted-foreground mb-1.5">Webhook URL</p>
      <div className="flex items-center gap-1.5 rounded-lg bg-muted/60 px-2 py-1.5">
        <code className="flex-1 text-[10px] font-mono text-muted-foreground truncate">{url}</code>
        <button
          onClick={copy}
          className="shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
          title="Copy webhook URL"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <p className="text-[10px] text-muted-foreground/60 mt-1">
        Configure this URL in your {providerId === "STRIPE_CONNECT" ? "Stripe" : providerId.charAt(0) + providerId.slice(1).toLowerCase()} dashboard to receive real-time events.
      </p>
    </div>
  )
}

function ConnectionDetail({
  provider,
  conn,
  onClose,
  onDisconnected,
  orgId,
}: {
  provider: ProviderConfig
  conn: SerializedConnection
  onClose: () => void
  onDisconnected: () => void
  orgId?: string
}) {
  const [syncing, setSyncing] = React.useState(false)
  const [syncMsg, setSyncMsg] = React.useState<string | null>(null)
  const [syncOk, setSyncOk] = React.useState(true)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const [localConn, setLocalConn] = React.useState(conn)

  React.useEffect(() => { setLocalConn(conn) }, [conn])

  const isQB = provider.id === "QUICKBOOKS"
  const isExpired = localConn.expiresAt ? new Date(localConn.expiresAt) < new Date() : false

  async function handleSync() {
    setSyncing(true); setSyncMsg(null)
    try {
      const res = await fetch("/api/connect/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: provider.id }),
      })
      const json = await res.json()
      if (!res.ok || json.error) { setSyncOk(false); setSyncMsg(json.error ?? "Sync failed") }
      else { setSyncOk(true); setSyncMsg("Sync complete"); setLocalConn((p) => ({ ...p, lastSyncAt: new Date() })) }
    } catch { setSyncOk(false); setSyncMsg("Network error") }
    finally { setSyncing(false) }
  }

  async function handleDisconnect() {
    if (!window.confirm(`Disconnect ${provider.name}? This will stop all data syncing.`)) return
    setDisconnecting(true)
    try {
      const url = isQB ? "/api/connect/quickbooks/disconnect" : "/api/connect/disconnect"
      const body = isQB ? undefined : JSON.stringify({ provider: provider.id })
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body })
      if (!res.ok) throw new Error("Failed")
      onDisconnected(); onClose()
    } catch { setDisconnecting(false) }
  }

  return (
    <div className="flex flex-col h-full border-l bg-background">
      <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
        <div className="flex items-center gap-3">
          <ProviderLogo provider={provider} size="md" />
          <div>
            <h3 className="font-semibold text-sm leading-tight">{provider.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{provider.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={localConn.status} />
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          <div className="rounded-xl border bg-card">
            <div className="px-4">
              <DetailRow label="Status" value={<StatusBadge status={localConn.status} />} />
              <DetailRow label="Last synced" value={fmt(localConn.lastSyncAt)} />
              {localConn.expiresAt && (
                <DetailRow
                  label="Token expires"
                  value={<span className={isExpired ? "text-red-500" : ""}>{isExpired ? "Expired" : fmt(localConn.expiresAt)}</span>}
                />
              )}
              {localConn.lastOperation && (
                <DetailRow
                  label="Last operation"
                  value={
                    <span className={localConn.lastOperation.status === "FAILED" ? "text-red-500" : "text-emerald-600"}>
                      {localConn.lastOperation.status} · {localConn.lastOperation.direction}
                    </span>
                  }
                />
              )}
              {(localConn.realmId || localConn.tenantId) && (
                <DetailRow
                  label={localConn.realmId ? "Realm ID" : "Tenant ID"}
                  value={<code className="font-mono text-[11px] text-muted-foreground">{localConn.realmId ?? localConn.tenantId}</code>}
                />
              )}
              <DetailRow
                label="COA accounts"
                value={
                  (localConn.coaCount ?? 0) > 0
                    ? <a href="/coa-mapping" className="text-primary hover:underline flex items-center justify-end gap-1">{localConn.coaCount} accounts <ExternalLink className="h-3 w-3" /></a>
                    : isQB
                    ? <a href="/api/connect/quickbooks/sync" className="text-muted-foreground hover:text-foreground text-xs border rounded px-2 py-0.5 transition-colors inline-flex items-center gap-1"><RefreshCw className="h-2.5 w-2.5" /> Sync COA</a>
                    : null
                }
              />
            </div>
          </div>

          {localConn.errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{localConn.errorMessage}</p>
            </div>
          )}

          {WEBHOOK_PROVIDERS[provider.id] && (
            <div className="rounded-xl border bg-card px-4">
              <WebhookUrlRow providerId={provider.id} orgId={orgId} />
            </div>
          )}

          <div className="rounded-xl border bg-card p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-3">What syncs</p>
            <div className="space-y-2">
              {provider.syncPoints.map((pt) => (
                <div key={pt} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  {pt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t p-4 space-y-2 shrink-0">
        {syncMsg && (
          <p className={`text-xs text-center ${syncOk ? "text-emerald-600" : "text-red-500"}`}>{syncMsg}</p>
        )}
        <button
          onClick={handleSync}
          disabled={syncing}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          {syncing ? "Syncing…" : "Sync now"}
        </button>
        <div className="flex gap-2">
          {isQB && (
            <a
              href="/api/connect/quickbooks/auth"
              className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg border px-3 py-2 hover:bg-muted transition-colors font-medium"
            >
              Reconnect
            </a>
          )}
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-500 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60 font-medium"
          >
            {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
            {disconnecting ? "Disconnecting…" : "Disconnect"}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProviderCard({
  provider,
  conn,
  selected,
  onClick,
}: {
  provider: ProviderConfig
  conn: SerializedConnection | undefined
  selected: boolean
  onClick: () => void
}) {
  const status = conn ? conn.status : "NOT_CONNECTED"
  const isComingSoon = provider.authType === "coming_soon"
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.NOT_CONNECTED

  return (
    <button
      type="button"
      disabled={isComingSoon}
      onClick={onClick}
      className={cn(
        "group relative w-full flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 text-left transition-all",
        isComingSoon ? "opacity-40 cursor-default" : "cursor-pointer hover:border-primary/30 hover:shadow-sm",
        selected ? "border-primary/40 bg-primary/[0.03] shadow-sm ring-1 ring-primary/20" : ""
      )}
    >
      <ProviderLogo provider={provider} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{provider.name}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{provider.description.split(".")[0]}</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isComingSoon ? (
          <span className="text-[10px] text-muted-foreground/50 font-medium">Soon</span>
        ) : status !== "NOT_CONNECTED" ? (
          <>
            <span className={`h-2 w-2 rounded-full ${cfg.dot}`} />
            {conn?.lastSyncAt && (
              <span className="text-[10px] text-muted-foreground hidden sm:block">{fmt(conn.lastSyncAt)}</span>
            )}
          </>
        ) : (
          <span className="text-[10px] text-muted-foreground/40">Connect</span>
        )}
        {!isComingSoon && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />}
      </div>
    </button>
  )
}

export function ProviderGrid({ connections, qbConfigured, organizationId }: Props) {
  const [selected, setSelected] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState("All")
  const [localConns, setLocalConns] = React.useState(connections)

  const connMap = Object.fromEntries(localConns.map((c) => [c.provider, c]))
  const selectedProvider = selected ? PROVIDERS.find((p) => p.id === selected) ?? null : null
  const selectedConn = selected ? (connMap[selected] ?? null) : null
  const isSelectedConnected = selectedConn?.status === "ACTIVE"

  const filteredProviders = activeTab === "All"
    ? PROVIDERS
    : PROVIDERS.filter((p) => p.category === activeTab)

  const connectedCount = (cat: string) => {
    const pool = cat === "All" ? PROVIDERS : PROVIDERS.filter((p) => p.category === cat)
    return pool.filter((p) => connMap[p.id]?.status === "ACTIVE").length
  }

  function handleDisconnected(providerId: string) {
    setLocalConns((prev) =>
      prev.map((c) => c.provider === providerId ? { ...c, status: "DISCONNECTED" as ConnectionStatus } : c)
    )
  }

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  const showPanel = !!selectedProvider

  return (
    <div className="flex gap-0 h-full">
      <div className={cn("flex flex-col gap-4 transition-all duration-200 min-w-0", showPanel ? "flex-1" : "w-full")}>
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {ALL_CATEGORIES.map((cat) => {
            const count = connectedCount(cat)
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0",
                  activeTab === cat
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {cat}
                {count > 0 && (
                  <span className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded-full leading-none",
                    activeTab === cat ? "bg-background/20 text-background" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="space-y-1.5">
          {filteredProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              conn={connMap[provider.id]}
              selected={selected === provider.id}
              onClick={() => setSelected(selected === provider.id ? null : provider.id)}
            />
          ))}
        </div>
      </div>

      {showPanel && selectedProvider && (
        <div className="w-[360px] shrink-0 ml-4 flex flex-col rounded-xl border overflow-hidden">
          {selectedConn && isSelectedConnected ? (
            <ConnectionDetail
              provider={selectedProvider}
              conn={selectedConn}
              onClose={() => setSelected(null)}
              onDisconnected={() => handleDisconnected(selectedProvider.id)}
              orgId={organizationId}
            />
          ) : (
            <ConnectModal
              provider={selectedProvider}
              connection={selectedConn ? { status: selectedConn.status, lastSyncAt: selectedConn.lastSyncAt } : null}
              qbConfigured={qbConfigured}
              onClose={() => setSelected(null)}
              panel
            />
          )}
        </div>
      )}
    </div>
  )
}
