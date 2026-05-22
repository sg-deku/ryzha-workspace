"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface PlanActionsProps {
  planId: string
  inUse: boolean
}

export function PlanActions({ planId, inUse }: PlanActionsProps) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm("Delete this plan?")) return
    const res = await fetch(`/api/licenses/${planId}`, { method: "DELETE" })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? "Failed to delete plan.")
      return
    }
    router.refresh()
  }

  return (
    <Button
      size="sm"
      variant="destructive"
      onClick={handleDelete}
      disabled={inUse}
      title={inUse ? "Cannot delete a plan in use" : undefined}
    >
      Delete
    </Button>
  )
}
