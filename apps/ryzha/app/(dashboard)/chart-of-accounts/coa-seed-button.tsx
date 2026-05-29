"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function CoaSeedButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSeed = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/seed-chart-of-accounts", { method: "POST" })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      if (data.added === 0) {
        toast.info("All standard accounts are already present")
      } else {
        toast.success(`${data.added} standard account${data.added !== 1 ? "s" : ""} added`)
      }
      router.refresh()
    } catch {
      toast.error("Failed to seed chart of accounts")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" onClick={handleSeed} disabled={loading}>
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      Seed Standard Accounts
    </Button>
  )
}
