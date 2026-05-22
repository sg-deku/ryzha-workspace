"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Building2 } from "lucide-react"
import { toast } from "sonner"

export function OrganizationSwitcher() {
  const { data: session, update } = useSession()
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOrgs() {
      try {
        const res = await fetch("/api/user/organizations")
        if (res.ok) {
          const data = await res.json()
          setOrganizations(data)
        }
      } catch (e) {
        console.error("Failed to fetch organizations")
      } finally {
        setLoading(false)
      }
    }
    fetchOrgs()
  }, [])

  const handleSwitch = async (orgId: string) => {
    try {
      // With NextAuth JWT, we can just update the session trigger
      await update({
        organizationId: orgId
      })
      toast.success("Switched organization")
      window.location.reload() // Reload to refresh all data context
    } catch (e) {
      toast.error("Failed to switch organization")
    }
  }

  if (loading || organizations.length <= 1) return null

  return (
    <div className="flex items-center gap-2">
      <Select 
        value={session?.user?.organizationId} 
        onValueChange={handleSwitch}
      >
        <SelectTrigger className="w-[200px] border-none bg-primary/5 hover:bg-primary/10 transition-colors">
          <Building2 className="mr-2 h-4 w-4 text-primary" />
          <SelectValue placeholder="Select Organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
