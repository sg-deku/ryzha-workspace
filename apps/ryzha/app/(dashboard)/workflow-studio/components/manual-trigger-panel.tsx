"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Zap } from "lucide-react"
import { toast } from "sonner"

const STRIPE_SCENARIOS = [
  { value: "annual_subscription", label: "Annual Subscription", amount: "1200", desc: "Annual subscription – 12 month SaaS license" },
  { value: "monthly_subscription", label: "Monthly Subscription", amount: "100", desc: "Monthly subscription payment" },
  { value: "one_time", label: "One-time Purchase", amount: "500", desc: "One-time professional services fee" },
  { value: "enterprise", label: "Enterprise Contract", amount: "50000", desc: "Enterprise annual contract – multi-seat license" },
  { value: "custom", label: "Custom", amount: "", desc: "" },
]

const P2P_SCENARIOS = [
  { value: "standard", label: "Standard Invoice", amount: "2500", vendor: "Acme Supplies Co.", po: true },
  { value: "overdue", label: "Overdue Invoice", amount: "8000", vendor: "Global Tech Parts", po: true },
  { value: "disputed", label: "Disputed Invoice", amount: "15000", vendor: "Premium Services Ltd.", po: false },
  { value: "software", label: "Software License", amount: "3600", vendor: "SaaS Tools Inc.", po: true },
  { value: "custom", label: "Custom", amount: "", vendor: "", po: true },
]

const O2C_SCENARIOS = [
  { value: "new_customer", label: "New Customer – First Order", amount: "4500", customer: "Acme Corp", email: "billing@acme.com" },
  { value: "renewal", label: "Annual Renewal", amount: "12000", customer: "TechStart Inc.", email: "finance@techstart.io" },
  { value: "upgrade", label: "Plan Upgrade", amount: "7500", customer: "GrowthCo", email: "ap@growthco.com" },
  { value: "churn_risk", label: "Churn Risk – Late Payment", amount: "950", customer: "SmallBiz LLC", email: "owner@smallbiz.com" },
  { value: "custom", label: "Custom", amount: "", customer: "", email: "" },
]

export function ManualTriggerPanel({ onTrigger }: { onTrigger: (id: string) => void }) {
  const [loading, setLoading] = useState(false)

  const [stripeScenario, setStripeScenario] = useState(STRIPE_SCENARIOS[0].value)
  const [stripeAmount, setStripeAmount] = useState(STRIPE_SCENARIOS[0].amount)
  const [stripeDesc, setStripeDesc] = useState(STRIPE_SCENARIOS[0].desc)
  const [stripeEmail, setStripeEmail] = useState("customer@example.com")

  const [p2pScenario, setP2pScenario] = useState(P2P_SCENARIOS[0].value)
  const [p2pAmount, setP2pAmount] = useState(P2P_SCENARIOS[0].amount)
  const [p2pVendor, setP2pVendor] = useState(P2P_SCENARIOS[0].vendor)
  const [p2pHasPO, setP2pHasPO] = useState(P2P_SCENARIOS[0].po)

  const [o2cScenario, setO2cScenario] = useState(O2C_SCENARIOS[0].value)
  const [o2cAmount, setO2cAmount] = useState(O2C_SCENARIOS[0].amount)
  const [o2cCustomer, setO2cCustomer] = useState(O2C_SCENARIOS[0].customer)
  const [o2cEmail, setO2cEmail] = useState(O2C_SCENARIOS[0].email)

  const handleTrigger = async (type: string, payload: Record<string, any>) => {
    setLoading(true)
    try {
      const res = await fetch("/api/workflow-studio/manual-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Workflow triggered — Execution ID: ${data.executionId}`)
        if (data.executionId) onTrigger(data.executionId)
      } else {
        toast.error(data.error || "Failed to trigger workflow")
      }
    } catch {
      toast.error("Failed to trigger workflow")
    }
    setLoading(false)
  }

  const applyStripeScenario = (value: string) => {
    setStripeScenario(value)
    const s = STRIPE_SCENARIOS.find(s => s.value === value)
    if (s && value !== "custom") {
      setStripeAmount(s.amount)
      setStripeDesc(s.desc)
    }
  }

  const applyP2pScenario = (value: string) => {
    setP2pScenario(value)
    const s = P2P_SCENARIOS.find(s => s.value === value)
    if (s && value !== "custom") {
      setP2pAmount(s.amount)
      setP2pVendor(s.vendor)
      setP2pHasPO(s.po)
    }
  }

  const applyO2cScenario = (value: string) => {
    setO2cScenario(value)
    const s = O2C_SCENARIOS.find(s => s.value === value)
    if (s && value !== "custom") {
      setO2cAmount(s.amount)
      setO2cCustomer(s.customer)
      setO2cEmail(s.email)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Workflow Trigger</CardTitle>
        <CardDescription>Select a scenario to simulate an event and run agents end-to-end.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stripe" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stripe">Stripe Payment</TabsTrigger>
            <TabsTrigger value="p2p">P2P Invoice</TabsTrigger>
            <TabsTrigger value="o2c">O2C Sales Order</TabsTrigger>
          </TabsList>

          {/* STRIPE */}
          <TabsContent value="stripe" className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select value={stripeScenario} onValueChange={applyStripeScenario}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STRIPE_SCENARIOS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input type="number" value={stripeAmount} onChange={e => setStripeAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input type="email" value={stripeEmail} onChange={e => setStripeEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={stripeDesc} onChange={e => setStripeDesc(e.target.value)} />
            </div>
            <Button
              onClick={() => handleTrigger("stripe", { amount: stripeAmount, description: stripeDesc, customerEmail: stripeEmail, scenario: stripeScenario })}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Trigger Stripe Workflow
            </Button>
          </TabsContent>

          {/* P2P */}
          <TabsContent value="p2p" className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select value={p2pScenario} onValueChange={applyP2pScenario}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {P2P_SCENARIOS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor Name</Label>
                <Input value={p2pVendor} onChange={e => setP2pVendor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Amount ($)</Label>
                <Input type="number" value={p2pAmount} onChange={e => setP2pAmount(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Purchase Order</Label>
              <Select value={p2pHasPO ? "yes" : "no"} onValueChange={v => setP2pHasPO(v === "yes")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Has matching PO (will match)</SelectItem>
                  <SelectItem value="no">No PO (will flag as disputed)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => handleTrigger("p2p", { vendorName: p2pVendor, amount: p2pAmount, hasPO: p2pHasPO, scenario: p2pScenario })}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Trigger P2P Workflow
            </Button>
          </TabsContent>

          {/* O2C */}
          <TabsContent value="o2c" className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label>Scenario</Label>
              <Select value={o2cScenario} onValueChange={applyO2cScenario}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {O2C_SCENARIOS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input value={o2cCustomer} onChange={e => setO2cCustomer(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <Input type="email" value={o2cEmail} onChange={e => setO2cEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Order Amount ($)</Label>
              <Input type="number" value={o2cAmount} onChange={e => setO2cAmount(e.target.value)} />
            </div>
            <Button
              onClick={() => handleTrigger("o2c", { customerName: o2cCustomer, customerEmail: o2cEmail, amount: o2cAmount, scenario: o2cScenario })}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Trigger O2C Workflow
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
