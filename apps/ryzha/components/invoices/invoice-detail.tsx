"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { toast } from "sonner"
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Mail, 
  Printer, 
  MoreVertical,
  ChevronRight,
  Calendar,
  User,
  CreditCard,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PDFPreviewModal } from "./pdf-preview-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
}

interface Payment {
  id: string
  amount: number
  paymentDate: string
  method: string
  referenceNumber?: string
  notes?: string
}

interface CreditNote {
  id: string
  amount: number
  issueDate: string
  reason: string
  reasonCategory: string
  refundMethod?: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  clientName: string
  clientEmail: string
  issueDate: string
  dueDate: string
  total: number
  subtotal: number
  totalTax: number
  status: string
  pdfUrl?: string
  lineItems: LineItem[]
  payments: Payment[]
  creditNotes: CreditNote[]
}

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire Transfer" },
  { value: "cheque", label: "Cheque" },
  { value: "credit_card", label: "Credit Card" },
  { value: "stripe", label: "Stripe" },
  { value: "other", label: "Other" },
]

const CREDIT_NOTE_REASONS = [
  { value: "pricing_error", label: "Pricing Error" },
  { value: "return", label: "Product / Service Return" },
  { value: "goodwill", label: "Goodwill Adjustment" },
  { value: "dispute_settlement", label: "Dispute Settlement" },
  { value: "duplicate_charge", label: "Duplicate Charge" },
  { value: "other", label: "Other" },
]

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)
}

function statusBadgeVariant(status: string) {
  if (status === "PAID") return "success"
  if (status === "SENT" || status === "PARTIAL") return "default"
  if (status === "OVERDUE") return "destructive"
  return "secondary"
}

export function InvoiceDetail({ invoice: initialInvoice }: { invoice: Invoice }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState(initialInvoice)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [creditNoteDialogOpen, setCreditNoteDialogOpen] = useState(false)
  const [submittingPayment, setSubmittingPayment] = useState(false)
  const [submittingCreditNote, setSubmittingCreditNote] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    method: "bank_transfer",
    referenceNumber: "",
    notes: "",
  })

  const [creditNoteForm, setCreditNoteForm] = useState({
    amount: "",
    reason: "",
    reasonCategory: "other",
    issueDate: new Date().toISOString().slice(0, 10),
    refundMethod: "",
    notes: "",
  })

  const totalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0)
  const totalCredits = invoice.creditNotes.reduce((s, c) => s + c.amount, 0)
  const outstanding = Math.max(0, invoice.total - totalPaid + totalCredits)

  const [generatingStripeLink, setGeneratingStripeLink] = useState(false)

  const handleGenerateStripeLink = async () => {
    setGeneratingStripeLink(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/stripe-link`, { method: "POST" })
      if (res.ok) {
        const { url } = await res.json()
        await navigator.clipboard.writeText(url)
        toast.success("Payment link copied to clipboard!")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to generate link")
      }
    } catch {
      toast.error("Failed to generate Stripe link")
    } finally {
      setGeneratingStripeLink(false)
    }
  }

  const handleMarkAsPaid = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      })
      if (res.ok) {
        const updated = await res.json()
        setInvoice((prev) => ({ ...prev, status: updated.status }))
        toast.success("Invoice marked as paid")
        const hasConfetti = localStorage.getItem("has_confetti_invoice_paid")
        if (!hasConfetti) {
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#2563eb", "#3b82f6", "#60a5fa", "#93c5fd"] })
          localStorage.setItem("has_confetti_invoice_paid", "true")
        }
      } else {
        toast.error("Failed to update invoice status")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    setSubmittingPayment(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...paymentForm, amount: parseFloat(paymentForm.amount) }),
      })
      if (res.ok) {
        const payment = await res.json()
        setInvoice((prev) => ({ ...prev, payments: [payment, ...prev.payments] }))
        const newTotalPaid = invoice.payments.reduce((s, p) => s + p.amount, 0) + payment.amount
        if (newTotalPaid >= invoice.total) {
          setInvoice((prev) => ({ ...prev, status: "PAID" }))
        } else {
          setInvoice((prev) => ({ ...prev, status: "PARTIAL" }))
        }
        toast.success("Payment recorded — AI pipeline triggered")
        setPaymentDialogOpen(false)
        setPaymentForm({ amount: "", paymentDate: new Date().toISOString().slice(0, 10), method: "bank_transfer", referenceNumber: "", notes: "" })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to record payment")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setSubmittingPayment(false)
    }
  }

  const handleIssueCreditNote = async () => {
    if (!creditNoteForm.amount || parseFloat(creditNoteForm.amount) <= 0) {
      toast.error("Enter a valid amount")
      return
    }
    if (!creditNoteForm.reason) {
      toast.error("Reason is required")
      return
    }
    setSubmittingCreditNote(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/credit-notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...creditNoteForm, amount: parseFloat(creditNoteForm.amount) }),
      })
      if (res.ok) {
        const cn = await res.json()
        setInvoice((prev) => ({ ...prev, creditNotes: [cn, ...prev.creditNotes] }))
        toast.success("Credit note issued — reversal pipeline triggered")
        setCreditNoteDialogOpen(false)
        setCreditNoteForm({ amount: "", reason: "", reasonCategory: "other", issueDate: new Date().toISOString().slice(0, 10), refundMethod: "", notes: "" })
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to issue credit note")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setSubmittingCreditNote(false)
    }
  }

  const canIssueCredit = totalPaid > 0

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.push("/invoices")} className="hover:text-foreground flex items-center gap-1 h-auto p-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Invoices
        </Button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Invoice {invoice.invoiceNumber}</span>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{invoice.invoiceNumber}</h1>
              <Badge variant={statusBadgeVariant(invoice.status) as any}>{invoice.status}</Badge>
            </div>
            <p className="text-muted-foreground">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="default" onClick={handleGenerateStripeLink} disabled={generatingStripeLink || invoice.status === "PAID"}>
            {generatingStripeLink ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
            Send via Stripe
          </Button>
          <Button variant="outline" onClick={() => setIsPreviewOpen(true)}>
            <FileText className="mr-2 h-4 w-4" />
            Preview PDF
          </Button>
          <Button onClick={() => window.print()} variant="outline">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {invoice.status === "DRAFT" && (
                <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                  Edit Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleMarkAsPaid} disabled={isUpdating || invoice.status === "PAID"}>
                Mark as Paid (manual)
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete Invoice</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="pl-6">Description</TableHead>
                    <TableHead className="text-right w-20">Qty</TableHead>
                    <TableHead className="text-right w-32">Price</TableHead>
                    <TableHead className="text-right pr-6 w-32">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoice.lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{fmt(item.unitPrice)}</TableCell>
                      <TableCell className="text-right pr-6 font-medium">{fmt(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-6 border-t flex justify-end bg-muted/10">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{fmt(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{fmt(invoice.totalTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl pt-3 border-t">
                    <span>Total</span>
                    <span>{fmt(invoice.total)}</span>
                  </div>
                  {totalPaid > 0 && (
                    <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                      <span>Paid</span>
                      <span>-{fmt(totalPaid)}</span>
                    </div>
                  )}
                  {totalCredits > 0 && (
                    <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                      <span>Credits</span>
                      <span>+{fmt(totalCredits)}</span>
                    </div>
                  )}
                  {outstanding > 0 && (
                    <div className="flex justify-between font-semibold text-sm pt-2 border-t">
                      <span>Outstanding</span>
                      <span className="text-destructive">{fmt(outstanding)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Payments Received
              </CardTitle>
              {invoice.status !== "PAID" && (
                <Button size="sm" onClick={() => setPaymentDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No payments recorded yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.paymentDate).toLocaleDateString()}</TableCell>
                        <TableCell className="capitalize">{p.method.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-muted-foreground">{p.referenceNumber || "—"}</TableCell>
                        <TableCell className="text-right font-medium text-green-600 dark:text-green-400">{fmt(p.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {(invoice.creditNotes.length > 0 || canIssueCredit) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-amber-500" />
                  Credit Notes
                </CardTitle>
                {canIssueCredit && (
                  <Button size="sm" variant="outline" onClick={() => setCreditNoteDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Issue Credit Note
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {invoice.creditNotes.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No credit notes issued.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Refund Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.creditNotes.map((cn) => (
                        <TableRow key={cn.id}>
                          <TableCell>{new Date(cn.issueDate).toLocaleDateString()}</TableCell>
                          <TableCell>{cn.reason}</TableCell>
                          <TableCell className="text-muted-foreground">{cn.refundMethod || "Credit applied"}</TableCell>
                          <TableCell className="text-right font-medium text-amber-600 dark:text-amber-400">{fmt(cn.amount)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Name</Label>
                <p className="font-medium">{invoice.clientName}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Email</Label>
                <p className="font-medium">{invoice.clientEmail}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Payment Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Issued</Label>
                  <p className="font-medium">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Due</Label>
                  <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">Quick Actions</p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 mb-2" onClick={() => toast.info("Email feature coming soon")}>
                <Mail className="mr-2 h-4 w-4" />
                Send to Client
              </Button>
              {invoice.status !== "PAID" && (
                <Button className="w-full bg-green-600 hover:bg-green-700 mb-2 text-white" onClick={() => setPaymentDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Record Payment
                </Button>
              )}
              {canIssueCredit && (
                <Button variant="outline" className="w-full mb-2" onClick={() => setCreditNoteDialogOpen(true)}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Issue Credit Note
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => setIsPreviewOpen(true)}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment — {invoice.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Max: ${outstanding.toFixed(2)}`}
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Payment Method</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm((f) => ({ ...f, method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reference Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input
                placeholder="Cheque #, ACH ID, wire ref..."
                value={paymentForm.referenceNumber}
                onChange={(e) => setPaymentForm((f) => ({ ...f, referenceNumber: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Textarea
                rows={2}
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={submittingPayment}>
              {submittingPayment ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Recording...</> : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={creditNoteDialogOpen} onOpenChange={setCreditNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Credit Note — {invoice.invoiceNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Credit Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={`Max: ${totalPaid.toFixed(2)}`}
                  value={creditNoteForm.amount}
                  onChange={(e) => setCreditNoteForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={creditNoteForm.issueDate}
                  onChange={(e) => setCreditNoteForm((f) => ({ ...f, issueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Reason Category</Label>
              <Select value={creditNoteForm.reasonCategory} onValueChange={(v) => setCreditNoteForm((f) => ({ ...f, reasonCategory: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CREDIT_NOTE_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason Description</Label>
              <Textarea
                rows={2}
                placeholder="Describe the reason for this credit note..."
                value={creditNoteForm.reason}
                onChange={(e) => setCreditNoteForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Refund Method <span className="text-muted-foreground text-xs">(leave blank for credit on account)</span></Label>
              <Select value={creditNoteForm.refundMethod} onValueChange={(v) => setCreditNoteForm((f) => ({ ...f, refundMethod: v }))}>
                <SelectTrigger><SelectValue placeholder="Credit on account (no cash refund)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Credit on account</SelectItem>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleIssueCreditNote} disabled={submittingCreditNote}>
              {submittingCreditNote ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Issuing...</> : "Issue Credit Note"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={invoice.pdfUrl || ""}
        invoiceNumber={invoice.invoiceNumber}
      />
    </div>
  )
}
