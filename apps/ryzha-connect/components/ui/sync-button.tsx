"use client"

import * as React from "react"
import { RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function SyncButton() {
  const [syncing, setSyncing] = React.useState(false)
  const router = useRouter()

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch("/api/cron/sync")
      if (res.ok) {
        toast.success("Sync complete - data refreshed from all connected platforms")
        router.refresh()
      } else {
        const json = await res.json().catch(() => ({}))
        toast.error(json.error ?? "Sync failed")
      }
    } catch {
      toast.error("Network error - sync could not be triggered")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="flex items-center gap-2 text-sm border rounded-lg px-4 py-2 hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      {syncing ? "Syncing..." : "Sync now"}
    </button>
  )
}
