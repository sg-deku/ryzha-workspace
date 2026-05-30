"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { LineItemsTable, type LineItem } from "@/components/line-items/line-items-table"

export default function VendorInvoiceForm({ initialData, linkedPO }: { initialData?: any; linkedPO?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [file, setFile] = useState<File | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [vendorId, setVendorId] = useState(initialData?.vendorId || "")
  const [invoiceNumber] = useState(initialData?.invoiceNumber || "")
  const [purchaseOrderId, setPurchaseOrderId] = useState(initialData?.purchaseOrderId || linkedPO?.id || "")
  const [purchaseOrders, setPurchaseOrders] = useState<{ id: string; poNumber: string; status: string; totalAmount: number }[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const initLines = (): LineItem[] => {
    if (initialData?.lineItems?.length > 0) {
      return initialData.lineItems.map((item: any) => ({
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
    }
    if (linkedPO?.lineItems?.length > 0) {
      return linkedPO.lineItems.map((item: any) => ({
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
    }
    return [{ description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0 }]
  }

  const [lineItems, setLineItems] = useState<LineItem[]>(initLines)

  useEffect(() => {
    fetch("/api/vendors")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setVendors(data) })
      .catch(err => console.error(err))
  }, [])

  const fetchPurchaseOrders = (vid: string) => {
    if (!vid) { setPurchaseOrders([]); setPurchaseOrderId(""); return }
    fetch(`/api/purchases?vendorId=${vid}`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setPurchaseOrders(data) })
      .catch(() => setPurchaseOrders([]))
  }

  useEffect(() => {
    if (vendorId) fetchPurchaseOrders(vendorId)
  }, [vendorId])

  const handlePOSelect = (poId: string) => {
    const resolved = poId === "_none" ? "" : poId
    setPurchaseOrderId(resolved)
    if (resolved) {
      const po = purchaseOrders.find(p => p.id === resolved)
      if (po && (po as any).lineItems?.length > 0) {
        setLineItems((po as any).lineItems.map((item: any) => ({
          productId: item.productId ?? null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          taxRate: item.taxRate ?? 0,
          amount: item.amount,
          accountCode: item.accountCode ?? null,
          notes: item.notes ?? null,
        })))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/vendor-invoices/${initialData.id}` : "/api/vendor-invoices"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
          ...(isEditing && { invoiceNumber }),
          purchaseOrderId: purchaseOrderId || null,
          lineItems: lineItems.map(item => ({
            productId: item.productId ?? null,
            description: item.description,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discount: Number(item.discount ?? 0),
            taxRate: Number(item.taxRate ?? 0),
            amount: Number(item.amount),
            accountCode: item.accountCode ?? null,
            notes: item.notes ?? null,
          })),
        }),
      })

      if (!res.ok) throw new Error(isEditing ? "Failed to update vendor invoice" : "Failed to create vendor invoice")

      toast.success(isEditing ? "Vendor Invoice updated successfully" : "Vendor Invoice created successfully")
      router.push("/vendor-invoices")
      router.refresh()
    } catch (err) {
      toast.error(isEditing ? "Failed to update vendor invoice" : "Failed to create vendor invoice")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendor-invoices">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Vendor Invoice" : "Upload / Enter Vendor Invoice"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {!isEditing && (
          <Card>
            <CardHeader>
              <CardTitle>Invoice Document (Optional)</CardTitle>
              <CardDescription>Upload a PDF or image of the vendor invoice for record keeping.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <div className="space-y-2">
                  <Label htmlFor="file" className="cursor-pointer">
                    <span className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                      Select File
                    </span>
                    <Input
                      id="file"
                      type="file"
                      className="hidden"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-4">
                    {file ? file.name : "or drag and drop it here"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Select value={vendorId} onValueChange={(v) => { setVendorId(v); fetchPurchaseOrders(v) }} required>
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
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber">Invoice Number</Label>
                <Input value={invoiceNumber || "Auto-generated on save"} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseOrderId">Linked Purchase Order (Optional)</Label>
                <Select value={purchaseOrderId || "_none"} onValueChange={handlePOSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={vendorId ? (purchaseOrders.length === 0 ? "No POs found for this vendor" : "Select a PO") : "Select a vendor first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">— None —</SelectItem>
                    {purchaseOrders.map((po) => (
                      <SelectItem key={po.id} value={po.id}>
                        {po.poNumber} ({po.status}) — ${po.totalAmount.toFixed(2)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {purchaseOrderId && (
                  <p className="text-xs text-muted-foreground">Line items carried forward from PO. You may edit them before saving.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <LineItemsTable
              lineItems={lineItems}
              onChange={setLineItems}
              showTax
              showDiscount
              showAccountCode
              scope="purchasing"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : isEditing ? "Save Changes" : "Save Invoice"}</Button>
        </div>
      </form>
    </div>
  )
}
