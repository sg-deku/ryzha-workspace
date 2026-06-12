"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Plug,
  Bot,
  Rocket,
  ChevronRight,
  Check,
  Loader2,
  Building2,
  Cpu,
  Globe,
} from "lucide-react"

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Ryzha",
    description: "Your AI-native financial operating system",
  },
  {
    id: "business",
    title: "Tell us about your business",
    description: "We'll design your financial architecture based on your answers",
  },
  {
    id: "connect",
    title: "Connect your first integration",
    description: "Start pulling data from your financial tools",
  },
  {
    id: "done",
    title: "You're all set",
    description: "Ryzha is now running your financial infrastructure",
  },
]

const BUSINESS_MODELS = [
  { value: "saas", label: "SaaS", icon: "☁️" },
  { value: "marketplace", label: "Marketplace", icon: "🏪" },
  { value: "services", label: "Services", icon: "🤝" },
  { value: "usage_based", label: "Usage-based", icon: "📊" },
  { value: "hybrid", label: "Hybrid", icon: "🔀" },
]

const BILLING_MODELS = [
  { value: "monthly", label: "Monthly subscriptions" },
  { value: "annual", label: "Annual contracts" },
  { value: "usage", label: "Usage-based billing" },
  { value: "milestone", label: "Milestone payments" },
  { value: "blended", label: "Blended / multiple" },
]

const QUICK_CONNECTIONS = [
  { id: "quickbooks", label: "QuickBooks", icon: "QB", color: "bg-green-50 border-green-200 dark:bg-green-950/20" },
  { id: "stripe", label: "Stripe", icon: "S", color: "bg-purple-50 border-purple-200 dark:bg-purple-950/20" },
  { id: "mercury", label: "Mercury", icon: "M", color: "bg-blue-50 border-blue-200 dark:bg-blue-950/20" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [businessModel, setBusinessModel] = React.useState("")
  const [billingModel, setBillingModel] = React.useState("")
  const [companyName, setCompanyName] = React.useState("")

  async function saveArchitecture() {
    if (!businessModel || !billingModel) return
    setSaving(true)
    try {
      await fetch("/api/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessModel,
          billingModel,
          revenueRecognition: {
            standard: "ASC_606",
            defaultPolicy: billingModel === "annual" ? "ratable" : "point_in_time",
            defaultTermMonths: billingModel === "annual" ? 12 : 1,
          },
          departmentStructure: {
            departments: ["Engineering", "Sales", "Marketing", "G&A", "Operations"],
          },
          metricsDefinitions: {
            arrFormula: "MRR * 12",
            churnDefinition: "subscription_cancelled",
            ltvMethod: "cohort_average",
          },
          dataFlowMap: {},
          entities: [{ name: "Primary Entity", currency: "USD" }],
        }),
      })
    } catch {}
    setSaving(false)
    setStep(2)
  }

  function goToConnect() {
    router.push("/connect")
  }

  function finish() {
    router.push("/overview")
  }

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 text-2xl font-bold mb-1">
            <Rocket className="h-6 w-6 text-primary" />
            Ryzha
          </div>
          <p className="text-xs text-muted-foreground">Financial Architecture as a Service</p>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
            <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border bg-card shadow-sm p-8">
          {step === 0 && (
            <div className="text-center space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentStep.title}</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Ryzha connects your 15–25 financial tools into a single source of truth -
                  reconciled continuously by AI, so your finance team focuses on strategy, not spreadsheets.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                {[
                  { icon: <Plug className="h-5 w-5 mx-auto mb-1 text-primary" />, label: "Connect 50+ tools" },
                  { icon: <Cpu className="h-5 w-5 mx-auto mb-1 text-primary" />, label: "AI reconciliation" },
                  { icon: <Globe className="h-5 w-5 mx-auto mb-1 text-primary" />, label: "Real-time reports" },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl border bg-muted/30 p-3">
                    {item.icon}
                    <p className="font-medium text-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Get started <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">{currentStep.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{currentStep.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">Business model</label>
                <div className="grid grid-cols-3 gap-2">
                  {BUSINESS_MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setBusinessModel(m.value)}
                      className={`rounded-lg border p-3 text-center text-sm transition-colors ${
                        businessModel === m.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div className="text-lg mb-0.5">{m.icon}</div>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium block mb-2">How do you bill customers?</label>
                <div className="space-y-2">
                  {BILLING_MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setBillingModel(m.value)}
                      className={`w-full flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm text-left transition-colors ${
                        billingModel === m.value
                          ? "border-primary bg-primary/5 text-primary font-medium"
                          : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${
                          billingModel === m.value ? "border-primary bg-primary" : "border-muted-foreground/40"
                        }`}
                      >
                        {billingModel === m.value && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                disabled={!businessModel || !billingModel || saving}
                onClick={saveArchitecture}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {saving ? "Setting up your architecture…" : "Continue"}
                {!saving && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">{currentStep.title}</h2>
                <p className="text-muted-foreground text-sm mt-1">{currentStep.description}</p>
              </div>

              <div className="space-y-2">
                {QUICK_CONNECTIONS.map((conn) => (
                  <div
                    key={conn.id}
                    className={`flex items-center gap-4 rounded-xl border p-4 ${conn.color}`}
                  >
                    <div className="h-9 w-9 rounded-lg bg-white dark:bg-background border flex items-center justify-center text-sm font-bold shrink-0">
                      {conn.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{conn.label}</p>
                      <p className="text-xs text-muted-foreground">Connect in Connections page</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-muted/40 transition-colors"
                >
                  Skip for now
                </button>
                <button
                  onClick={goToConnect}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plug className="h-4 w-4" /> Go to Connections
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentStep.title}</h2>
                <p className="text-muted-foreground mt-2 text-sm">
                  Your financial architecture is configured. AI agents will start reconciling data
                  as you connect your tools. Month-end close will never take 3 weeks again.
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4 text-left space-y-2">
                {[
                  "Architecture designed based on your business model",
                  "Revenue recognition policy applied (ASC 606)",
                  "AI agents ready to reconcile incoming data",
                  "Real-time dashboard available",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={finish}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
