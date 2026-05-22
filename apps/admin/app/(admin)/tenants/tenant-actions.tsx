"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface TenantActionsProps {
  orgId: string
  currentStatus: string
}

export function TenantActions({ orgId, currentStatus }: TenantActionsProps) {
  const router = useRouter()

  async function updateStatus(status: string) {
    await fetch(`/api/tenants/${orgId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    router.refresh()
  }

  async function deleteTenant() {
    if (!confirm("Delete this organization? This action cannot be undone.")) return
    await fetch(`/api/tenants/${orgId}`, { method: "DELETE" })
    router.refresh()
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {currentStatus !== "SUSPENDED" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("SUSPENDED")}>
          Suspend
        </Button>
      )}
      {currentStatus === "SUSPENDED" && (
        <Button size="sm" variant="outline" onClick={() => updateStatus("ACTIVE")}>
          Unsuspend
        </Button>
      )}
      <Button size="sm" variant="destructive" onClick={deleteTenant}>
        Delete
      </Button>
    </div>
  )
}
