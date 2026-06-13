"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Trash2, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

type SyncState = "idle" | "syncing" | "success" | "error"
type DisconnectState = "idle" | "loading" | "done" | "error"

export function IntegrationActions({ provider }: { provider: string }) {
  const router = useRouter()
  const [syncState, setSyncState] = React.useState<SyncState>("idle")
  const [syncMsg, setSyncMsg] = React.useState<string | null>(null)
  const [disconnectState, setDisconnectState] = React.useState<DisconnectState>("idle")

  async function handleSync() {
    setSyncState("syncing")
    setSyncMsg(null)
    try {
      const res = await fetch("/api/connect/resync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setSyncState("error")
        setSyncMsg(json.error ?? "Sync failed")
      } else {
        const r = json.result as Record<string, unknown> | undefined
        const detail = r
          ? Object.entries(r)
              .filter(([, v]) => v !== undefined)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")
          : "Done"
        setSyncState("success")
        setSyncMsg(detail)
        router.refresh()
      }
    } catch (err: any) {
      setSyncState("error")
      setSyncMsg(err.message ?? "Network error")
    }
    setTimeout(() => {
      setSyncState("idle")
      setSyncMsg(null)
    }, 5000)
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${provider.replace(/_/g, " ")}? This will stop all syncs for this integration.`)) return
    setDisconnectState("loading")
    try {
      const res = await fetch("/api/connect/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      })
      const json = await res.json()
      if (!res.ok || json.error) {
        setDisconnectState("error")
        setTimeout(() => setDisconnectState("idle"), 4000)
      } else {
        setDisconnectState("done")
        router.refresh()
      }
    } catch {
      setDisconnectState("error")
      setTimeout(() => setDisconnectState("idle"), 4000)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSync}
          disabled={syncState === "syncing"}
          className="flex items-center gap-1.5 text-xs border rounded-md px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-60"
        >
          {syncState === "syncing" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : syncState === "success" ? (
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          ) : syncState === "error" ? (
            <AlertCircle className="h-3 w-3 text-red-500" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
          {syncState === "syncing" ? "Syncing…" : "Sync now"}
        </button>

        <button
          type="button"
          onClick={handleDisconnect}
          disabled={disconnectState === "loading"}
          className="flex items-center gap-1.5 text-xs text-red-500 border border-red-200 rounded-md px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-60"
        >
          {disconnectState === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Disconnect
        </button>
      </div>

      {syncMsg && (
        <p className={`text-[11px] max-w-[260px] text-right ${syncState === "error" ? "text-red-500" : "text-emerald-600"}`}>
          {syncMsg}
        </p>
      )}

      {disconnectState === "error" && (
        <p className="text-[11px] text-red-500">Disconnect failed — try again</p>
      )}
    </div>
  )
}
