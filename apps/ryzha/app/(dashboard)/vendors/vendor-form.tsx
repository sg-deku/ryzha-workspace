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

export default function VendorForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const isEditing = !!initialData?.id
  const [name, setName] = useState(initialData?.name || "")
  const [email, setEmail] = useState(initialData?.email || "")
  const [taxId, setTaxId] = useState(initialData?.taxId || "")
  const [paymentTerms, setPaymentTerms] = useState(initialData?.paymentTerms || "NET30")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/vendors/${initialData.id}` : "/api/vendors"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, taxId, paymentTerms })
      })

      if (!res.ok) throw new Error(isEditing ? "Failed to update vendor" : "Failed to create vendor")

      toast.success(isEditing ? "Vendor updated successfully" : "Vendor created successfully")
      router.push("/vendors")
      router.refresh()
    } catch (err) {
      toast.error(isEditing ? "Failed to update vendor" : "Failed to create vendor")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vendors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">{isEditing ? "Edit Vendor" : "Add Vendor"}</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input id="name" required placeholder="Acme Corp" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input id="email" type="email" placeholder="billing@acmecorp.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taxId">Tax ID (Optional)</Label>
              <Input id="taxId" placeholder="XX-XXXXXXX" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms">Payment Terms</Label>
              <Input id="paymentTerms" placeholder="NET30" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" type="button" onClick={() => router.back()} disabled={isLoading}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? "Saving..." : isEditing ? "Save Changes" : "Create Vendor"}</Button>
        </div>
      </form>
    </div>
  )
}
