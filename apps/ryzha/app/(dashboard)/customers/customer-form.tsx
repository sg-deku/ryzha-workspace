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
import { AISuggestBar } from "@/components/ai/ai-suggest-bar"

export default function CustomerForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!initialData?.id

  const addr = initialData?.address ?? {}

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    taxId: initialData?.taxId || "",
    creditLimit: initialData?.creditLimit ?? 5000,
    paymentTerms: initialData?.paymentTerms || "NET30",
    status: initialData?.status || "ACTIVE",
    notes: initialData?.notes || "",
    addressStreet: addr.street || "",
    addressCity: addr.city || "",
    addressCountry: addr.country || "",
    addressPostalCode: addr.postalCode || "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      taxId: formData.taxId,
      creditLimit: Number(formData.creditLimit),
      paymentTerms: formData.paymentTerms,
      status: formData.status,
      notes: formData.notes,
      address: {
        street: formData.addressStreet,
        city: formData.addressCity,
        country: formData.addressCountry,
        postalCode: formData.addressPostalCode,
      },
    }

    try {
      const url = isEditing ? `/api/customers/${initialData.id}` : "/api/customers"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error(isEditing ? "Failed to update customer" : "Failed to create customer")

      toast.success(isEditing ? "Customer updated successfully" : "Customer created successfully")
      router.push("/customers")
      router.refresh()
    } catch (error) {
      toast.error(isEditing ? "Failed to update customer" : "Failed to create customer")
    } finally {
      setIsLoading(false)
    }
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

      {!isEditing && (
        <div className="max-w-2xl">
          <AISuggestBar
            type="customer"
            onSuggestion={(data) => {
              setFormData(prev => ({
                ...prev,
                name: data.name || prev.name,
                email: data.email || prev.email,
                taxId: data.taxId || prev.taxId,
                creditLimit: data.creditLimit ?? prev.creditLimit,
              }))
            }}
          />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
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
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" placeholder="+1 555 000 0000" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input id="taxId" name="taxId" placeholder="EU12345678" value={formData.taxId} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditLimit">Credit Limit ($) *</Label>
                <Input id="creditLimit" name="creditLimit" type="number" required min="0" step="100" value={formData.creditLimit} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <select
                  id="paymentTerms"
                  name="paymentTerms"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={formData.paymentTerms}
                  onChange={handleChange}
                >
                  <option value="NET7">Net 7</option>
                  <option value="NET15">Net 15</option>
                  <option value="NET30">Net 30</option>
                  <option value="NET45">Net 45</option>
                  <option value="NET60">Net 60</option>
                  <option value="NET90">Net 90</option>
                  <option value="DUE_ON_RECEIPT">Due on Receipt</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

        <Card>
          <CardHeader>
            <CardTitle>Billing Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressStreet">Street</Label>
              <Input id="addressStreet" name="addressStreet" placeholder="123 Main St" value={formData.addressStreet} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="addressCity">City</Label>
                <Input id="addressCity" name="addressCity" placeholder="New York" value={formData.addressCity} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="addressPostalCode">Postal Code</Label>
                <Input id="addressPostalCode" name="addressPostalCode" placeholder="10001" value={formData.addressPostalCode} onChange={handleChange} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCountry">Country</Label>
              <Input id="addressCountry" name="addressCountry" placeholder="United States" value={formData.addressCountry} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Any internal notes about this customer..."
                value={formData.notes}
                onChange={handleChange}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
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
