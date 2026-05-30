"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Package } from "lucide-react"

export interface LineItem {
  id?: string
  productId?: string | null
  description: string
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  amount: number
  accountCode?: string | null
  notes?: string | null
}

interface Product {
  id: string
  code: string
  name: string
  description?: string | null
  unitPrice: number
  taxRate: number
  accountCode?: string | null
  type: string
}

interface Props {
  lineItems: LineItem[]
  onChange: (items: LineItem[]) => void
  showTax?: boolean
  showDiscount?: boolean
  showAccountCode?: boolean
  readOnly?: boolean
  scope?: "sales" | "purchasing"
}

function computeAmount(item: LineItem): number {
  const base = item.quantity * item.unitPrice
  const afterDiscount = base * (1 - (item.discount || 0) / 100)
  return Math.round(afterDiscount * 100) / 100
}

export function LineItemsTable({
  lineItems,
  onChange,
  showTax = true,
  showDiscount = false,
  showAccountCode = false,
  readOnly = false,
  scope,
}: Props) {
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    const params = new URLSearchParams({ active: "true" })
    if (scope) params.set("scope", scope)
    fetch(`/api/products?${params}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data) })
      .catch(() => {})
  }, [scope])

  const updateItem = useCallback((index: number, patch: Partial<LineItem>) => {
    const next = lineItems.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, ...patch }
      updated.amount = computeAmount(updated)
      return updated
    })
    onChange(next)
  }, [lineItems, onChange])

  const applyProduct = (index: number, productId: string) => {
    if (productId === "__none__") {
      updateItem(index, { productId: null })
      return
    }
    const p = products.find(p => p.id === productId)
    if (!p) return
    updateItem(index, {
      productId: p.id,
      description: p.name,
      unitPrice: p.unitPrice,
      taxRate: p.taxRate,
      accountCode: p.accountCode ?? undefined,
    })
  }

  const addItem = () => {
    onChange([...lineItems, { description: "", quantity: 1, unitPrice: 0, discount: 0, taxRate: 0, amount: 0 }])
  }

  const removeItem = (index: number) => {
    onChange(lineItems.filter((_, i) => i !== index))
  }

  const subtotal = lineItems.reduce((s, i) => s + i.amount, 0)
  const totalTax = lineItems.reduce((s, i) => s + (i.amount * (i.taxRate || 0) / 100), 0)
  const grandTotal = subtotal + totalTax

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Package className="h-4 w-4" />
          {products.length > 0
            ? `${products.length} product${products.length !== 1 ? "s" : ""} available`
            : "No products in catalog yet"}
        </div>
        {!readOnly && (
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-2 h-4 w-4" /> Add Line
          </Button>
        )}
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {products.length > 0 && <TableHead className="w-[180px]">Product</TableHead>}
              <TableHead>Description</TableHead>
              <TableHead className="w-[90px]">Qty</TableHead>
              <TableHead className="w-[120px]">Unit Price</TableHead>
              {showDiscount && <TableHead className="w-[90px]">Disc %</TableHead>}
              {showTax && <TableHead className="w-[90px]">Tax %</TableHead>}
              <TableHead className="w-[120px] text-right">Amount</TableHead>
              {showAccountCode && <TableHead className="w-[100px]">GL Code</TableHead>}
              {!readOnly && <TableHead className="w-[40px]" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((item, idx) => (
              <TableRow key={idx}>
                {products.length > 0 && (
                  <TableCell>
                    {readOnly ? (
                      <span className="text-xs text-muted-foreground font-mono">
                        {products.find(p => p.id === item.productId)?.code ?? "—"}
                      </span>
                    ) : (
                      <Select value={item.productId ?? "__none__"} onValueChange={v => applyProduct(idx, v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Custom —</SelectItem>
                          {products.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              <span className="font-mono text-xs text-muted-foreground mr-2">{p.code}</span>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                )}
                <TableCell>
                  {readOnly ? (
                    <span>{item.description}</span>
                  ) : (
                    <Input
                      value={item.description}
                      onChange={e => updateItem(idx, { description: e.target.value })}
                      placeholder="Description"
                      required
                      className="h-8"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? item.quantity : (
                    <Input
                      type="number" min="0.001" step="any"
                      value={item.quantity}
                      onChange={e => updateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  )}
                </TableCell>
                <TableCell>
                  {readOnly ? `$${item.unitPrice.toFixed(2)}` : (
                    <Input
                      type="number" min="0" step="0.01"
                      value={item.unitPrice}
                      onChange={e => updateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                      className="h-8"
                    />
                  )}
                </TableCell>
                {showDiscount && (
                  <TableCell>
                    {readOnly ? `${item.discount || 0}%` : (
                      <Input
                        type="number" min="0" max="100" step="0.01"
                        value={item.discount || 0}
                        onChange={e => updateItem(idx, { discount: parseFloat(e.target.value) || 0 })}
                        className="h-8"
                      />
                    )}
                  </TableCell>
                )}
                {showTax && (
                  <TableCell>
                    {readOnly ? (item.taxRate > 0 ? `${item.taxRate}%` : "—") : (
                      <Input
                        type="number" min="0" max="100" step="0.01"
                        value={item.taxRate || 0}
                        onChange={e => updateItem(idx, { taxRate: parseFloat(e.target.value) || 0 })}
                        className="h-8"
                      />
                    )}
                  </TableCell>
                )}
                <TableCell className="text-right font-mono font-medium">
                  ${item.amount.toFixed(2)}
                </TableCell>
                {showAccountCode && (
                  <TableCell>
                    {readOnly ? (
                      <span className="font-mono text-xs text-muted-foreground">{item.accountCode || "—"}</span>
                    ) : (
                      <Input
                        value={item.accountCode || ""}
                        onChange={e => updateItem(idx, { accountCode: e.target.value })}
                        placeholder="e.g. 4000"
                        className="h-8 font-mono text-xs"
                      />
                    )}
                  </TableCell>
                )}
                {!readOnly && (
                  <TableCell>
                    <Button
                      type="button" variant="ghost" size="icon"
                      onClick={() => removeItem(idx)}
                      disabled={lineItems.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-end">
        <div className="text-right space-y-1 min-w-[200px]">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono">${subtotal.toFixed(2)}</span>
          </div>
          {showTax && totalTax > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax</span>
              <span className="font-mono">${totalTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t pt-1">
            <span>Total</span>
            <span className="font-mono">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
