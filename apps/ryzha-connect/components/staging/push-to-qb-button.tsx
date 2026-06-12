"use client"

import * as React from "react"
import { Upload, Loader2, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export function PushToQBButton({ eventId }: { eventId: string }) {
  const [state, setState] = React.useState<"idle" | "loading" | "done">("idle")

  async function push() {
    setState("loading")
    try {
      const res = await fetch("/api/connect/quickbooks/push-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventIds: [eventId] }),
      })
      const json = await res.json()
      if (res.ok && json.pushed > 0) {
        setState("done")
        toast.success("Posted to QuickBooks")
      } else {
        setState("idle")
        toast.error(json.error ?? json.results?.[0]?.error ?? "Push failed")
      }
    } catch {
      setState("idle")
      toast.error("Network error - push failed")
    }
  }

  if (state === "done") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Posted
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={push}
      disabled={state === "loading"}
      className="flex items-center gap-1 text-xs text-primary border border-primary/30 rounded px-2 py-0.5 hover:bg-primary/5 transition-colors disabled:opacity-50 whitespace-nowrap"
    >
      {state === "loading" ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Upload className="h-3 w-3" />
      )}
      {state === "loading" ? "Pushing..." : "Push to QB"}
    </button>
  )
}
