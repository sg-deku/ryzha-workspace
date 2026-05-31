"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Loader2, Plus, Play, CheckCircle, Download, Trash2, RefreshCw,
  Layers, AlertTriangle, X, ChevronRight, Building2,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  APPROVED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  PROCESSING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  COMPLETED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PARTIALLY_FAILED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  PAID: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  PENDING: "bg-gray-100 text-gray-600",
  FAILED: "bg-red-100 text-red-700",
}

const FORMAT_COLORS: Record<string, string> = {
  SEPA: "bg-purple-100 text-purple-700",
  ACH: "bg-blue-100 text-blue-700",
  BACS: "bg-teal-100 text-teal-700",
  MANUAL: "bg-gray-100 text-gray-600",
}

function formatMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n)
}

export default function PaymentRunsClient() {
  const [runs, setRuns] = useState<any[]>([])
  const [selectedRun, setSelectedRun] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [runLoading, setRunLoading] = useState(false)
  const [newDialog, setNewDialog] = useState(false)
  const [addInvoicesDialog, setAddInvoicesDialog] = useState(false)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [openInvoices, setOpenInvoices] = useState<any[]>([])
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set())
  const [invoicesLoading, setInvoicesLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [approving, setApproving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    currency: "USD",
    format: "MANUAL",
    bankAccountId: "",
    notes: "",
  })

  const fetchRuns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/payment-runs")
      if (res.ok) setRuns(await res.json())
    } catch { toast.error("Failed to load payment runs") }
    finally { setLoading(false) }
  }, [])

  const fetchRunDetail = useCallback(async (id: string) => {
    setRunLoading(true)
    try {
      const res = await fetch(`/api/payment-runs/${id}`)
      if (res.ok) setSelectedRun(await res.json())
    } catch { }
    finally { setRunLoading(false) }
  }, [])

  const fetchBankAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/bank-feeds/accounts")
      if (res.ok) setBankAccounts(await res.json())
    } catch { }
  }, [])

  const fetchOpenInvoices = useCallback(async () => {
    setInvoicesLoading(true)
    try {
      const res = await fetch("/api/vendor-invoices?status=APPROVED,RECEIVED,MATCHED")
      if (res.ok) {
        const all = await res.json()
        setOpenInvoices(all.filter((i: any) => !["PAID"].includes(i.status)))
      }
    } catch { }
    finally { setInvoicesLoading(false) }
  }, [])

  useEffect(() => { fetchRuns(); fetchBankAccounts() }, [fetchRuns, fetchBankAccounts])

  const handleCreate = async () => {
    if (!form.name || !form.paymentDate) { toast.error("Name and payment date required"); return }
    try {
      const res = await fetch("/api/payment-runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, bankAccountId: form.bankAccountId || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Payment run ${data.runNumber} created`)
      setNewDialog(false)
      setForm({ name: "", paymentDate: new Date().toISOString().slice(0, 10), currency: "USD", format: "MANUAL", bankAccountId: "", notes: "" })
      await fetchRuns()
      fetchRunDetail(data.id)
    } catch (err: any) { toast.error(err.message) }
  }

  const handleAddInvoices = async () => {
    if (!selectedRun || selectedInvoiceIds.size === 0) return
    try {
      const res = await fetch(`/api/payment-runs/${selectedRun.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceIds: [...selectedInvoiceIds] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Added ${data.created} invoice(s)${data.skipped.length > 0 ? `, skipped ${data.skipped.length}` : ""}`)
      setAddInvoicesDialog(false)
      setSelectedInvoiceIds(new Set())
      fetchRunDetail(selectedRun.id)
      fetchRuns()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleRemoveItem = async (itemId: string) => {
    if (!selectedRun) return
    try {
      const res = await fetch(`/api/payment-runs/${selectedRun.id}/items/${itemId}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Item removed")
      fetchRunDetail(selectedRun.id)
      fetchRuns()
    } catch (err: any) { toast.error(err.message) }
  }

  const handleApprove = async () => {
    if (!selectedRun) return
    setApproving(true)
    try {
      const res = await fetch(`/api/payment-runs/${selectedRun.id}/approve`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success("Payment run approved")
      fetchRunDetail(selectedRun.id)
      fetchRuns()
    } catch (err: any) { toast.error(err.message) }
    finally { setApproving(false) }
  }

  const handleExecute = async () => {
    if (!selectedRun) return
    setExecuting(true)
    try {
      const res = await fetch(`/api/payment-runs/${selectedRun.id}/execute`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Executed: ${data.succeeded} paid, ${data.failed} failed`)
      fetchRunDetail(selectedRun.id)
      fetchRuns()
    } catch (err: any) { toast.error(err.message) }
    finally { setExecuting(false) }
  }

  const handleExport = async () => {
    if (!selectedRun) return
    try {
      const res = await fetch(`/api/payment-runs/${selectedRun.id}/export`)
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      const blob = await res.blob()
      const cd = res.headers.get("Content-Disposition") ?? ""
      const fnMatch = cd.match(/filename="([^"]+)"/)
      const filename = fnMatch?.[1] ?? `${selectedRun.runNumber}.txt`
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${filename}`)
    } catch (err: any) { toast.error(err.message) }
  }

  const handleDeleteRun = async () => {
    if (!selectedRun) return
    try {
      const res = await fetch(`/api/payment-runs/${selectedRun.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success("Payment run deleted")
      setSelectedRun(null)
      fetchRuns()
    } catch (err: any) { toast.error(err.message) }
  }

  const toggleInvoice = (id: string) => {
    setSelectedInvoiceIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT — Run List */}
      <div className="w-80 flex-shrink-0 border-r flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="font-semibold text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" /> Payment Runs
          </h1>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={fetchRuns} disabled={loading}>
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
            <Button size="sm" onClick={() => setNewDialog(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> New
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : runs.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8 px-4">No payment runs yet. Create one to batch AP payments.</p>
          ) : runs.map((run) => (
            <button
              key={run.id}
              className={cn(
                "w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors",
                selectedRun?.id === run.id && "bg-muted"
              )}
              onClick={() => fetchRunDetail(run.id)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono font-medium">{run.runNumber}</span>
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium", STATUS_COLORS[run.status] ?? "bg-gray-100 text-gray-700")}>
                  {run.status.replace("_", " ")}
                </span>
              </div>
              <p className="text-sm font-medium truncate">{run.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("text-[10px] px-1 py-0.5 rounded", FORMAT_COLORS[run.format] ?? "bg-gray-100 text-gray-600")}>
                  {run.format}
                </span>
                <span className="text-xs text-muted-foreground">
                  {run.currency} · {formatMoney(run.totalAmount)}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {run.items?.length ?? 0} inv
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT — Run Detail */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedRun ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Layers className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a payment run or create a new one</p>
            </div>
          </div>
        ) : runLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-muted-foreground">{selectedRun.runNumber}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded font-medium", STATUS_COLORS[selectedRun.status])}>
                    {selectedRun.status.replace("_", " ")}
                  </span>
                  <span className={cn("text-xs px-2 py-0.5 rounded font-medium", FORMAT_COLORS[selectedRun.format])}>
                    {selectedRun.format}
                  </span>
                </div>
                <h2 className="text-lg font-semibold">{selectedRun.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Payment date: {format(new Date(selectedRun.paymentDate), "MMM d, yyyy")}
                  {selectedRun.bankAccount && ` · Bank: ${selectedRun.bankAccount.name}`}
                </p>
                {selectedRun.approvedBy && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Approved by {selectedRun.approvedBy} on {format(new Date(selectedRun.approvedAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {selectedRun.status === "DRAFT" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { fetchOpenInvoices(); setAddInvoicesDialog(true) }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Invoices
                    </Button>
                    <Button size="sm" onClick={handleApprove} disabled={approving}>
                      {approving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <CheckCircle className="h-3.5 w-3.5 mr-1" />}
                      Approve
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleDeleteRun}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </>
                )}
                {selectedRun.status === "APPROVED" && (
                  <Button size="sm" onClick={handleExecute} disabled={executing}>
                    {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                    Execute Run
                  </Button>
                )}
                {["COMPLETED", "PARTIALLY_FAILED"].includes(selectedRun.status) && selectedRun.format !== "MANUAL" && (
                  <Button variant="outline" size="sm" onClick={handleExport}>
                    <Download className="h-3.5 w-3.5 mr-1" /> Download {selectedRun.format} File
                  </Button>
                )}
              </div>
            </div>

            {/* Summary row */}
            <div className="px-6 py-3 border-b bg-muted/30 flex items-center gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold ml-2">{formatMoney(selectedRun.totalAmount)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Invoices</span>
                <span className="font-semibold ml-2">{selectedRun.items?.length ?? 0}</span>
              </div>
              {selectedRun.executedAt && (
                <div>
                  <span className="text-muted-foreground">Executed</span>
                  <span className="ml-2">{format(new Date(selectedRun.executedAt), "MMM d, yyyy HH:mm")}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="flex-1 overflow-auto">
              {selectedRun.items?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Building2 className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm">No invoices added yet</p>
                  {selectedRun.status === "DRAFT" && (
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => { fetchOpenInvoices(); setAddInvoicesDialog(true) }}>
                      <Plus className="h-3.5 w-3.5 mr-1" /> Add Invoices
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Banking</TableHead>
                      <TableHead>Status</TableHead>
                      {selectedRun.status === "DRAFT" && <TableHead />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRun.items.map((item: any) => {
                      const hasBankDetails = item.vendor?.bankIban || item.vendor?.bankRoutingNumber || item.vendor?.bankSortCode
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.vendor?.name}</TableCell>
                          <TableCell className="font-mono text-sm">{item.vendorInvoice?.invoiceNumber}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {item.vendorInvoice?.dueDate ? format(new Date(item.vendorInvoice.dueDate), "MMM d, yyyy") : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono">{formatMoney(item.amount)}</TableCell>
                          <TableCell>
                            {hasBankDetails ? (
                              <span className="text-xs text-green-600 dark:text-green-400">✓ Set</span>
                            ) : (
                              <span className="text-xs text-orange-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Missing
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={cn("text-xs px-1.5 py-0.5 rounded font-medium", STATUS_COLORS[item.status] ?? "")}>
                              {item.status}
                            </span>
                            {item.failureReason && (
                              <p className="text-xs text-red-500 mt-0.5">{item.failureReason}</p>
                            )}
                          </TableCell>
                          {selectedRun.status === "DRAFT" && (
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                <X className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Run Dialog */}
      <Dialog open={newDialog} onOpenChange={setNewDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Payment Run</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. June 2026 AP Run" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Payment Date</label>
                <Input type="date" value={form.paymentDate} onChange={(e) => setForm({ ...form, paymentDate: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Currency</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  {["USD", "EUR", "GBP", "CHF", "CAD", "AUD", "SGD"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Format</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })}>
                  <option value="MANUAL">Manual</option>
                  <option value="SEPA">SEPA (EUR · EU/EEA)</option>
                  <option value="ACH">ACH / NACHA (USD · US)</option>
                  <option value="BACS">BACS Standard 18 (GBP · UK)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Debit Bank Account</label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}>
                  <option value="">— Select —</option>
                  {bankAccounts.map((b: any) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Notes</label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.name}>Create Run</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Invoices Dialog */}
      <Dialog open={addInvoicesDialog} onOpenChange={setAddInvoicesDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Invoices to {selectedRun?.runNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {invoicesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : openInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No open vendor invoices available</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead>Vendor</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openInvoices.map((inv: any) => {
                    const totalPaid = (inv.vendorPayments ?? []).reduce((s: number, p: any) => s + p.amount, 0)
                    const outstanding = inv.amount - totalPaid
                    return (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleInvoice(inv.id)}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedInvoiceIds.has(inv.id)}
                            onChange={() => toggleInvoice(inv.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{inv.vendor?.name ?? inv.vendorId}</TableCell>
                        <TableCell className="font-mono text-sm">{inv.invoiceNumber}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {inv.dueDate ? format(new Date(inv.dueDate), "MMM d") : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{formatMoney(outstanding)}</TableCell>
                        <TableCell>
                          <span className={cn("text-xs px-1.5 py-0.5 rounded", STATUS_COLORS[inv.status] ?? "")}>
                            {inv.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <span className="text-sm text-muted-foreground mr-auto">{selectedInvoiceIds.size} selected</span>
            <Button variant="outline" onClick={() => { setAddInvoicesDialog(false); setSelectedInvoiceIds(new Set()) }}>Cancel</Button>
            <Button onClick={handleAddInvoices} disabled={selectedInvoiceIds.size === 0}>
              Add {selectedInvoiceIds.size > 0 ? selectedInvoiceIds.size : ""} Invoice{selectedInvoiceIds.size !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
