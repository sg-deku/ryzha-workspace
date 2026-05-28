"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Vendor {
  id: string
  name: string
}

interface Props {
  vendors: Vendor[]
  defaultVendorId: string
  defaultVendorInvoiceId: string
}

export function NewDebitMemoForm({ vendors, defaultVendorId, defaultVendorInvoiceId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [vendorId, setVendorId] = useState(defaultVendorId)
  const [vendorInvoices, setVendorInvoices] = useState<{ id: string; invoiceNumber: string; amount: number }[]>([])
  const [vendorInvoiceId, setVendorInvoiceId] = useState(defaultVendorInvoiceId)
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [reasonCategory, setReasonCategory] = useState("other")
  const [debitType, setDebitType] = useState("vendor_credit")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")

  const fetchVendorInvoices = async (vid: string) => {
    if (!vid) { setVendorInvoices([]); return }
    try {
      const res = await fetch(`/api/vendor-invoices?vendorId=${vid}`)
      if (res.ok) {
        const data = await res.json()
        setVendorInvoices(data)
      }
    } catch { }
  }

  const handleVendorChange = (val: string) => {
    setVendorId(val)
    setVendorInvoiceId("")
    fetchVendorInvoices(val)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!vendorId) { toast.error("Please select a vendor"); return }
    if (!amount || parseFloat(amount) <= 0) { toast.error("Amount must be greater than 0"); return }
    if (!reason.trim()) { toast.error("Reason is required"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/vendor-debit-memos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          vendorInvoiceId: vendorInvoiceId || null,
          amount: parseFloat(amount),
          reason,
          reasonCategory,
          debitType,
          issueDate,
          referenceNumber: referenceNumber || null,
          notes: notes || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create debit memo")
      }

      toast.success("Vendor debit memo created and GL entries posted")
      router.push("/vendor-debit-memos")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor-debit-memos"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Vendor Debit Memo</h2>
          <p className="text-sm text-muted-foreground">Claim a credit or cash refund from a vendor</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debit Memo Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Vendor *</Label>
                <Select value={vendorId} onValueChange={handleVendorChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {vendorInvoices.length > 0 && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Linked Vendor Invoice (optional)</Label>
                  <Select value={vendorInvoiceId} onValueChange={setVendorInvoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select invoice (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {vendorInvoices.map((inv) => (
                        <SelectItem key={inv.id} value={inv.id}>
                          {inv.invoiceNumber} — ${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Debit Type *</Label>
                <Select value={debitType} onValueChange={setDebitType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vendor_credit">Vendor Credit — Reduce AP</SelectItem>
                    <SelectItem value="cash_refund">Cash Refund — Vendor Sends Money Back</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {debitType === "cash_refund"
                    ? "GL: DR Cash / CR Operating Expenses"
                    : "GL: DR Accounts Payable / CR Operating Expenses"}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Reason Category *</Label>
                <Select value={reasonCategory} onValueChange={setReasonCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overcharge">Overcharge</SelectItem>
                    <SelectItem value="defective_goods">Defective Goods</SelectItem>
                    <SelectItem value="service_not_rendered">Service Not Rendered</SelectItem>
                    <SelectItem value="duplicate_payment">Duplicate Payment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Issue Date *</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Reason / Description *</Label>
                <Input
                  placeholder="e.g. Vendor overcharged on Invoice INV-0042"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  placeholder="e.g. CN-2024-001"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Additional notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/vendor-debit-memos">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Debit Memo"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
