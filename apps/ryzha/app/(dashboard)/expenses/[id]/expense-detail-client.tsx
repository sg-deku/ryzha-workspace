"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, CheckCircle2, AlertTriangle, Pencil, X, Check } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING: "secondary",
  CATEGORIZED: "default",
  REVIEWED: "outline",
  APPROVED: "default",
  PAID: "default",
}

interface Anomaly {
  id: string
  type: string
  description: string
}

interface Expense {
  id: string
  description: string
  amount: number
  date: string
  category: string | null
  status: string
  taxRelevant: boolean | null
  anomalies: Anomaly[]
}

export function ExpenseDetailClient({ expense: initial, categories }: { expense: Expense; categories: string[] }) {
  const router = useRouter()
  const [expense, setExpense] = useState(initial)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [approving, setApproving] = useState(false)

  const [form, setForm] = useState({
    description: expense.description,
    amount: String(expense.amount),
    date: expense.date.slice(0, 10),
    category: expense.category || "",
  })

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch(`/api/expenses/${expense.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || "Request failed")
    }
    return res.json()
  }

  const handleSaveEdit = async () => {
    if (!form.description.trim()) { toast.error("Description is required"); return }
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("Amount must be greater than 0"); return }
    setSaving(true)
    try {
      const updated = await patch({
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        category: form.category || null,
      })
      setExpense((prev) => ({ ...prev, ...updated }))
      setEditing(false)
      toast.success("Expense updated")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date.slice(0, 10),
      category: expense.category || "",
    })
    setEditing(false)
  }

  const handleApprove = async () => {
    setApproving(true)
    try {
      const updated = await patch({ status: "APPROVED" })
      setExpense((prev) => ({ ...prev, status: updated.status }))
      toast.success("Expense approved")
      router.refresh()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    setApproving(true)
    try {
      const updated = await patch({ status: "PENDING" })
      setExpense((prev) => ({ ...prev, status: updated.status }))
      toast.success("Expense sent back to pending")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setApproving(false)
    }
  }

  const canApprove = expense.status === "REVIEWED" || expense.status === "CATEGORIZED"
  const canEdit = expense.status !== "PAID"
  const hasAnomalies = expense.anomalies.length > 0

  return (
    <div className="container mx-auto py-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/expenses"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expense Details</h1>
            <p className="text-muted-foreground text-sm">{expense.id}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
          {canApprove && !editing && (
            <Button size="sm" onClick={handleApprove} disabled={approving}>
              <Check className="h-4 w-4 mr-1" />
              {approving ? "Approving..." : hasAnomalies ? "Approve (Override)" : "Approve"}
            </Button>
          )}
          {expense.status === "REVIEWED" && !editing && (
            <Button variant="destructive" size="sm" onClick={handleReject} disabled={approving}>
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          )}
        </div>
      </div>

      {hasAnomalies && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-destructive/40 bg-destructive/5 text-destructive text-sm">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold mb-1">Anomaly detected — manual approval required</p>
            <ul className="space-y-1 list-disc list-inside">
              {expense.anomalies.map((a) => <li key={a.id}>{a.description}</li>)}
            </ul>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Overview</CardTitle>
            {editing && (
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit} disabled={saving}>
                  Cancel
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Amount ($)</Label>
                  <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category || "uncategorized"} onValueChange={(v) => setForm((f) => ({ ...f, category: v === "uncategorized" ? "" : v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">Uncategorized</SelectItem>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p className="text-lg">{expense.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Amount</p>
                  <p className="text-2xl font-bold">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(expense.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p>{format(new Date(expense.date), "PPP")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge variant={STATUS_VARIANT[expense.status] ?? "secondary"} className="mt-1 capitalize">
                    {expense.status.toLowerCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  {expense.category ? (
                    <Badge variant="outline" className="mt-1">{expense.category}</Badge>
                  ) : (
                    <p className="text-sm italic text-muted-foreground">Uncategorized</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Insights & Anomalies</CardTitle>
            <CardDescription>Detected by the Auditor agent</CardDescription>
          </CardHeader>
          <CardContent>
            {expense.anomalies.length > 0 ? (
              <ul className="space-y-3">
                {expense.anomalies.map((anomaly) => (
                  <li key={anomaly.id} className="p-3 bg-destructive/10 text-destructive rounded-md border border-destructive/20 text-sm">
                    <p className="font-semibold uppercase text-xs mb-1 opacity-70">{anomaly.type.replace(/_/g, " ")}</p>
                    <p>{anomaly.description}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-6 text-muted-foreground text-sm flex flex-col items-center">
                <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
                No anomalies detected for this expense.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
