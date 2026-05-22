"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Plan {
  id: string
  name: string
}

interface License {
  planId: string
  maxUsers: number
  maxApiCalls: number
  maxAiTokens: number
  status: string
  endsAt: string | null
}

interface LicenseEditorProps {
  orgId: string
  license: License | null
  plans: Plan[]
}

export function LicenseEditor({ orgId, license, plans }: LicenseEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [planId, setPlanId] = useState(license?.planId ?? "")
  const [maxUsers, setMaxUsers] = useState(license?.maxUsers ?? 5)
  const [maxApiCalls, setMaxApiCalls] = useState(license?.maxApiCalls ?? 10000)
  const [maxAiTokens, setMaxAiTokens] = useState(license?.maxAiTokens ?? 50000)
  const [status, setStatus] = useState(license?.status ?? "ACTIVE")

  async function handleSave() {
    if (!planId) return
    setSaving(true)
    await fetch(`/api/tenants/${orgId}/license`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, maxUsers, maxApiCalls, maxAiTokens, status }),
    })
    setSaving(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">License & Limits</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Subscription Plan</Label>
            <Select value={planId} onValueChange={setPlanId}>
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

          <div className="space-y-2">
            <Label>License Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Max Users</Label>
            <Input
              type="number"
              value={maxUsers}
              onChange={(e) => setMaxUsers(Number(e.target.value))}
              min={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Max API Calls / month</Label>
            <Input
              type="number"
              value={maxApiCalls}
              onChange={(e) => setMaxApiCalls(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label>Max AI Tokens / month</Label>
            <Input
              type="number"
              value={maxAiTokens}
              onChange={(e) => setMaxAiTokens(Number(e.target.value))}
              min={0}
            />
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving || !planId}>
          {saving ? "Saving…" : "Save License"}
        </Button>
      </CardContent>
    </Card>
  )
}
