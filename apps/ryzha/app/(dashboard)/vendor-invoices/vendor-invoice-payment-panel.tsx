"use client"

import { useState } from "react"
import { toast } from "sonner"
import { PlusCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface VendorPayment {
  id: string
  amount: number
  paymentDate: string
  method: string
  referenceNumber?: string
  notes?: string
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
]

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

interface Props {
  invoiceId: string
  invoiceNumber: string
  totalAmount: number
  initialPayments: VendorPayment[]
  status: string
}

export function VendorInvoicePaymentPanel({ invoiceId, invoiceNumber, totalAmount, initialPayments, status }: Props) {
  const [payments, setPayments] = useState(initialPayments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    referenceNumber: "",
    notes: "",
  })

  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const outstanding = Math.max(0, totalAmount - totalPaid)
  const isPaid = status === "PAID" || outstanding <= 0.01

  const handleRecord = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/vendor-invoices/${invoiceId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }),
      })
      if (res.ok) {
        const payment = await res.json()
        setPayments((prev) => [payment, ...prev])
        toast.success("Payment recorded — AP pipeline triggered")
        setDialogOpen(false)
        setForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "bank_transfer", referenceNumber: "", notes: "" })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to record payment")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            Payments Made
          </CardTitle>
          {!isPaid && (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Record
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground">Total</p>
              <p className="font-bold">{fmt(totalAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid</p>
              <p className="font-bold text-green-600">{fmt(totalPaid)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Outstanding</p>
              <p className={`font-bold text-lg ${outstanding > 0 ? "text-destructive" : "text-green-600"}`}>{fmt(outstanding)}</p>
            </div>
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No payments made yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                    <TableCell className="capitalize text-xs">{p.method.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">{fmt(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — {invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Max: ${outstanding.toFixed(2)}`}
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={form.method} onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="Cheque #, wire ref..."
                value={form.referenceNumber}
                onChange={(e) => setForm((f) => ({ ...f, referenceNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecord} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</> : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
