"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Save, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonWithLoading } from "@/components/ui/button-with-loading"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AISuggestButton } from "./ai-suggest-button"
import { LineItemsTable, type LineItem } from "@/components/line-items/line-items-table"

export function InvoiceForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || "")
  const [issueDate, setIssueDate] = useState(initialData?.issueDate ? new Date(initialData.issueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState(initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split("T")[0] : "")
  const [clientName, setClientName] = useState(initialData?.clientName || "")
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || "")
  const [clientCountry, setClientCountry] = useState(initialData?.clientAddress?.country || "")
  const [productCategory, setProductCategory] = useState("Software & SaaS")
  const [clientAddress, setClientAddress] = useState(initialData?.clientAddress?.raw || "")
  const [defaultTaxRate, setDefaultTaxRate] = useState(0)
  const [customers, setCustomers] = useState<any[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("")
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems?.length > 0
      ? initialData.lineItems.map((item: any) => ({
          id: item.id,
          productId: item.productId ?? null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          taxRate: item.taxRate ?? 0,
          amount: item.amount,
          accountCode: item.accountCode ?? null,
          notes: item.notes ?? null,
        }))
      : [{ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0 }]
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
  const totalTax = lineItems.reduce((s, i) => s + (i.amount * (i.taxRate || 0) / 100), 0)
  const total = subtotal + totalTax

  useEffect(() => {
    fetch("/api/customers")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setCustomers(data) })
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(c => c.id === selectedCustomerId)
      if (customer) {
        setClientName(customer.name)
        setClientEmail(customer.email || "")
        setClientCountry(customer.address?.country || "")
      }
    }
  }, [selectedCustomerId, customers])

  useEffect(() => {
    if (isEditing) return
    fetch("/api/invoices")
      .then(res => res.json())
      .then(data => {
        setInvoiceNumber(data.nextNumber)
        setDefaultTaxRate(data.defaultTaxRate)
        setLineItems(prev => prev.map(item => ({ ...item, taxRate: data.defaultTaxRate })))
      })
  }, [isEditing])

  useEffect(() => {
    if (clientCountry && productCategory && subtotal > 0) {
      fetch("/api/tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: subtotal, productCategory, customerCountry: clientCountry }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.taxRate !== undefined) {
            setLineItems(prev => prev.map(item => ({ ...item, taxRate: data.taxRate * 100 })))
          }
        })
    }
  }, [clientCountry, productCategory, subtotal])

  const buildPayload = () => ({
    invoiceNumber,
    issueDate,
    dueDate,
    clientName,
    clientEmail,
    clientAddress: { raw: clientAddress, country: clientCountry },
    lineItems: lineItems.map(li => ({
      productId: li.productId ?? null,
      description: li.description,
      quantity: li.quantity,
      unitPrice: li.unitPrice,
      discount: li.discount ?? 0,
      taxRate: li.taxRate ?? 0,
      amount: li.amount,
      accountCode: li.accountCode ?? null,
      notes: li.notes ?? null,
    })),
    subtotal,
    totalTax,
    total,
  })

  const handleSave = async () => {
    if (!isEditing && !selectedCustomerId) {
      toast.error("Please select an existing customer before saving.")
      return
    }
    setIsSaving(true)
    try {
      const url = isEditing ? `/api/invoices/${initialData.id}` : "/api/invoices"
      const method = isEditing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) })
      if (res.ok) {
        toast.success(isEditing ? "Invoice updated" : "Invoice saved as draft")
        router.push("/invoices")
      } else {
        toast.error(isEditing ? "Failed to update invoice" : "Failed to save invoice")
      }
    } catch {
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndGenerate = async () => {
    if (!isEditing && !selectedCustomerId) {
      toast.error("Please select an existing customer before saving.")
      return
    }
    setIsGenerating(true)
    try {
      const url = isEditing ? `/api/invoices/${initialData.id}` : "/api/invoices"
      const method = isEditing ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(buildPayload()) })
      if (res.ok) {
        const invoice = await res.json()
        const pdfRes = await fetch(`/api/invoices/${invoice.id}/generate-pdf`, { method: "POST" })
        if (pdfRes.ok) {
          toast.success(`Invoice ${invoice.invoiceNumber} saved and PDF generated!`)
        } else {
          toast.warning("Invoice saved but PDF generation failed.")
        }
        router.push("/invoices")
      } else {
        toast.error("Failed to save invoice")
      }
    } catch {
      toast.error("An error occurred during generation")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">Create and send a professional invoice.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonWithLoading variant="outline" onClick={handleSave} isLoading={isSaving} loadingText="Saving...">
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </ButtonWithLoading>
          <ButtonWithLoading onClick={handleSaveAndGenerate} isLoading={isGenerating} loadingText="Generating...">
            <FileDown className="mr-2 h-4 w-4" />
            Generate PDF
          </ButtonWithLoading>
        </div>
      </div>

      <AISuggestButton
        onSuggestions={(suggestions) => {
          const newItems: LineItem[] = suggestions.map((s: any) => ({
            description: s.description,
            quantity: s.suggestedQuantity,
            unitPrice: s.suggestedUnitPrice,
            discount: 0,
            taxRate: s.recommendedTaxRate,
            amount: s.suggestedQuantity * s.suggestedUnitPrice,
          }))
          setLineItems(prev => {
            if (prev.length === 1 && !prev[0].description && prev[0].amount === 0) return newItems
            return [...prev, ...newItems]
          })
        }}
        clientEmail={clientEmail}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={invoiceNumber || "Auto-generated on save"}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input id="issueDate" type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Customer <span className="text-destructive">*</span></Label>
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select an existing customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} {c.email ? `(${c.email})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {customers.length === 0 && (
                <p className="text-xs text-destructive">No customers found. Create a customer first before creating an invoice.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input id="clientEmail" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="billing@acme.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientCountry">Client Country</Label>
                <Input id="clientCountry" value={clientCountry} onChange={e => setClientCountry(e.target.value.toUpperCase())} placeholder="US" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={productCategory} onValueChange={setProductCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software & SaaS">Software & SaaS</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Consulting">Consulting</SelectItem>
                    <SelectItem value="Training">Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Line Items</h2>
        <LineItemsTable lineItems={lineItems} onChange={setLineItems} showTax showDiscount showAccountCode />
      </div>
    </div>
  )
}
