"use client"

import * as React from "react"
import { CheckCircle2, AlertCircle, Clock, XCircle, ChevronRight, Loader2, Unplug } from "lucide-react"
import { PROVIDERS } from "@/lib/providers"
import { ConnectModal } from "./connect-modal"

export type ConnectionStatus = "ACTIVE" | "EXPIRED" | "DISCONNECTED" | "ERROR"

export interface SerializedConnection {
  provider: string
  status: ConnectionStatus
  lastSyncAt: Date | null
}

interface Props {
  connections: SerializedConnection[]
  qbConfigured: boolean
}

function StatusBadge({ status }: { status: ConnectionStatus | "NOT_CONNECTED" }) {
  const map: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
    ACTIVE:        { icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400", label: "Connected"     },
    EXPIRED:       { icon: Clock,        cls: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",    label: "Expired"       },
    DISCONNECTED:  { icon: XCircle,      cls: "bg-muted text-muted-foreground",                                              label: "Disconnected"  },
    ERROR:         { icon: AlertCircle,  cls: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",                label: "Error"         },
    NOT_CONNECTED: { icon: XCircle,      cls: "bg-muted/50 text-muted-foreground",                                           label: "Not connected" },
  }
  const { icon: Icon, cls, label } = map[status] ?? map.NOT_CONNECTED
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  )
}

function DisconnectButton({ providerId, providerName, isQB, onDone }: {
  providerId: string
  providerName: string
  isQB: boolean
  onDone: () => void
}) {
  const [loading, setLoading] = React.useState(false)

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm(`Disconnect ${providerName}? This will stop all data syncing from this source.`)) return
    setLoading(true)
    try {
      if (isQB) {
        await fetch("/api/connect/quickbooks/disconnect", { method: "POST" })
        window.location.reload()
      } else {
        await fetch("/api/connect/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: providerId }),
        })
        onDone()
      }
    } catch {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="hidden group-hover:inline-flex items-center gap-1.5 text-xs font-medium text-red-500 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60 shrink-0"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Unplug className="h-3 w-3" />}
      Disconnect
    </button>
  )
}

export function ProviderGrid({ connections, qbConfigured }: Props) {
  const [selected, setSelected] = React.useState<string | null>(null)
  const [localConns, setLocalConns] = React.useState(connections)

  const connMap = Object.fromEntries(localConns.map((c) => [c.provider, c]))

  const selectedProvider = selected ? PROVIDERS.find((p) => p.id === selected) ?? null : null
  const selectedConn = selected ? (connMap[selected] ?? null) : null

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

  return (
    <>
      <div className="space-y-8">
        {Object.entries(byCategory).map(([category, providers]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              {category}
            </h3>
            <div className="rounded-xl border bg-card overflow-hidden divide-y">
              {providers.map((provider) => {
                const conn = connMap[provider.id]
                const status: ConnectionStatus | "NOT_CONNECTED" = conn ? conn.status : "NOT_CONNECTED"
                const isComingSoon = provider.authType === "coming_soon"
                const isConnected = conn?.status === "ACTIVE"
                const isStuck = conn?.status === "DISCONNECTED" || conn?.status === "ERROR"
                const isQB = provider.id === "QUICKBOOKS"
                const showDisconnect = !isComingSoon && (isConnected || (isQB && isStuck))

                return (
                  <div
                    key={provider.id}
                    className={`relative flex items-center gap-4 px-5 py-4 group transition-colors ${isComingSoon ? "opacity-60 cursor-default" : "hover:bg-muted/40 cursor-pointer"}`}
                    onClick={() => !isComingSoon ? setSelected(provider.id) : undefined}
                  >
                    <div className={`h-9 w-9 rounded-lg ${provider.color} flex items-center justify-center shrink-0`}>
                      <span className="text-white font-bold text-xs">{provider.logo}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{provider.name}</p>
                        {isComingSoon && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium shrink-0">
                            Coming soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{provider.description}</p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {showDisconnect && (
                        <DisconnectButton
                          providerId={provider.id}
                          providerName={provider.name}
                          isQB={isQB}
                          onDone={() => handleDisconnected(provider.id)}
                        />
                      )}
                      <StatusBadge status={status} />
                      {!isComingSoon && (
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {selectedProvider && (
        <ConnectModal
          provider={selectedProvider}
          connection={selectedConn}
          qbConfigured={qbConfigured}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
