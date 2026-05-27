"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface CoaDeleteButtonProps {
  id: string
  name: string
  hasChildren: boolean
}

export function CoaDeleteButton({ id, name, hasChildren }: CoaDeleteButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (hasChildren) {
      toast.error("Remove sub-accounts first before deleting this account.")
      return
    }
    if (!confirm(`Delete account "${name}"? This cannot be undone.`)) return

    setLoading(true)
    try {
      const res = await fetch(`/api/chart-of-accounts/${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete")
      toast.success("Account deleted")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-destructive hover:text-destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  )
}
