"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { AISuggestBar } from "@/components/ai/ai-suggest-bar"
import { LineItemsTable, type LineItem } from "@/components/line-items/line-items-table"

export default function PurchaseOrderForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [vendorId, setVendorId] = useState(initialData?.vendorId || "")
  const [vendors, setVendors] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  useEffect(() => {
    fetch("/api/vendors")
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setVendors(data) })
      .catch(err => console.error(err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/purchases/${initialData.id}` : "/api/purchases"
      const method = isEditing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId,
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
      if (!res.ok) throw new Error(isEditing ? "Failed to update purchase order" : "Failed to create purchase order")
      toast.success(isEditing ? "Purchase Order updated successfully" : "Purchase Order created successfully")
      router.push("/purchases")
      router.refresh()
    } catch (err) {
      toast.error(isEditing ? "Failed to update purchase order" : "Failed to create purchase order")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/purchases"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Purchase Order" : "New Purchase Order"}</h2>
      </div>

      {!isEditing && (
        <AISuggestBar
          type="purchase"
          onSuggestion={(data) => {
            if (data.items?.length) {
              setLineItems(data.items.map((item: any) => ({
                productId: item.productId ?? null,
                description: item.description || "",
                quantity: item.quantity || 1,
                unitPrice: item.unitPrice || 0,
                discount: item.discount || 0,
                taxRate: item.taxRate || 0,
                amount: (item.quantity || 1) * (item.unitPrice || 0),
                accountCode: item.accountCode ?? null,
              })))
            }
          }}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Order Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Select value={vendorId} onValueChange={setVendorId} required>
                  <SelectTrigger><SelectValue placeholder="Select a vendor" /></SelectTrigger>
                  <SelectContent>
                    {vendors.map((v) => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>PO Number</Label>
                <Input value={initialData?.poNumber || "Auto-generated on save"} readOnly className="bg-muted text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
          <CardContent>
            <LineItemsTable
              lineItems={lineItems}
              onChange={setLineItems}
              showTax
              showDiscount
              showAccountCode
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Purchase Order"}</Button>
        </div>
      </form>
    </div>
  )
}
