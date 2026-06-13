"use client"

import * as React from "react"
import {
  CheckCircle2, AlertCircle, Clock, XCircle, BookOpen,
  RefreshCw, Unplug, ExternalLink, Loader2,
} from "lucide-react"
import { PROVIDERS } from "@/lib/providers"
import type { ProviderConfig } from "@/lib/providers"
import { ConnectModal } from "./connect-modal"

function ProviderLogo({ provider, size = "md" }: { provider: ProviderConfig; size?: "sm" | "md" }) {
  const [imgError, setImgError] = React.useState(false)
  const dim = size === "sm" ? "h-8 w-8" : "h-9 w-9"
  const textSize = size === "sm" ? "text-[10px]" : "text-xs"

  if (provider.logoUrl && !imgError) {
    return (
      <div className={`${dim} rounded-lg bg-white dark:bg-zinc-900 border flex items-center justify-center shrink-0 overflow-hidden p-1`}>
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
    <div className={`${dim} rounded-lg ${provider.color} flex items-center justify-center shrink-0`}>
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

function fmtAbs(d: Date | null | undefined): string {
  if (!d) return "—"
  return new Date(d).toLocaleString()
}

const STATUS_MAP: Record<string, { icon: React.ElementType; dot: string; label: string; badge: string }> = {
  ACTIVE:        { icon: CheckCircle2, dot: "bg-emerald-500", label: "Connected",     badge: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400" },
  EXPIRED:       { icon: Clock,        dot: "bg-yellow-500",  label: "Expired",       badge: "text-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 dark:text-yellow-400"    },
  DISCONNECTED:  { icon: XCircle,      dot: "bg-muted-foreground/40", label: "Disconnected", badge: "text-muted-foreground bg-muted"                                       },
  ERROR:         { icon: AlertCircle,  dot: "bg-red-500",     label: "Error",         badge: "text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400"                },
  NOT_CONNECTED: { icon: XCircle,      dot: "bg-transparent", label: "Not connected", badge: "text-muted-foreground/60 bg-muted/50"                                        },
}

function StatusPill({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? STATUS_MAP.NOT_CONNECTED
  const Icon = s.icon
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${s.badge}`}>
      <Icon className="h-2.5 w-2.5 shrink-0" />
      {s.label}
    </span>
  )
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b last:border-0">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <div className="text-xs font-medium text-right">{value ?? <span className="text-muted-foreground/40">—</span>}</div>
    </div>
  )
}

function ConnectionDetailPanel({
  provider,
  conn,
  onClose,
  onDisconnected,
}: {
  provider: (typeof PROVIDERS)[number]
  conn: SerializedConnection
  onClose: () => void
  onDisconnected: () => void
}) {
  const [syncing, setSyncing] = React.useState(false)
  const [syncMsg, setSyncMsg] = React.useState<string | null>(null)
  const [syncOk, setSyncOk] = React.useState(true)
  const [disconnecting, setDisconnecting] = React.useState(false)
  const [localConn, setLocalConn] = React.useState(conn)

  const isQB = provider.id === "QUICKBOOKS"
  const isExpired = localConn.expiresAt ? new Date(localConn.expiresAt) < new Date() : false

  async function handleSync() {
    setSyncing(true)
    setSyncMsg(null)
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
      onDisconnected()
      onClose()
    } catch { setDisconnecting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md h-full bg-background border-l shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <ProviderLogo provider={provider} size="md" />
            <div>
              <h2 className="font-semibold text-sm">{provider.name}</h2>
              <p className="text-xs text-muted-foreground">{provider.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill status={localConn.status} />
            <button onClick={onClose} className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <DetailRow label="Status" value={<StatusPill status={localConn.status} />} />
            <DetailRow label="Last synced" value={fmt(localConn.lastSyncAt)} />
            <DetailRow
              label="Token expires"
              value={
                localConn.expiresAt
                  ? <span className={isExpired ? "text-red-500" : ""}>{isExpired ? "Expired" : fmt(localConn.expiresAt)}</span>
                  : null
              }
            />
            <DetailRow
              label="Last operation"
              value={
                localConn.lastOperation
                  ? <span className={localConn.lastOperation.status === "FAILED" ? "text-red-500" : "text-emerald-600"}>
                      {localConn.lastOperation.status} · {localConn.lastOperation.direction}
                    </span>
                  : null
              }
            />
            {(localConn.realmId || localConn.tenantId) && (
              <DetailRow
                label={localConn.realmId ? "Realm ID" : "Tenant ID"}
                value={<code className="font-mono text-[11px] text-muted-foreground">{localConn.realmId ?? localConn.tenantId}</code>}
              />
            )}
            <DetailRow
              label="COA mappings"
              value={
                (localConn.coaCount ?? 0) > 0
                  ? <a href="/coa-mapping" className="text-primary hover:underline flex items-center gap-1">{localConn.coaCount} accounts <ExternalLink className="h-3 w-3" /></a>
                  : isQB
                  ? <a href="/api/connect/quickbooks/sync" className="text-muted-foreground hover:text-foreground text-xs border rounded px-2 py-0.5 transition-colors flex items-center gap-1"><RefreshCw className="h-2.5 w-2.5" /> Sync now</a>
                  : null
              }
            />
          </div>

          {localConn.errorMessage && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20 px-4 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 dark:text-red-400">{localConn.errorMessage}</p>
            </div>
          )}

          <div className="rounded-xl border bg-card p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">What gets synced</p>
            {provider.syncPoints.map((pt) => (
              <div key={pt} className="flex items-start gap-2 text-xs">
                <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                {pt}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t p-4 space-y-2">
          {syncMsg && (
            <p className={`text-xs text-center ${syncOk ? "text-emerald-600" : "text-red-500"}`}>{syncMsg}</p>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 rounded-lg border text-sm font-medium px-4 py-2.5 hover:bg-muted transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync now"}
          </button>
          <div className="flex gap-2">
            {isQB && (
              <a
                href="/api/connect/quickbooks/auth"
                className="flex-1 flex items-center justify-center gap-1.5 text-xs rounded-lg border px-3 py-2 hover:bg-muted transition-colors"
              >
                Reconnect
              </a>
            )}
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60"
            >
              {disconnecting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ProviderGrid({ connections, qbConfigured }: Props) {
  const [selected, setSelected] = React.useState<string | null>(null)
  const [localConns, setLocalConns] = React.useState(connections)

  const connMap = Object.fromEntries(localConns.map((c) => [c.provider, c]))

  const selectedProvider = selected ? PROVIDERS.find((p) => p.id === selected) ?? null : null
  const selectedConn = selected ? (connMap[selected] ?? null) : null
  const isSelectedConnected = selectedConn?.status === "ACTIVE"

  const byCategory = PROVIDERS.reduce<Record<string, typeof PROVIDERS>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {})

  function handleDisconnected(providerId: string) {
    setLocalConns((prev) =>
      prev.map((c) => c.provider === providerId ? { ...c, status: "DISCONNECTED" as ConnectionStatus } : c)
    )
  }

  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSelected(null) }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [])

  return (
    <>
      <div className="space-y-8">
        {Object.entries(byCategory).map(([category, providers]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{category}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {providers.map((provider) => {
                const conn = connMap[provider.id]
                const status: ConnectionStatus | "NOT_CONNECTED" = conn ? conn.status : "NOT_CONNECTED"
                const isComingSoon = provider.authType === "coming_soon"
                const dot = STATUS_MAP[status]?.dot ?? STATUS_MAP.NOT_CONNECTED.dot

                return (
                  <button
                    key={provider.id}
                    type="button"
                    disabled={isComingSoon}
                    onClick={() => setSelected(provider.id)}
                    className={`relative flex flex-col items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all ${isComingSoon ? "opacity-50 cursor-default" : "hover:border-primary/30 hover:shadow-sm hover:bg-muted/20 cursor-pointer"} ${selected === provider.id ? "border-primary/40 shadow-sm" : ""}`}
                  >
                    <div className="flex items-start justify-between w-full gap-1">
                      <ProviderLogo provider={provider} size="sm" />

                      {status !== "NOT_CONNECTED" && (
                        <span className={`h-2 w-2 rounded-full mt-1 ${dot} shrink-0`} />
                      )}
                    </div>
                    <div className="min-w-0 w-full">
                      <p className="text-xs font-semibold leading-tight truncate">{provider.name}</p>
                      {isComingSoon ? (
                        <span className="text-[10px] text-muted-foreground/60">Coming soon</span>
                      ) : status === "NOT_CONNECTED" ? (
                        <span className="text-[10px] text-muted-foreground/60">Not connected</span>
                      ) : (
                        <span className={`text-[10px] ${STATUS_MAP[status]?.badge?.split(" ").find(c => c.startsWith("text-")) ?? "text-muted-foreground"}`}>
                          {STATUS_MAP[status]?.label}
                          {conn?.lastSyncAt ? ` · ${fmt(conn.lastSyncAt)}` : ""}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedProvider && selectedConn && isSelectedConnected && (
        <ConnectionDetailPanel
          provider={selectedProvider}
          conn={selectedConn}
          onClose={() => setSelected(null)}
          onDisconnected={() => handleDisconnected(selectedProvider.id)}
        />
      )}

      {selectedProvider && (!selectedConn || !isSelectedConnected) && (
        <ConnectModal
          provider={selectedProvider}
          connection={selectedConn ? { status: selectedConn.status, lastSyncAt: selectedConn.lastSyncAt } : null}
          qbConfigured={qbConfigured}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
