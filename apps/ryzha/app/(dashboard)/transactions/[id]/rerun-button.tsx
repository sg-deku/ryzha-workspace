"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function TransactionRerunButton({ transactionId }: { transactionId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRerun = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/rerun`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to re-run pipeline")
      }
      toast.success("AI pipeline re-started. Refresh the page in a few seconds to see updated logs.")
      setTimeout(() => router.refresh(), 4000)
    } catch (err: any) {
      toast.error(err.message || "Failed to re-run AI pipeline")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRerun}
      disabled={loading}
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {loading ? "Running..." : "Re-run AI Pipeline"}
    </Button>
  )
}
