"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AICategorizeButtonProps {
  expenseId: string
}

export function AICategorizeButton({ expenseId }: AICategorizeButtonProps) {
  const [isCategorizing, setIsCategorizing] = useState(false)
  const router = useRouter()

  const handleCategorize = async () => {
    setIsCategorizing(true)
    try {
      const res = await fetch("/api/expenses/ai-categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expenseId })
      })

      if (res.ok) {
        toast.success("Categorized successfully")
        router.refresh()
      } else {
        const error = await res.json()
        toast.error(`Failed to categorize: ${error.error}`)
      }
    } catch (err) {
      toast.error("An error occurred while categorizing")
    } finally {
      setIsCategorizing(false)
    }
  }

  return (
    <button
      onClick={handleCategorize}
      disabled={isCategorizing}
      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50 transition-colors"
    >
      {isCategorizing ? "AI..." : "AI Categorize"}
    </button>
  )
}
