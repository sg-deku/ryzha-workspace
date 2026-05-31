"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Mail, ExternalLink, X, CheckCircle2, Clock, AlertTriangle } from "lucide-react"

interface PortalPanelProps {
  vendorId: string
  vendorEmail: string | null
  portalEnabled: boolean
  portalEmail: string | null
  portalInvitedAt: string | null
  profileChanges: {
    id: string
    status: string
    changes: any
    requestedAt: string
  }[]
}

export function PortalPanel({
  vendorId,
  vendorEmail,
  portalEnabled,
  portalEmail,
  portalInvitedAt,
  profileChanges: initialChanges,
}: PortalPanelProps) {
  const [email, setEmail] = useState(portalEmail || vendorEmail || "")
  const [enabled, setEnabled] = useState(portalEnabled)
  const [invitedAt, setInvitedAt] = useState(portalInvitedAt)
  const [loading, setLoading] = useState(false)
  const [changes, setChanges] = useState(initialChanges)

  const invite = async () => {
    if (!email) { toast.error("Enter an email address"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/vendors/portal-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, email }),
      })
      if (res.ok) {
        const data = await res.json()
        setEnabled(true)
        setInvitedAt(new Date().toISOString())
        toast.success("Portal invite sent")
      } else {
        toast.error("Failed to send invite")
      }
    } finally {
      setLoading(false)
    }
  }

  const revoke = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/vendors/portal-revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      })
      if (res.ok) {
        setEnabled(false)
        setInvitedAt(null)
        toast.success("Portal access revoked")
      } else {
        toast.error("Failed to revoke access")
      }
    } finally {
      setLoading(false)
    }
  }

  const reviewChange = async (id: string, action: "APPROVED" | "REJECTED") => {
    const res = await fetch(`/api/vendors/profile-changes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      setChanges((prev) => prev.filter((c) => c.id !== id))
      toast.success(action === "APPROVED" ? "Changes applied" : "Changes rejected")
    } else {
      toast.error("Failed to process request")
    }
  }

  const pendingChanges = changes.filter((c) => c.status === "PENDING")

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Vendor Portal</CardTitle>
            {enabled ? (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
            ) : (
              <Badge variant="secondary">Not Enabled</Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Give this vendor self-service access to view POs, invoices, and payment history.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {enabled ? (
            <div className="space-y-3">
              <div className="text-xs text-gray-500 flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                Access granted to <span className="font-medium text-gray-700">{portalEmail || email}</span>
              </div>
              {invitedAt && (
                <p className="text-xs text-gray-400">
                  Invited {new Date(invitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={invite} disabled={loading}>
                  <Mail className="h-3.5 w-3.5" />
                  Resend Invite
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive gap-1" onClick={revoke} disabled={loading}>
                  <X className="h-3.5 w-3.5" />
                  Revoke Access
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="vendor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8 text-xs whitespace-nowrap gap-1" onClick={invite} disabled={loading}>
                  <Mail className="h-3.5 w-3.5" />
                  Send Invite
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {pendingChanges.length > 0 && (
        <Card className="border-yellow-200">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <CardTitle className="text-base text-yellow-800">Pending Profile Changes ({pendingChanges.length})</CardTitle>
            </div>
            <CardDescription className="text-xs">
              The vendor has requested changes that require your approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingChanges.map((change) => (
              <div key={change.id} className="border rounded-lg p-3 space-y-2">
                <p className="text-xs text-gray-500">
                  Requested {new Date(change.requestedAt).toLocaleDateString()}
                </p>
                <div className="space-y-1">
                  {Object.entries(change.changes as Record<string, any>).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}:</span>
                      <span className="font-medium">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={() => reviewChange(change.id, "APPROVED")}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs text-destructive hover:text-destructive gap-1" onClick={() => reviewChange(change.id, "REJECTED")}>
                    <X className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
