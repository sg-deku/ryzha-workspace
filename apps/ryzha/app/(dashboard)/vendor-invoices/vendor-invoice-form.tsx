"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Upload, FileText, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function VendorInvoiceForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [file, setFile] = useState<File | null>(null)
  const [vendors, setVendors] = useState<any[]>([])
  const [vendorId, setVendorId] = useState(initialData?.vendorId || "")
  const [invoiceNumber, setInvoiceNumber] = useState(initialData?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`)
  const [purchaseOrderId, setPurchaseOrderId] = useState(initialData?.purchaseOrderId || "")
  const [isLoading, setIsLoading] = useState(false)
  const [lineItems, setLineItems] = useState(
    initialData?.lineItems?.length > 0 
      ? initialData.lineItems 
      : [{ description: "", quantity: 1, unitPrice: 0 }]
  )

  useEffect(() => {
    fetch("/api/vendors")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVendors(data)
      })
      .catch(err => console.error(err))
  }, [])

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_: any, i: number) => i !== index))
  }

  const updateLineItem = (index: number, field: string, value: any) => {
    const newItems = [...lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    setLineItems(newItems)
  }

  const total = lineItems.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)

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
          invoiceNumber, 
          purchaseOrderId: purchaseOrderId || null, 
          lineItems: lineItems.map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
          }))
        })
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
                <Select value={vendorId} onValueChange={setVendorId} required>
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
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchaseOrderId">PO Number (Optional)</Label>
                <Input value={purchaseOrderId} onChange={e => setPurchaseOrderId(e.target.value)} placeholder="e.g. PO-123456" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              <Plus className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead className="w-[150px]">Unit Price</TableHead>
                  <TableHead className="w-[150px]">Amount</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lineItems.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Input 
                        value={item.description} 
                        onChange={(e) => updateLineItem(index, "description", e.target.value)}
                        placeholder="Item description"
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="1"
                        value={item.quantity} 
                        onChange={(e) => updateLineItem(index, "quantity", e.target.value)}
                        required
                      />
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice} 
                        onChange={(e) => updateLineItem(index, "unitPrice", e.target.value)}
                        required
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      ${(item.quantity * item.unitPrice).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" type="button" onClick={() => removeLineItem(index)} disabled={lineItems.length === 1}>
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end pt-4">
              <div className="text-xl font-bold">
                Total: ${total.toFixed(2)}
              </div>
            </div>
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
