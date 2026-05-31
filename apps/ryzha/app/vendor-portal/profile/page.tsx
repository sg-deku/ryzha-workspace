"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

export default function VendorPortalProfilePage() {
  const router = useRouter()
  const [vendor, setVendor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState({
    email: "",
    bankAccountName: "",
    bankIban: "",
    bankBic: "",
    bankRoutingNumber: "",
    bankAccountNumber: "",
    bankSortCode: "",
    bankCountry: "",
  })

  useEffect(() => {
    fetch("/api/vendor-portal/me").then(async (res) => {
      if (res.status === 401) { router.replace("/vendor-portal/expired"); return }
      if (res.ok) {
        const data = await res.json()
        setVendor(data)
        setForm({
          email: data.email || "",
          bankAccountName: data.bankAccountName || "",
          bankIban: data.bankIban || "",
          bankBic: data.bankBic || "",
          bankRoutingNumber: data.bankRoutingNumber || "",
          bankAccountNumber: data.bankAccountNumber || "",
          bankSortCode: data.bankSortCode || "",
          bankCountry: data.bankCountry || "",
        })
      }
      setLoading(false)
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/vendor-portal/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSaved(true)
        toast.success("Change request submitted — pending review by your customer")
        setTimeout(() => setSaved(false), 4000)
      } else {
        toast.error("Failed to submit changes")
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          Profile changes are submitted as requests and require approval before taking effect.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-500">Company Name</p>
            <p className="font-medium">{vendor?.name}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tax ID</p>
            <p className="font-medium">{vendor?.taxId || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Payment Terms</p>
            <p className="font-medium">{vendor?.paymentTerms || "NET30"}</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Details</CardTitle>
            <CardDescription className="text-xs">Changes require customer approval.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Banking Details</CardTitle>
            <CardDescription className="text-xs">Update your bank account for payment. Changes require customer approval.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="bankAccountName" className="text-xs">Account Name</Label>
              <Input id="bankAccountName" value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bankIban" className="text-xs">IBAN</Label>
                <Input id="bankIban" value={form.bankIban} onChange={(e) => setForm({ ...form, bankIban: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bankBic" className="text-xs">BIC/SWIFT</Label>
                <Input id="bankBic" value={form.bankBic} onChange={(e) => setForm({ ...form, bankBic: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bankRoutingNumber" className="text-xs">Routing Number (ACH)</Label>
                <Input id="bankRoutingNumber" value={form.bankRoutingNumber} onChange={(e) => setForm({ ...form, bankRoutingNumber: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bankAccountNumber" className="text-xs">Account Number</Label>
                <Input id="bankAccountNumber" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bankSortCode" className="text-xs">Sort Code (UK)</Label>
                <Input id="bankSortCode" value={form.bankSortCode} onChange={(e) => setForm({ ...form, bankSortCode: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bankCountry" className="text-xs">Bank Country</Label>
                <Input id="bankCountry" value={form.bankCountry} onChange={(e) => setForm({ ...form, bankCountry: e.target.value })} placeholder="US, GB, DE..." />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || saved} className="min-w-32">
            {saved ? (
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Submitted</span>
            ) : saving ? (
              "Submitting..."
            ) : (
              "Submit Changes"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
