"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Hash, Save, RotateCcw } from "lucide-react"

const DEFAULTS = {
  customerPrefix: "CUST",
  vendorPrefix: "VEN",
  invoicePrefix: "INV",
  soPrefix: "SO",
  poPrefix: "PO",
  vinvPrefix: "VINV",
  expensePrefix: "EXP",
  jePrefix: "JE",
  txnPrefix: "TXN",
  contractPrefix: "CON",
  dmPrefix: "DM",
  padding: 5,
}

const ENTITY_GROUPS = [
  {
    label: "Sales",
    items: [
      { key: "customerPrefix", label: "Customer", example: "CUST-00001" },
      { key: "invoicePrefix", label: "Invoice", example: "INV-00001" },
      { key: "soPrefix", label: "Sales Order", example: "SO-00001" },
      { key: "contractPrefix", label: "Contract", example: "CON-00001" },
    ],
  },
  {
    label: "Procurement",
    items: [
      { key: "vendorPrefix", label: "Vendor", example: "VEN-00001" },
      { key: "poPrefix", label: "Purchase Order", example: "PO-00001" },
      { key: "vinvPrefix", label: "Vendor Invoice", example: "VINV-00001" },
      { key: "dmPrefix", label: "Debit Memo", example: "DM-00001" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { key: "expensePrefix", label: "Expense", example: "EXP-00001" },
      { key: "jePrefix", label: "Journal Entry", example: "JE-00001" },
      { key: "txnPrefix", label: "Transaction", example: "TXN-00001" },
    ],
  },
]

export default function NumberingSettingsClient({ settings }: { settings: any }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerPrefix: settings?.customerPrefix ?? DEFAULTS.customerPrefix,
    vendorPrefix: settings?.vendorPrefix ?? DEFAULTS.vendorPrefix,
    invoicePrefix: settings?.invoicePrefix ?? DEFAULTS.invoicePrefix,
    soPrefix: settings?.soPrefix ?? DEFAULTS.soPrefix,
    poPrefix: settings?.poPrefix ?? DEFAULTS.poPrefix,
    vinvPrefix: settings?.vinvPrefix ?? DEFAULTS.vinvPrefix,
    expensePrefix: settings?.expensePrefix ?? DEFAULTS.expensePrefix,
    jePrefix: settings?.jePrefix ?? DEFAULTS.jePrefix,
    txnPrefix: settings?.txnPrefix ?? DEFAULTS.txnPrefix,
    contractPrefix: settings?.contractPrefix ?? DEFAULTS.contractPrefix,
    dmPrefix: settings?.dmPrefix ?? DEFAULTS.dmPrefix,
    padding: settings?.padding ?? DEFAULTS.padding,
  })

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: typeof value === "string" ? value.toUpperCase().replace(/[^A-Z0-9]/g, "") : value }))

  const preview = (prefix: string) => `${prefix || "???"}-${"0".repeat(Math.max(1, Number(form.padding) - 1))}1`

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings/numbering", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Numbering settings saved")
      router.refresh()
    } catch {
      toast.error("Failed to save numbering settings")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setForm({ ...DEFAULTS })
    toast.info("Reset to defaults — click Save to apply")
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Numbering &amp; Sequences</h1>
        <p className="text-muted-foreground">
          Configure prefix codes and zero-padding for all entity IDs across the system. Changes apply to newly created records only.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            <CardTitle>Sequence Format</CardTitle>
          </div>
          <CardDescription>
            All entity numbers follow the format <Badge variant="outline" className="font-mono text-xs">PREFIX-NUMBER</Badge>. The number is zero-padded to the width set below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-1.5 w-48">
              <Label>Number Padding (digits)</Label>
              <Input
                type="number"
                min={3}
                max={10}
                value={form.padding}
                onChange={(e) => set("padding", Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">e.g. 5 → 00001, 6 → 000001</p>
            </div>
            <div className="mt-6 space-y-1">
              <p className="text-xs text-muted-foreground">Preview</p>
              <Badge variant="secondary" className="font-mono text-sm">
                INV-{"0".repeat(Math.max(0, Number(form.padding) - 1))}1
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {ENTITY_GROUPS.map((group) => (
        <Card key={group.label}>
          <CardHeader>
            <CardTitle className="text-base">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.items.map((item, idx) => (
              <div key={item.key}>
                {idx > 0 && <Separator className="mb-4" />}
                <div className="flex items-center gap-6">
                  <div className="space-y-1.5 flex-1 max-w-xs">
                    <Label>{item.label} Prefix</Label>
                    <Input
                      value={(form as any)[item.key]}
                      onChange={(e) => set(item.key, e.target.value)}
                      maxLength={8}
                      placeholder={DEFAULTS[item.key as keyof typeof DEFAULTS] as string}
                    />
                  </div>
                  <div className="mt-6 space-y-1">
                    <p className="text-xs text-muted-foreground">Preview</p>
                    <Badge variant="outline" className="font-mono">
                      {preview((form as any)[item.key])}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div className="flex gap-3 pb-8">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving…" : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
