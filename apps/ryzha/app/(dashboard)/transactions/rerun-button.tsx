"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function TransactionListRerunButton({ transactionId }: { transactionId: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRerun = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const res = await fetch(`/api/transactions/${transactionId}/rerun`, { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to re-run pipeline")
      }
      toast.success("Pipeline re-started. Results will update shortly.")
      setTimeout(() => router.refresh(), 4000)
    } catch (err: any) {
      toast.error(err.message || "Failed to re-run pipeline")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleRerun}
      disabled={loading}
      title="Re-run pipeline"
      className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <RefreshCw className="h-3.5 w-3.5" />
      }
    </button>
  )
}
