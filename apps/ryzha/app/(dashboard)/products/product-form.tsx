"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const COA_SUGGESTIONS = [
  { code: "4000", label: "4000 — Service Revenue" },
  { code: "4100", label: "4100 — Subscription Revenue" },
  { code: "4200", label: "4200 — Consulting Revenue" },
  { code: "5000", label: "5000 — Cost of Goods Sold" },
  { code: "5100", label: "5100 — Software & SaaS" },
  { code: "5200", label: "5200 — Cloud Infrastructure" },
  { code: "2300", label: "2300 — Tax Payable" },
]

export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [loading, setLoading] = useState(false)
  const [codeLoading, setCodeLoading] = useState(false)

  const [code, setCode] = useState(initialData?.code || "")
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [unitPrice, setUnitPrice] = useState(initialData?.unitPrice?.toString() || "0")
  const [costPrice, setCostPrice] = useState(initialData?.costPrice?.toString() || "")
  const [taxRate, setTaxRate] = useState(initialData?.taxRate?.toString() || "0")
  const [accountCode, setAccountCode] = useState(initialData?.accountCode || "")
  const [type, setType] = useState(initialData?.type || "service")
  const [isActive, setIsActive] = useState(initialData?.isActive !== false)
  const [usedInSales, setUsedInSales] = useState(initialData?.usedInSales !== false)
  const [usedInPurchasing, setUsedInPurchasing] = useState(initialData?.usedInPurchasing !== false)

  const fetchNextCode = useCallback(async () => {
    if (isEditing) return
    setCodeLoading(true)
    try {
      const params = new URLSearchParams({ type, usedInSales: String(usedInSales), usedInPurchasing: String(usedInPurchasing) })
      const res = await fetch(`/api/products/next-code?${params}`)
      const data = await res.json()
      if (data.code) setCode(data.code)
    } catch {
    } finally {
      setCodeLoading(false)
    }
  }, [isEditing, type, usedInSales, usedInPurchasing])

  useEffect(() => {
    if (!isEditing) fetchNextCode()
  }, [fetchNextCode, isEditing])

  const scopeBadges = () => {
    if (type === "tax") return <Badge className="bg-purple-100 text-purple-800 border border-purple-300">Tax Item</Badge>
    const badges = []
    if (usedInSales) badges.push(<Badge key="sales" className="bg-blue-100 text-blue-800 border border-blue-300">Used in Sales</Badge>)
    if (usedInPurchasing) badges.push(<Badge key="purchasing" className="bg-amber-100 text-amber-800 border border-amber-300">Used in Purchasing</Badge>)
    return badges.length > 0 ? <div className="flex gap-2">{badges}</div> : <span className="text-xs text-muted-foreground">No scope selected</span>
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isEditing && type !== "tax" && !usedInSales && !usedInPurchasing) {
      toast.error("Select at least one scope: Used in Sales or Used in Purchasing.")
      return
    }
    setLoading(true)
    try {
      const url = isEditing ? `/api/products/${initialData.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          description,
          unitPrice,
          costPrice: costPrice || null,
          taxRate,
          accountCode,
          type,
          isActive,
          usedInSales: type === "tax" ? false : usedInSales,
          usedInPurchasing: type === "tax" ? false : usedInPurchasing,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save product")
      toast.success(isEditing ? "Product updated" : "Product created")
      router.push("/products")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Product" : "New Product"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Identity</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Code <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <Input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SVC-0001"
                    required
                    readOnly={isEditing}
                    className={isEditing ? "bg-muted text-muted-foreground cursor-not-allowed" : "font-mono"}
                  />
                  {!isEditing && (
                    <Button type="button" variant="outline" size="icon" onClick={fetchNextCode} disabled={codeLoading} title="Regenerate code">
                      <RefreshCw className={`h-4 w-4 ${codeLoading ? "animate-spin" : ""}`} />
                    </Button>
                  )}
                </div>
                {isEditing
                  ? <p className="text-xs text-muted-foreground">Code is locked after creation</p>
                  : <p className="text-xs text-muted-foreground">Auto-generated based on type and scope. You can edit it.</p>
                }
              </div>
              <div className="space-y-2">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={type} onValueChange={v => { setType(v) }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Physical Product</SelectItem>
                    <SelectItem value="tax">Tax Item</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Name <span className="text-destructive">*</span></Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Cloud Hosting — Monthly" required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional line-level description" />
            </div>
          </CardContent>
        </Card>

        {type !== "tax" && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Controls which document types this item appears in when selecting products on line items.</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="usedInSales"
                    checked={usedInSales}
                    onChange={e => setUsedInSales(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="usedInSales" className="cursor-pointer">
                    <span className="font-medium">Used in Sales</span>
                    <span className="block text-xs text-muted-foreground">Appears in Sales Orders and Customer Invoices</span>
                  </Label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="usedInPurchasing"
                    checked={usedInPurchasing}
                    onChange={e => setUsedInPurchasing(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="usedInPurchasing" className="cursor-pointer">
                    <span className="font-medium">Used in Purchasing</span>
                    <span className="block text-xs text-muted-foreground">Appears in Purchase Orders and Vendor Invoices</span>
                  </Label>
                </div>
              </div>
              <div className="pt-1">{scopeBadges()}</div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Pricing & Tax</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Unit Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
              </div>
              {type !== "tax" && (
                <div className="space-y-2">
                  <Label>Cost Price ($) <span className="text-xs text-muted-foreground">optional</span></Label>
                  <Input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="For margin tracking" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Tax Rate (%)</Label>
              <Input type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>GL Mapping</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Default GL Account Code</Label>
              <Select value={accountCode || "__none__"} onValueChange={v => setAccountCode(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select or leave blank" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— None —</SelectItem>
                  {COA_SUGGESTIONS.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Applied to every line item using this product. Can be overridden per line.</p>
            </div>
          </CardContent>
        </Card>

        {isEditing && (
          <Card>
            <CardHeader><CardTitle>Status</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-input"
                />
                <Label htmlFor="isActive">Active — available for selection on documents</Label>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>Cancel</Button>
          <Button type="submit" disabled={loading}>{loading ? "Saving..." : isEditing ? "Save Changes" : "Create Product"}</Button>
        </div>
      </form>
    </div>
  )
}
