"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus, Trash2, FileSignature, Edit, CalendarDays } from "lucide-react"
import { toast } from "sonner"

interface Contract {
  id: string
  contractNumber: string | null
  customerId: string | null
  customerEmail: string
  amount: number
  status: string
  description: string | null
  terms: string | null
  startDate: string | null
  endDate: string | null
  signedAt: string
}

interface Customer {
  id: string
  name: string
  email: string | null
}

const emptyForm = {
  customerId: "",
  customerEmail: "",
  amount: "",
  description: "",
  terms: "",
  startDate: "",
  endDate: "",
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const fetchContracts = async () => {
    try {
      const res = await fetch("/api/contracts")
      const data = await res.json()
      setContracts(data)
    } catch {
      toast.error("Failed to load contracts")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContracts()
    fetch("/api/customers")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setCustomers(d) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerId) {
      toast.error("Please select an existing customer.")
      return
    }
    setSubmitting(true)
    try {
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch("/api/contracts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editingId && { id: editingId }),
          customerId: form.customerId,
          customerEmail: form.customerEmail,
          amount: form.amount ? parseFloat(form.amount) : 0,
          description: form.description || null,
          terms: form.terms || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(editingId ? "Contract updated" : "Contract created successfully")
      setOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      fetchContracts()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (c: Contract) => {
    setEditingId(c.id)
    setForm({
      customerId: c.customerId ?? "",
      customerEmail: c.customerEmail,
      amount: c.amount.toString(),
      description: c.description ?? "",
      terms: c.terms ?? "",
      startDate: c.startDate ? c.startDate.slice(0, 10) : "",
      endDate: c.endDate ? c.endDate.slice(0, 10) : "",
    })
    setOpen(true)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      setEditingId(null)
      setForm(emptyForm)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this contract?")) return
    try {
      const res = await fetch("/api/contracts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Contract deleted")
      fetchContracts()
    } catch {
      toast.error("Failed to delete contract")
    }
  }

  const isActive = (c: Contract) => {
    const now = new Date()
    const start = c.startDate ? new Date(c.startDate) : null
    const end = c.endDate ? new Date(c.endDate) : null
    if (c.status !== "signed") return false
    if (start && start > now) return false
    if (end && end < now) return false
    return true
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contracts</h1>
          <p className="text-muted-foreground">
            Master Service Agreements and subscription contracts. Active signed contracts authorize payments for customers without individual invoices.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Contract" : "Create Contract"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Customer <span className="text-destructive">*</span></Label>
                <Select
                  value={form.customerId}
                  onValueChange={(val) => {
                    const c = customers.find(c => c.id === val)
                    setForm(f => ({ ...f, customerId: val, customerEmail: c?.email ?? "" }))
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an existing customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {customers.length === 0 && (
                  <p className="text-xs text-destructive">No customers found. Create a customer first.</p>
                )}
                <p className="text-xs text-muted-foreground">
                  The Auditor Agent matches incoming payments to the customer email. Used as the MSA fallback when no invoice exists.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Contract Value ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Annual SaaS subscription — Acme Corp"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-1">Leave dates blank for open-ended MSAs that cover payments indefinitely.</p>
              <div className="space-y-2">
                <Label htmlFor="terms">Terms &amp; Conditions</Label>
                <Textarea
                  id="terms"
                  placeholder="NET 30, auto-renewal, SLA commitments..."
                  value={form.terms}
                  onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                {editingId ? "Save Changes" : "Create Contract"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Contracts</CardTitle>
          <CardDescription>
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSignature className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium mb-1">No contracts yet</p>
              <p className="text-sm">Create a contract to authorize payments from customers who pay without individual invoices (MSA / subscription model).</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{c.contractNumber ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{c.description || c.customerEmail}</div>
                      <div className="text-xs text-muted-foreground">{c.customerEmail}</div>
                    </TableCell>
                    <TableCell className="font-medium">{c.amount > 0 ? `$${c.amount.toLocaleString()}` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {(c.startDate || c.endDate) ? (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {c.startDate ? new Date(c.startDate).toLocaleDateString() : "—"}
                          {" → "}
                          {c.endDate ? new Date(c.endDate).toLocaleDateString() : "open"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/60">Open-ended</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive(c) ? "default" : "secondary"}>
                        {isActive(c) ? "active" : c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(c.signedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(c)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(c.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
