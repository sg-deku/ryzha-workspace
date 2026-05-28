"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Send, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Entry {
  id: string
  status: string
  reversedById: string | null
}

export function JournalEntryActions({ entry }: { entry: Entry }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const post = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/journal-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "post" }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Entry posted to General Ledger")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to post entry")
    } finally {
      setLoading(false)
    }
  }

  const reverse = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/journal-entries/${entry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reverse", reversalDate: new Date().toISOString() }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Reversing entry created")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to reverse entry")
    } finally {
      setLoading(false)
    }
  }

  const deleteEntry = async () => {
    if (!confirm("Delete this draft entry? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/journal-entries/${entry.id}`, { method: "DELETE" })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      toast.success("Draft deleted")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete entry")
    } finally {
      setLoading(false)
    }
  }

  if (entry.status === "REVERSED") {
    return <span className="text-xs text-muted-foreground">Reversed</span>
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={loading}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {entry.status === "DRAFT" && (
          <>
            <DropdownMenuItem onClick={post}>
              <Send className="mr-2 h-4 w-4" /> Post to GL
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={deleteEntry}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Draft
            </DropdownMenuItem>
          </>
        )}
        {entry.status === "POSTED" && !entry.reversedById && (
          <DropdownMenuItem onClick={reverse}>
            <RotateCcw className="mr-2 h-4 w-4" /> Create Reversing Entry
          </DropdownMenuItem>
        )}
        {entry.status === "POSTED" && entry.reversedById && (
          <DropdownMenuItem disabled>
            <RotateCcw className="mr-2 h-4 w-4" /> Already Reversed
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
