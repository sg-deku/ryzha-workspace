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
  CreditCard
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { PDFPreviewModal } from "./pdf-preview-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
}

export function InvoiceDetail({ invoice: initialInvoice }: { invoice: Invoice }) {
  const router = useRouter()
  const [invoice, setInvoice] = useState(initialInvoice)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleMarkAsPaid = async () => {
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" })
      })

      if (res.ok) {
        const updated = await res.json()
        setInvoice(updated)
        toast.success("Invoice marked as paid")
        
        // Trigger confetti if first time
        const hasConfetti = localStorage.getItem("has_confetti_invoice_paid")
        if (!hasConfetti) {
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
          })
          localStorage.setItem("has_confetti_invoice_paid", "true")
        }
      } else {
        toast.error("Failed to update invoice status")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push("/invoices")} 
          className="hover:text-foreground flex items-center gap-1 h-auto p-0"
        >
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
              <Badge variant={
                invoice.status === 'PAID' ? 'success' : 
                invoice.status === 'SENT' ? 'default' :
                invoice.status === 'OVERDUE' ? 'destructive' :
                'secondary'
              }>
                {invoice.status}
              </Badge>
            </div>
            <p className="text-muted-foreground">Issued on {new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
              {invoice.status === 'DRAFT' && (
                <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice.id}/edit`)}>
                  Edit Invoice
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleMarkAsPaid} disabled={isUpdating || invoice.status === 'PAID'}>
                Mark as Paid
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
                      <TableCell className="text-right">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right pr-6 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="p-6 border-t flex justify-end bg-muted/10">
                <div className="w-64 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.totalTax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xl pt-3 border-t">
                    <span>Total</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 mb-2"
                onClick={() => toast.info("Email feature coming soon")}
              >
                <Mail className="mr-2 h-4 w-4" />
                Send to Client
              </Button>
              {invoice.status !== 'PAID' && (
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 mb-2 text-white"
                  onClick={handleMarkAsPaid}
                  disabled={isUpdating}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {isUpdating ? "Updating..." : "Mark as Paid"}
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

      <PDFPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        pdfUrl={invoice.pdfUrl || ""}
        invoiceNumber={invoice.invoiceNumber}
      />
    </div>
  )
}
