"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SalesOrderForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [customerId, setCustomerId] = useState(initialData?.customerId || "")
  const [customers, setCustomers] = useState<any[]>([])
  const [orderNumber, setOrderNumber] = useState(initialData?.orderNumber || `SO-${Date.now().toString().slice(-6)}`)
  const [isLoading, setIsLoading] = useState(false)
  const [lineItems, setLineItems] = useState(
    initialData?.lineItems?.length > 0 
      ? initialData.lineItems 
      : [{ description: "", quantity: 1, unitPrice: 0 }]
  )

  useEffect(() => {
    fetch("/api/customers")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCustomers(data)
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
      const url = isEditing ? `/api/sales-orders/${initialData.id}` : "/api/sales-orders"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          customerId, 
          orderNumber, 
          lineItems: lineItems.map((item: any) => ({
            ...item,
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice)
          })) 
        })
      })

      if (!res.ok) throw new Error(isEditing ? "Failed to update sales order" : "Failed to create sales order")

      toast.success(isEditing ? "Sales Order updated successfully" : "Sales Order created successfully")
      router.push("/sales-orders")
      router.refresh()
    } catch (err) {
      toast.error(isEditing ? "Failed to update sales order" : "Failed to create sales order")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/sales-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Sales Order" : "New Sales Order"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="soNumber">SO Number</Label>
                <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} required />
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
                    <TableCell className="align-middle font-medium">
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
            
            <div className="mt-4 flex justify-end">
              <div className="text-right space-y-1">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Sales Order"}</Button>
        </div>
      </form>
    </div>
  )
}
