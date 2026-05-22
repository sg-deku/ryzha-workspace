"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PlanFeatures {
  maxUsers?: number
  maxApiCalls?: number
  aiTokens?: number
}

interface Plan {
  id: string
  name: string
  features: unknown
  interval: string
}

interface ApprovalActionsProps {
  organizationId: string
  plans: Plan[]
}

export function ApprovalActions({ organizationId, plans }: ApprovalActionsProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const firstPlan = plans[0]
  const [selectedPlanId, setSelectedPlanId] = useState(firstPlan?.id ?? "")
  const [maxUsers, setMaxUsers] = useState(String((firstPlan?.features as PlanFeatures)?.maxUsers ?? 5))
  const [maxApiCalls, setMaxApiCalls] = useState(String((firstPlan?.features as PlanFeatures)?.maxApiCalls ?? 10000))
  const [maxAiTokens, setMaxAiTokens] = useState(String((firstPlan?.features as PlanFeatures)?.aiTokens ?? 50000))
  const [adminNotes, setAdminNotes] = useState("")
  const [billingContact, setBillingContact] = useState("")

  function handlePlanChange(planId: string) {
    setSelectedPlanId(planId)
    const plan = plans.find((p) => p.id === planId)
    if (plan) {
      const features = plan.features as PlanFeatures
      setMaxUsers(String(features?.maxUsers ?? 5))
      setMaxApiCalls(String(features?.maxApiCalls ?? 10000))
      setMaxAiTokens(String(features?.aiTokens ?? 50000))
    }
  }

  const selectedPlan = plans.find((p) => p.id === selectedPlanId)

  async function handleApprove() {
    setLoading(true)
    await fetch("/api/pending-approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        organizationId,
        action: "approve",
        defaultPlanId: selectedPlanId,
        maxUsers: parseInt(maxUsers) || undefined,
        maxApiCalls: parseInt(maxApiCalls) || undefined,
        maxAiTokens: parseInt(maxAiTokens) || undefined,
        adminNotes: adminNotes || undefined,
        billingContact: billingContact || undefined,
      }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function handleReject() {
    setLoading(true)
    await fetch("/api/pending-approvals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId, action: "reject" }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default">
            Approve
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Configure Licence</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-2">
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Plan &amp; Limits</p>
              {plans.length > 0 && (
                <div className="space-y-2">
                  <Label>Plan</Label>
                  <Select value={selectedPlanId} onValueChange={handlePlanChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Users</Label>
                  <Input
                    type="number"
                    value={maxUsers}
                    onChange={(e) => setMaxUsers(e.target.value)}
                    min={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max API Calls / mo</Label>
                  <Input
                    type="number"
                    value={maxApiCalls}
                    onChange={(e) => setMaxApiCalls(e.target.value)}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max AI Tokens / mo</Label>
                  <Input
                    type="number"
                    value={maxAiTokens}
                    onChange={(e) => setMaxAiTokens(e.target.value)}
                    min={0}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Organisation Notes</p>
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                  placeholder="Internal notes about this organisation (not visible to org users)"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Billing</p>
              <div className="space-y-2">
                <Label>Billing Contact</Label>
                <Input
                  value={billingContact}
                  onChange={(e) => setBillingContact(e.target.value)}
                  placeholder="name@company.com"
                />
              </div>
              {selectedPlan && (
                <p className="text-sm text-muted-foreground">
                  Billing Cycle: <span className="font-medium capitalize">{selectedPlan.interval}ly</span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={loading}>
              {loading ? "Approving…" : "Approve Organisation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button
        size="sm"
        variant="destructive"
        onClick={handleReject}
        disabled={loading}
      >
        Reject
      </Button>
    </div>
  )
}
