"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { InvoiceBuilder } from "./invoice-builder"
import { Sparkles, Loader2, Plus, Save, FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonWithLoading } from "@/components/ui/button-with-loading"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AISuggestButton } from "./ai-suggest-button"

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
  isNew?: boolean
}

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
  const [lineItems, setLineItems] = useState<LineItem[]>(
    initialData?.lineItems?.length > 0
      ? initialData.lineItems.map((item: any) => ({
          ...item,
          id: item.id || Math.random().toString(36).substr(2, 9)
        }))
      : [{ id: "1", description: "", quantity: 1, unitPrice: 0, taxRate: 0, amount: 0 }]
  )
  const [subtotal, setSubtotal] = useState(initialData?.subtotal || 0)
  const [totalTax, setTotalTax] = useState(initialData?.totalTax || 0)
  const [total, setTotal] = useState(initialData?.total || 0)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    // Remove highlight from new items after a delay
    const timer = setTimeout(() => {
      setLineItems(prev => prev.map(item => ({ ...item, isNew: false })))
    }, 3000)
    return () => clearTimeout(timer)
  }, [lineItems])

  useEffect(() => {
    if (isEditing) return
    fetch("/api/invoices")
      .then(res => res.json())
      .then(data => {
        setInvoiceNumber(data.nextNumber)
        setDefaultTaxRate(data.defaultTaxRate)
        // Apply default tax rate to existing items
        setLineItems(prev => prev.map(item => ({ ...item, taxRate: data.defaultTaxRate })))
      })
  }, [isEditing])

  useEffect(() => {
    let sub = 0
    let tax = 0
    lineItems.forEach(item => {
      sub += item.amount
      tax += (item.amount * item.taxRate) / 100
    })
    setSubtotal(sub)
    setTotalTax(tax)
    setTotal(sub + tax)
  }, [lineItems])

  useEffect(() => {
    if (clientCountry && productCategory && subtotal > 0) {
      fetch("/api/tax/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: subtotal,
          productCategory,
          customerCountry: clientCountry
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.taxRate !== undefined) {
          setLineItems(prev => prev.map(item => ({ ...item, taxRate: data.taxRate * 100 })))
        }
      })
    }
  }, [clientCountry, productCategory, subtotal])

  const addLineItem = () => {
    setLineItems([...lineItems, { 
      id: Math.random().toString(36).substr(2, 9), 
      description: "", 
      quantity: 1, 
      unitPrice: 0, 
      taxRate: defaultTaxRate, 
      amount: 0 
    }])
  }

  const cloneLineItem = (item: LineItem) => {
    setLineItems([...lineItems, { 
      ...item, 
      id: Math.random().toString(36).substr(2, 9) 
    }])
  }

  const removeLineItem = (id: string) => {
    if (lineItems.length === 1) return
    setLineItems(lineItems.filter(item => item.id !== id))
  }

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    const updated = lineItems.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value }
        if (field === "quantity" || field === "unitPrice") {
          newItem.amount = newItem.quantity * newItem.unitPrice
        }
        return newItem
      }
      return item
    })
    setLineItems(updated)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const url = isEditing ? `/api/invoices/${initialData.id}` : "/api/invoices"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          issueDate,
          dueDate,
          clientName,
          clientEmail,
          clientAddress: { raw: clientAddress, country: clientCountry },
          lineItems,
          subtotal,
          totalTax,
          total
        })
      })

      if (res.ok) {
        toast.success(isEditing ? "Invoice updated" : "Invoice saved as draft")
        router.push("/invoices")
      } else {
        toast.error(isEditing ? "Failed to update invoice" : "Failed to save invoice")
      }
    } catch (err) {
      toast.error("An error occurred while saving")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveAndGenerate = async () => {
    setIsGenerating(true)
    try {
      const url = isEditing ? `/api/invoices/${initialData.id}` : "/api/invoices"
      const method = isEditing ? "PUT" : "POST"

      // First save the invoice
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceNumber,
          issueDate,
          dueDate,
          clientName,
          clientEmail,
          clientAddress: { raw: clientAddress, country: clientCountry },
          lineItems,
          subtotal,
          totalTax,
          total
        })
      })

      if (res.ok) {
        const invoice = await res.json()
        // Generate PDF
        const pdfRes = await fetch(`/api/invoices/${invoice.id}/generate-pdf`, { method: "POST" })
        if (pdfRes.ok) {
          toast.success(`Invoice ${invoice.invoiceNumber} saved and PDF generated!`)
        } else {
          toast.warning(`Invoice saved but PDF generation failed.`)
        }
        router.push("/invoices")
      } else {
        toast.error("Failed to save invoice")
      }
    } catch (err) {
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
          <ButtonWithLoading 
            variant="outline" 
            onClick={handleSave} 
            isLoading={isSaving}
            loadingText="Saving..."
          >
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </ButtonWithLoading>
          <ButtonWithLoading 
            onClick={handleSaveAndGenerate} 
            isLoading={isGenerating}
            loadingText="Generating..."
          >
            <FileDown className="mr-2 h-4 w-4" />
            Generate PDF
          </ButtonWithLoading>
        </div>
      </div>

      <AISuggestButton 
        onSuggestions={(suggestions) => {
          const newItems = suggestions.map((s: any) => ({
            id: Math.random().toString(36).substr(2, 9),
            description: s.description,
            quantity: s.suggestedQuantity,
            unitPrice: s.suggestedUnitPrice,
            taxRate: s.recommendedTaxRate,
            amount: s.suggestedQuantity * s.suggestedUnitPrice,
            isNew: true
          }))
          setLineItems(prev => {
            if (prev.length === 1 && !prev[0].description && prev[0].amount === 0) {
              return newItems
            }
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
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input 
                  id="issueDate"
                  type="date" 
                  value={issueDate} 
                  onChange={e => setIssueDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input 
                  id="dueDate"
                  type="date" 
                  value={dueDate} 
                  onChange={e => setDueDate(e.target.value)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name</Label>
              <Input 
                id="clientName"
                value={clientName} 
                onChange={e => setClientName(e.target.value)} 
                placeholder="Acme Corp"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientEmail">Client Email</Label>
              <Input 
                id="clientEmail"
                type="email" 
                value={clientEmail} 
                onChange={e => setClientEmail(e.target.value)} 
                placeholder="billing@acme.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientCountry">Client Country</Label>
                <Input 
                  id="clientCountry"
                  value={clientCountry} 
                  onChange={e => setClientCountry(e.target.value.toUpperCase())} 
                  placeholder="US"
                  maxLength={2}
                />
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
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Line Items</h2>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        <InvoiceBuilder
          lineItems={lineItems}
          setLineItems={setLineItems}
          onUpdateItem={updateLineItem}
          onRemoveItem={removeLineItem}
          onCloneItem={cloneLineItem}
        />

        <div className="flex justify-end pt-4">
          <div className="w-full max-w-[256px] space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalTax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-lg">
              <span>Total</span>
              <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
