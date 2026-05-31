"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"

const CATEGORIES = ["Equipment", "Furniture", "Vehicles", "Leasehold Improvements", "Software", "Buildings", "Land", "Other"]
const METHODS = [
  { value: "STRAIGHT_LINE", label: "Straight-Line (SL)" },
  { value: "DOUBLE_DECLINING", label: "Double Declining Balance (DDB)" },
]

export default function NewFixedAssetClient() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "Equipment",
    acquisitionDate: new Date().toISOString().split("T")[0],
    acquisitionCost: "",
    salvageValue: "0",
    usefulLifeMonths: "60",
    depreciationMethod: "STRAIGHT_LINE",
    glAssetAccount: "Fixed Assets",
    glDepreciationAccount: "Depreciation Expense",
    glAccumulatedAccount: "Accumulated Depreciation",
  })

  const set = (field: string, value: string) => setForm(p => ({ ...p, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.acquisitionCost || !form.acquisitionDate) {
      toast.error("Name, acquisition date, and cost are required")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/fixed-assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          acquisitionCost: parseFloat(form.acquisitionCost),
          salvageValue: parseFloat(form.salvageValue),
          usefulLifeMonths: parseInt(form.usefulLifeMonths),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Asset ${data.assetNumber} created and depreciation schedule generated`)
      router.push("/fixed-assets")
    } catch (err: any) {
      toast.error(err.message || "Failed to create asset")
    } finally {
      setSaving(false)
    }
  }

  const monthlyDepr = form.acquisitionCost && form.usefulLifeMonths
    ? ((parseFloat(form.acquisitionCost) - parseFloat(form.salvageValue || "0")) / parseInt(form.usefulLifeMonths)).toFixed(2)
    : null

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/fixed-assets"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add Fixed Asset</h1>
          <p className="text-muted-foreground text-sm">A depreciation schedule will be automatically generated on save.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle>Asset Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Name *</Label>
              <Input placeholder="e.g. MacBook Pro 14-inch" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="Optional description" value={form.description} onChange={e => set("description", e.target.value)} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => set("category", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Depreciation Method</Label>
                <Select value={form.depreciationMethod} onValueChange={v => set("depreciationMethod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Acquisition Date *</Label>
                <Input type="date" value={form.acquisitionDate} onChange={e => set("acquisitionDate", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Acquisition Cost ($) *</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" value={form.acquisitionCost} onChange={e => set("acquisitionCost", e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Salvage Value ($)</Label>
                <Input type="number" min="0" step="0.01" value={form.salvageValue} onChange={e => set("salvageValue", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Useful Life (months)</Label>
                <Input type="number" min="1" max="600" value={form.usefulLifeMonths} onChange={e => set("usefulLifeMonths", e.target.value)} />
              </div>
            </div>
            {monthlyDepr && (
              <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                Monthly straight-line depreciation: <span className="font-semibold text-foreground">${monthlyDepr}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader><CardTitle>GL Account Mapping</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Asset Account</Label>
              <Input value={form.glAssetAccount} onChange={e => set("glAssetAccount", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Depreciation Expense Account</Label>
              <Input value={form.glDepreciationAccount} onChange={e => set("glDepreciationAccount", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Accumulated Depreciation Account</Label>
              <Input value={form.glAccumulatedAccount} onChange={e => set("glAccumulatedAccount", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" type="button" asChild>
            <Link href="/fixed-assets">Cancel</Link>
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Asset
          </Button>
        </div>
      </form>
    </div>
  )
}
