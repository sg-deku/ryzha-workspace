"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function CustomerForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData?.id
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    taxId: initialData?.taxId || "",
    creditLimit: initialData?.creditLimit || 5000,
    status: initialData?.status || "ACTIVE"
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const url = isEditing ? `/api/customers/${initialData.id}` : "/api/customers"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          creditLimit: Number(formData.creditLimit)
        })
      })

      if (!response.ok) {
        throw new Error(isEditing ? "Failed to update customer" : "Failed to create customer")
      }

      toast.success(isEditing ? "Customer updated successfully" : "Customer created successfully")
      router.push("/customers")
      router.refresh()
    } catch (error) {
      toast.error(isEditing ? "Failed to update customer" : "Failed to create customer")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Customer" : "Add Customer"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input id="name" name="name" required placeholder="Globex Corp" value={formData.name} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Billing Email</Label>
                <Input id="email" name="email" type="email" placeholder="billing@globex.com" value={formData.email} onChange={handleChange} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input id="taxId" name="taxId" placeholder="EU12345678" value={formData.taxId} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit ($) *</Label>
                <Input id="creditLimit" name="creditLimit" type="number" required min="0" step="100" value={formData.creditLimit} onChange={handleChange} />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select 
                id="status" 
                name="status"
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.status} 
                onChange={handleChange}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Customer"}</Button>
        </div>
      </form>
    </div>
  )
}
