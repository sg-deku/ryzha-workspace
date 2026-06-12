"use client"

import * as React from "react"
import { Plus, Trash2, ToggleLeft, ToggleRight, Shield, Loader2, AlertCircle, ChevronDown } from "lucide-react"

interface PolicyRule {
  id: string
  name: string
  description: string | null
  type: string
  conditions: any
  action: string
  approverUserId: string | null
  isActive: boolean
  priority: number
  createdAt: string
}

const POLICY_TYPES = [
  { value: "AMOUNT_THRESHOLD", label: "Amount Threshold" },
  { value: "VENDOR", label: "Vendor" },
  { value: "DEPARTMENT", label: "Department" },
  { value: "CATEGORY", label: "Category" },
  { value: "EXCEPTION", label: "Exception" },
]

const POLICY_ACTIONS = [
  { value: "AUTO_APPROVE", label: "Auto-approve", desc: "Automatically approve without human review" },
  { value: "REQUIRE_APPROVAL", label: "Require approval", desc: "Route to approver before processing" },
  { value: "BLOCK", label: "Block", desc: "Prevent processing - requires manual override" },
  { value: "FLAG_FOR_REVIEW", label: "Flag for review", desc: "Allow but surface in exception queue" },
]

function actionLabel(action: string) {
  return POLICY_ACTIONS.find((a) => a.value === action)?.label ?? action
}

function actionBadge(action: string) {
  const map: Record<string, string> = {
    AUTO_APPROVE: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    REQUIRE_APPROVAL: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
    BLOCK: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
    FLAG_FOR_REVIEW: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  }
  return map[action] ?? "bg-muted text-muted-foreground"
}

const DEFAULT_POLICIES: Omit<PolicyRule, "id" | "createdAt">[] = [
  {
    name: "Auto-approve small expenses",
    description: "Automatically approve all expenses under $500 without human review",
    type: "AMOUNT_THRESHOLD",
    conditions: { amountLt: 500 },
    action: "AUTO_APPROVE",
    approverUserId: null,
    isActive: true,
    priority: 10,
  },
  {
    name: "Require approval for large transactions",
    description: "Any single transaction over $5,000 requires CFO approval",
    type: "AMOUNT_THRESHOLD",
    conditions: { amountGt: 5000 },
    action: "REQUIRE_APPROVAL",
    approverUserId: null,
    isActive: true,
    priority: 20,
  },
  {
    name: "Flag recurring vendors",
    description: "Flag new vendors that haven't been seen before for manual review",
    type: "VENDOR",
    conditions: { firstTimeVendor: true },
    action: "FLAG_FOR_REVIEW",
    approverUserId: null,
    isActive: false,
    priority: 5,
  },
]

function formatConditions(conditions: any): string {
  if (!conditions || Object.keys(conditions).length === 0) return "No conditions"
  const parts: string[] = []
  if (conditions.amountLt != null) parts.push(`Amount < $${conditions.amountLt}`)
  if (conditions.amountGt != null) parts.push(`Amount > $${conditions.amountGt}`)
  if (conditions.department) parts.push(`Department: ${conditions.department}`)
  if (conditions.vendor) parts.push(`Vendor: ${conditions.vendor}`)
  if (conditions.firstTimeVendor) parts.push("First-time vendor")
  if (conditions.category) parts.push(`Category: ${conditions.category}`)
  return parts.join(", ") || JSON.stringify(conditions)
}

function NewPolicyForm({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    name: "",
    description: "",
    type: "AMOUNT_THRESHOLD",
    action: "AUTO_APPROVE",
    amountLt: "",
    amountGt: "",
    department: "",
    vendor: "",
    priority: "0",
  })
  const [saving, setSaving] = React.useState(false)
  const [err, setErr] = React.useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)

    const conditions: any = {}
    if (form.amountLt) conditions.amountLt = parseFloat(form.amountLt)
    if (form.amountGt) conditions.amountGt = parseFloat(form.amountGt)
    if (form.department) conditions.department = form.department
    if (form.vendor) conditions.vendor = form.vendor

    try {
      const res = await fetch("/api/settings/policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          type: form.type,
          action: form.action,
          conditions,
          priority: parseInt(form.priority) || 0,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to create policy")
      setOpen(false)
      setForm({ name: "", description: "", type: "AMOUNT_THRESHOLD", action: "AUTO_APPROVE", amountLt: "", amountGt: "", department: "", vendor: "", priority: "0" })
      onCreated()
    } catch (err: any) {
      setErr(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Plus className="h-4 w-4" />
        New Policy
      </button>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold">New Policy Rule</p>
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Policy Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Auto-approve small expenses"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Priority (higher = evaluated first)</label>
            <input
              type="number"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Optional description of when this policy applies"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Policy Type</label>
            <div className="relative">
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                {POLICY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Action</label>
            <div className="relative">
              <select
                value={form.action}
                onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
              >
                {POLICY_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Conditions</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Amount &lt;</label>
              <input
                type="number"
                value={form.amountLt}
                onChange={(e) => setForm((f) => ({ ...f, amountLt: e.target.value }))}
                placeholder="500"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Amount &gt;</label>
              <input
                type="number"
                value={form.amountGt}
                onChange={(e) => setForm((f) => ({ ...f, amountGt: e.target.value }))}
                placeholder="5000"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                placeholder="engineering"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground block mb-1">Vendor</label>
              <input
                value={form.vendor}
                onChange={(e) => setForm((f) => ({ ...f, vendor: e.target.value }))}
                placeholder="AWS"
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </div>

        {err && (
          <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {err}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-lg border text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Create Policy"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function PoliciesPage() {
  const [policies, setPolicies] = React.useState<PolicyRule[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [seeding, setSeeding] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/settings/policies")
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Failed to load")
      setPolicies(json)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function toggleActive(policy: PolicyRule) {
    await fetch("/api/settings/policies", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: policy.id, isActive: !policy.isActive }),
    })
    setPolicies((prev) => prev.map((p) => p.id === policy.id ? { ...p, isActive: !p.isActive } : p))
  }

  async function deletePolicy(id: string) {
    if (!confirm("Delete this policy?")) return
    await fetch(`/api/settings/policies?id=${id}`, { method: "DELETE" })
    setPolicies((prev) => prev.filter((p) => p.id !== id))
  }

  async function seedDefaults() {
    setSeeding(true)
    try {
      for (const policy of DEFAULT_POLICIES) {
        await fetch("/api/settings/policies", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(policy),
        })
      }
      await load()
    } finally {
      setSeeding(false)
    }
  }

  React.useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Approval Policies
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Rules that govern how the AP Agent routes transactions - auto-approve, require approval, block, or flag.
          </p>
        </div>
        <NewPolicyForm onCreated={load} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && policies.length === 0 && (
        <div className="rounded-xl border bg-card flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/30" />
          <div>
            <p className="font-semibold">No approval policies yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Policies control how the AP Agent handles transactions. Start with the recommended defaults.
            </p>
          </div>
          <button
            onClick={seedDefaults}
            disabled={seeding}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
          >
            {seeding && <Loader2 className="h-4 w-4 animate-spin" />}
            {seeding ? "Adding…" : "Add Recommended Defaults"}
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && policies.length > 0 && (
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="divide-y">
            {policies.map((policy) => (
              <div key={policy.id} className={`flex items-start gap-4 p-4 ${!policy.isActive ? "opacity-50" : ""}`}>
                <div className="pt-0.5">
                  <button
                    onClick={() => toggleActive(policy)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    title={policy.isActive ? "Disable policy" : "Enable policy"}
                  >
                    {policy.isActive
                      ? <ToggleRight className="h-5 w-5 text-primary" />
                      : <ToggleLeft className="h-5 w-5" />
                    }
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{policy.name}</p>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${actionBadge(policy.action)}`}>
                      {actionLabel(policy.action)}
                    </span>
                    <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                      {POLICY_TYPES.find((t) => t.value === policy.type)?.label ?? policy.type}
                    </span>
                    {policy.priority > 0 && (
                      <span className="text-[11px] text-muted-foreground">Priority {policy.priority}</span>
                    )}
                  </div>
                  {policy.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{policy.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {formatConditions(policy.conditions)}
                  </p>
                </div>

                <button
                  onClick={() => deletePolicy(policy.id)}
                  className="text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                  title="Delete policy"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-muted/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">How Policies Work</p>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Policies are evaluated in priority order (highest first) when the AP Agent processes a transaction.</p>
          <p>• <strong className="text-foreground">Auto-approve</strong> - transaction posts directly to QuickBooks without human review.</p>
          <p>• <strong className="text-foreground">Require approval</strong> - transaction is routed to the Approvals queue for a human decision.</p>
          <p>• <strong className="text-foreground">Block</strong> - transaction is held and flagged - requires manual override to proceed.</p>
          <p>• <strong className="text-foreground">Flag for review</strong> - transaction is processed but surfaces in the exception queue.</p>
        </div>
      </div>
    </div>
  )
}
