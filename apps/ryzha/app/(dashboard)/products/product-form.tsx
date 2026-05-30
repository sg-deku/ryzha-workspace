"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const COA_SUGGESTIONS = [
  { code: "4000", label: "4000 — Service Revenue" },
  { code: "4100", label: "4100 — Subscription Revenue" },
  { code: "4200", label: "4200 — Consulting Revenue" },
  { code: "5000", label: "5000 — Cost of Goods Sold" },
  { code: "5100", label: "5100 — Software & SaaS" },
  { code: "5200", label: "5200 — Cloud Infrastructure" },
]

export default function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [loading, setLoading] = useState(false)

  const [code, setCode] = useState(initialData?.code || "")
  const [name, setName] = useState(initialData?.name || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [unitPrice, setUnitPrice] = useState(initialData?.unitPrice?.toString() || "0")
  const [costPrice, setCostPrice] = useState(initialData?.costPrice?.toString() || "")
  const [taxRate, setTaxRate] = useState(initialData?.taxRate?.toString() || "0")
  const [accountCode, setAccountCode] = useState(initialData?.accountCode || "")
  const [type, setType] = useState(initialData?.type || "service")
  const [isActive, setIsActive] = useState(initialData?.isActive !== false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const url = isEditing ? `/api/products/${initialData.id}` : "/api/products"
      const method = isEditing ? "PUT" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, description, unitPrice, costPrice: costPrice || null, taxRate, accountCode, type, isActive }),
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
                <Input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SVC-001"
                  required
                  readOnly={isEditing}
                  className={isEditing ? "bg-muted text-muted-foreground cursor-not-allowed" : ""}
                />
                {isEditing && <p className="text-xs text-muted-foreground">Code is locked after creation</p>}
              </div>
              <div className="space-y-2">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="product">Physical Product</SelectItem>
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

        <Card>
          <CardHeader><CardTitle>Pricing & Tax</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Default Unit Price ($)</Label>
                <Input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cost Price ($) <span className="text-xs text-muted-foreground">optional</span></Label>
                <Input type="number" min="0" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="For margin tracking" />
              </div>
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
              <Select value={accountCode} onValueChange={setAccountCode}>
                <SelectTrigger><SelectValue placeholder="Select or leave blank" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">— None —</SelectItem>
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
