"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, Save, Landmark } from "lucide-react"

export default function OrganizationSettingsPage({ organization }: { organization: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form State
  const [name, setName] = useState(organization?.name || "")
  const [legalName, setLegalName] = useState(organization?.legalName || "")
  const [taxId, setTaxId] = useState(organization?.taxId || "")
  const [currency, setCurrency] = useState(organization?.currency || "USD")
  const [defaultTaxRate, setDefaultTaxRate] = useState(organization?.defaultTaxRate || 0)
  const [fiscalYearStart, setFiscalYearStart] = useState(organization?.financialSettings?.fiscalYearStart || "January")

  const handleSave = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/settings/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          legalName,
          taxId,
          currency,
          defaultTaxRate: Number(defaultTaxRate),
          fiscalYearStart
        })
      })

      if (!response.ok) {
        throw new Error("Failed to save organization settings")
      }

      toast.success("Organization settings updated")
      router.refresh()
    } catch (error) {
      toast.error("Failed to update settings")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground">Manage your company's profile, tax settings, and compliance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <CardTitle>Organization Details</CardTitle>
            </div>
            <CardDescription>Update your company's basic information and legal identity.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="legal-name">Legal Entity Name</Label>
              <Input id="legal-name" value={legalName} onChange={(e) => setLegalName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax-id">Tax ID / VAT Number</Label>
              <Input id="tax-id" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Base Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/50 p-4">
            <Button onClick={handleSave} disabled={loading}>
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <CardTitle>Tax Configuration</CardTitle>
            </div>
            <CardDescription>Default tax settings for your transactions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="default-tax">Default Tax Rate (%)</Label>
              <Input id="default-tax" type="number" value={defaultTaxRate} onChange={(e) => setDefaultTaxRate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
              <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                <SelectTrigger>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="January">January</SelectItem>
                  <SelectItem value="February">February</SelectItem>
                  <SelectItem value="March">March</SelectItem>
                  <SelectItem value="April">April</SelectItem>
                  <SelectItem value="May">May</SelectItem>
                  <SelectItem value="June">June</SelectItem>
                  <SelectItem value="July">July</SelectItem>
                  <SelectItem value="August">August</SelectItem>
                  <SelectItem value="September">September</SelectItem>
                  <SelectItem value="October">October</SelectItem>
                  <SelectItem value="November">November</SelectItem>
                  <SelectItem value="December">December</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
