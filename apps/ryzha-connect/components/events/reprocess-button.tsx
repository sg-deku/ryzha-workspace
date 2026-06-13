"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react"

export function ReprocessButton({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  async function handleReprocess() {
    setState("loading")
    setMessage(null)
    try {
      const res = await fetch(`/api/events/${eventId}/reprocess`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) {
        setState("error")
        setMessage(data.error ?? "Reprocess failed")
        return
      }
      const r = data.result
      if (r?.journalEntriesPosted > 0) {
        setState("success")
        setMessage(`Journal entry posted to ${r.accountingProvider}`)
      } else if (r?.errors?.length > 0) {
        setState("error")
        setMessage(r.errors[0]?.error ?? "Agent ran but encountered errors")
      } else {
        setState("success")
        setMessage("Event reset — check the staging queue")
      }
      router.refresh()
    } catch {
      setState("error")
      setMessage("Network error — please try again")
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleReprocess}
        disabled={state === "loading"}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${state === "loading" ? "animate-spin" : ""}`} />
        {state === "loading" ? "Reprocessing…" : "Reprocess"}
      </button>
      {state === "success" && message && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}
      {state === "error" && message && (
        <div className="flex items-center gap-1.5 text-xs text-red-600">
          <XCircle className="h-3.5 w-3.5 shrink-0" />
          {message}
        </div>
      )}
    </div>
  )
}
