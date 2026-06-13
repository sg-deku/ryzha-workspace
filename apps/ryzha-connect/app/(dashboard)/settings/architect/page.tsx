"use client"

import * as React from "react"
import { CheckCircle2, Loader2, AlertCircle, Cpu, ChevronRight, ChevronLeft, Plus, Trash2, Sparkles, Send, Bot, User, ArrowLeft, Zap, ExternalLink } from "lucide-react"
import Link from "next/link"

interface FormState {
  businessModel: string
  billingModel: string
  accountingStandard: string
  revenueRecognitionPolicy: string
  defaultTermMonths: string
  accountingSystem: string
  revenueSource: string
  payrollSource: string
  expenseSource: string
  departments: string[]
  entities: { name: string; currency: string }[]
}

const STEPS = [
  { id: "business", label: "Business Model" },
  { id: "billing", label: "Billing & Revenue" },
  { id: "datasources", label: "Data Sources" },
  { id: "departments", label: "Departments" },
  { id: "entities", label: "Legal Entities" },
]

const BUSINESS_MODELS = [
  { value: "saas", label: "SaaS", desc: "Recurring subscription software" },
  { value: "marketplace", label: "Marketplace", desc: "Platform connecting buyers and sellers" },
  { value: "services", label: "Professional Services", desc: "Billed by hours or milestones" },
  { value: "usage_based", label: "Usage-Based", desc: "Pay-per-use or consumption model" },
  { value: "hybrid", label: "Hybrid", desc: "Combination of the above" },
]

const BILLING_MODELS = [
  { value: "annual", label: "Annual contracts" },
  { value: "monthly", label: "Monthly subscriptions" },
  { value: "usage", label: "Usage / metered" },
  { value: "milestone", label: "Milestone-based" },
  { value: "blended", label: "Blended" },
]

const ACCOUNTING_STANDARDS = [
  { value: "ASC606", label: "US GAAP - ASC 606" },
  { value: "IFRS15", label: "IFRS 15" },
]

const REV_REC_POLICIES = [
  { value: "ratable", label: "Ratably over contract term", desc: "Revenue recognised evenly over the subscription period (most common for SaaS)" },
  { value: "point_in_time", label: "Point in time", desc: "Revenue recognised at the moment of delivery (services, one-time)" },
  { value: "milestone", label: "Milestone-based", desc: "Revenue recognised as contractual milestones are met" },
]

const SOURCES = [
  { value: "stripe", label: "Stripe" },
  { value: "chargebee", label: "Chargebee" },
  { value: "paddle", label: "Paddle" },
  { value: "manual", label: "Manual / Other" },
]

const PAYROLL_SOURCES = [
  { value: "gusto", label: "Gusto" },
  { value: "rippling", label: "Rippling" },
  { value: "deel", label: "Deel" },
  { value: "adp", label: "ADP" },
  { value: "manual", label: "Manual / Other" },
]

const EXPENSE_SOURCES = [
  { value: "ramp", label: "Ramp" },
  { value: "brex", label: "Brex" },
  { value: "divvy", label: "Divvy" },
  { value: "expensify", label: "Expensify" },
  { value: "manual", label: "Manual / Other" },
]

const ACCOUNTING_SYSTEMS = [
  { value: "quickbooks", label: "QuickBooks Online" },
  { value: "xero", label: "Xero" },
  { value: "netsuite", label: "NetSuite" },
  { value: "sage", label: "Sage Intacct" },
]

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "SGD", "JPY", "INR"]

const DEFAULT_DEPARTMENTS = ["Engineering", "Sales", "Marketing", "Customer Success", "G&A", "Finance", "HR", "Operations"]

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

function AIInterviewPanel({
  onComplete,
  onBack,
}: {
  onComplete: (formData: FormState) => void
  onBack: () => void
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [started, setStarted] = React.useState(false)
  const bottomRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  async function sendMessage(userMsg?: string) {
    const content = userMsg ?? input.trim()
    if (!content && started) return

    const newMessages: ChatMessage[] = started
      ? [...messages, { role: "user" as const, content }]
      : messages

    setMessages(newMessages)
    setInput("")
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/agents/architect/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Interview failed")

      if (json.done && json.formData) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Your financial architecture has been configured. Review the settings below and click Save Architecture to apply them." },
        ])
        setTimeout(() => onComplete(json.formData), 800)
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: json.message }])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
      setStarted(true)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Manual setup
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden flex flex-col" style={{ height: "480px" }}>
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bot className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold">Ryzha AI Architect</p>
            <p className="text-[11px] text-muted-foreground">Interviews you to build your financial architecture</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="status-dot-green" />
            <span className="text-[11px] text-muted-foreground">Online</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {!started && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="flex-1 bg-muted/40 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
                <p className="text-sm leading-relaxed">
                  Hi! I'm Ryzha's AI Architect. I'll ask you a few questions about your business to configure your financial architecture — chart of accounts, revenue recognition policy, and data flow map.
                </p>
                <p className="text-sm leading-relaxed mt-2">
                  This usually takes about 2 minutes. Let's start — <strong>what type of business do you run?</strong> (e.g. SaaS, marketplace, professional services, usage-based, or a mix)
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === "user" ? "bg-primary" : "bg-primary/10"}`}>
                {msg.role === "user"
                  ? <User className="h-3.5 w-3.5 text-primary-foreground" />
                  : <Bot className="h-3.5 w-3.5 text-primary" />}
              </div>
              <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-sm"
                  : "bg-muted/40 rounded-tl-sm"
              }`}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="bg-muted/40 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {error} — check your AI provider is configured in Settings → AI.
          </div>
        )}

        <div className="border-t p-3 flex gap-2">
          {!started ? (
            <button
              type="button"
              onClick={() => sendMessage("Start the interview")}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg py-2.5 hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Start AI Interview
            </button>
          ) : (
            <>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                placeholder="Your answer…"
                disabled={loading}
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-primary/40"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-60 shrink-0"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ArchitectPage() {
  const [mode, setMode] = React.useState<"manual" | "ai">("manual")
  const [aiCompleted, setAICompleted] = React.useState(false)
  const [step, setStep] = React.useState(0)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [alerts, setAlerts] = React.useState<Array<{ id: string; severity: string; title: string; description: string; action: string; actionHref: string }>>([])
  const [dismissedAlerts, setDismissedAlerts] = React.useState<Set<string>>(new Set())

  const [form, setForm] = React.useState<FormState>({
    businessModel: "saas",
    billingModel: "monthly",
    accountingStandard: "ASC606",
    revenueRecognitionPolicy: "ratable",
    defaultTermMonths: "12",
    accountingSystem: "quickbooks",
    revenueSource: "stripe",
    payrollSource: "gusto",
    expenseSource: "ramp",
    departments: ["Engineering", "Sales", "Marketing", "G&A"],
    entities: [{ name: "Primary Entity", currency: "USD" }],
  })

  React.useEffect(() => {
    Promise.all([
      fetch("/api/settings/architect").then((r) => r.json()),
      fetch("/api/settings/architect-alerts").then((r) => r.json()).catch(() => []),
    ]).then(([data, alertData]) => {
        if (data?.businessModel) {
          const arch = data
          setForm((f) => ({
            ...f,
            businessModel: arch.businessModel ?? f.businessModel,
            billingModel: arch.billingModel ?? f.billingModel,
            accountingStandard: (arch.revenueRecognition as any)?.standard ?? f.accountingStandard,
            revenueRecognitionPolicy: (arch.revenueRecognition as any)?.defaultPolicy ?? f.revenueRecognitionPolicy,
            defaultTermMonths: String((arch.revenueRecognition as any)?.defaultTermMonths ?? 12),
            accountingSystem: (arch.dataFlowMap as any)?.accountingSystem ?? f.accountingSystem,
            revenueSource: (arch.dataFlowMap as any)?.revenue ?? f.revenueSource,
            payrollSource: (arch.dataFlowMap as any)?.payroll ?? f.payrollSource,
            expenseSource: (arch.dataFlowMap as any)?.expenses ?? f.expenseSource,
            departments: (arch.departmentStructure as any)?.departments?.length > 0
              ? (arch.departmentStructure as any).departments
              : f.departments,
            entities: (arch.entities as any)?.length > 0 ? (arch.entities as any) : f.entities,
          }))
        }
        if (Array.isArray(alertData)) setAlerts(alertData)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function set(key: keyof FormState, value: any) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/settings/architect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          defaultTermMonths: parseInt(form.defaultTermMonths, 10),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? "Save failed")
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  function handleAIComplete(formData: FormState) {
    setForm((f) => ({
      ...f,
      ...formData,
      defaultTermMonths: String(formData.defaultTermMonths ?? f.defaultTermMonths),
    }))
    setAICompleted(true)
    setMode("manual")
    setStep(0)
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Cpu className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Financial Architecture</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Ryzha's Architect Agent uses this configuration to apply the correct revenue recognition policy, GL coding rules, and metrics definitions to every financial event.
            </p>
          </div>
        </div>
        {mode === "manual" && (
          <button
            type="button"
            onClick={() => { setMode("ai"); setAICompleted(false) }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted/60 transition-colors shrink-0"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            AI Interview
          </button>
        )}
      </div>

      {aiCompleted && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/40 p-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">Architecture configured by AI</p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-500 mt-0.5">Review each section below and click Save Architecture when ready.</p>
          </div>
        </div>
      )}

      {alerts.filter((a) => !dismissedAlerts.has(a.id)).map((alert) => {
        const severityStyle = alert.severity === "HIGH"
          ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/20"
          : alert.severity === "MEDIUM"
          ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20"
          : "border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20"
        const iconStyle = alert.severity === "HIGH"
          ? "text-red-500"
          : alert.severity === "MEDIUM"
          ? "text-amber-500"
          : "text-blue-500"
        return (
          <div key={alert.id} className={`flex items-start gap-3 rounded-xl border p-4 ${severityStyle}`}>
            <Zap className={`h-4 w-4 shrink-0 mt-0.5 ${iconStyle}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{alert.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{alert.description}</p>
              <Link href={alert.actionHref} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-2">
                {alert.action} <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <button
              onClick={() => setDismissedAlerts((s) => new Set([...s, alert.id]))}
              className="text-muted-foreground hover:text-foreground text-xs shrink-0 px-2 py-0.5 rounded hover:bg-muted/50"
            >
              ✕
            </button>
          </div>
        )
      })}

      {mode === "ai" ? (
        <AIInterviewPanel
          onComplete={handleAIComplete}
          onBack={() => setMode("manual")}
        />
      ) : (
      <>

      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <button
              onClick={() => setStep(i)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors shrink-0 ${
                i === step ? "bg-primary text-primary-foreground" : i < step ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"
              }`}
            >
              {i < step && <CheckCircle2 className="h-3 w-3" />}
              {s.label}
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
          </React.Fragment>
        ))}
      </div>

      <div className="rounded-xl border bg-card p-6">
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold mb-1">What is your business model?</p>
              <p className="text-xs text-muted-foreground mb-4">This determines how the Architect Agent structures your Chart of Accounts and revenue streams.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUSINESS_MODELS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set("businessModel", m.value)}
                    className={`flex flex-col text-left p-4 rounded-xl border transition-all ${form.businessModel === m.value ? "border-primary bg-primary/5" : "hover:border-primary/30 hover:bg-muted/30"}`}
                  >
                    <p className="font-medium text-sm">{m.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">What accounting standard applies?</p>
              <div className="flex gap-3">
                {ACCOUNTING_STANDARDS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => set("accountingStandard", s.value)}
                    className={`flex-1 py-2.5 px-4 rounded-lg border text-sm font-medium transition-all ${form.accountingStandard === s.value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/30"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Your accounting system</p>
              <select
                value={form.accountingSystem}
                onChange={(e) => set("accountingSystem", e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                {ACCOUNTING_SYSTEMS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold mb-1">How do you bill customers?</p>
              <p className="text-xs text-muted-foreground mb-4">Determines the billing cycle used for MRR/ARR calculation.</p>
              <div className="flex flex-wrap gap-2">
                {BILLING_MODELS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => set("billingModel", m.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${form.billingModel === m.value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/30"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-1">Revenue recognition policy</p>
              <p className="text-xs text-muted-foreground mb-4">This is applied by the Revenue Agent to every Stripe payment. Overrides can be configured per contract type.</p>
              <div className="space-y-3">
                {REV_REC_POLICIES.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("revenueRecognitionPolicy", p.value)}
                    className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${form.revenueRecognitionPolicy === p.value ? "border-primary bg-primary/5" : "hover:border-primary/30 hover:bg-muted/30"}`}
                  >
                    <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.revenueRecognitionPolicy === p.value ? "border-primary" : "border-muted-foreground/30"}`}>
                      {form.revenueRecognitionPolicy === p.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {form.revenueRecognitionPolicy === "ratable" && (
              <div>
                <p className="text-sm font-medium mb-2">Default contract term (months)</p>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={form.defaultTermMonths}
                  onChange={(e) => set("defaultTermMonths", e.target.value)}
                  className="w-32 rounded-lg border bg-background px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Used when no contract term is specified on the payment event.</p>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <p className="font-semibold">Which tools own which financial data?</p>
            <p className="text-xs text-muted-foreground -mt-2">Ryzha uses this to route events correctly and reconcile across systems.</p>

            {[
              { label: "Revenue / Billing", key: "revenueSource" as const, options: SOURCES },
              { label: "Payroll", key: "payrollSource" as const, options: PAYROLL_SOURCES },
              { label: "Expenses / Corporate Cards", key: "expenseSource" as const, options: EXPENSE_SOURCES },
            ].map(({ label, key, options }) => (
              <div key={key}>
                <p className="text-sm font-medium mb-2">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {options.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => set(key, o.value)}
                      className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${form[key] === o.value ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/30"}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold mb-1">Department / Cost Centre Structure</p>
              <p className="text-xs text-muted-foreground mb-4">Ryzha uses these to allocate costs and build department-level P&L.</p>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {DEFAULT_DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const current = form.departments
                    const next = current.includes(d) ? current.filter((x) => x !== d) : [...current, d]
                    set("departments", next)
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${form.departments.includes(d) ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted/30"}`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {form.departments.filter((d) => !DEFAULT_DEPARTMENTS.includes(d)).map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm bg-muted/40 rounded-lg px-3 py-2 border">{d}</span>
                  <button
                    type="button"
                    onClick={() => set("departments", form.departments.filter((x) => x !== d))}
                    className="text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const name = prompt("Department name:")
                  if (name?.trim()) set("departments", [...form.departments, name.trim()])
                }}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" /> Add custom department
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <p className="font-semibold mb-1">Legal Entities</p>
              <p className="text-xs text-muted-foreground mb-4">Multi-entity support. Each entity can operate in its own currency. Ryzha handles intercompany eliminations and FX revaluation automatically.</p>
            </div>
            <div className="space-y-3">
              {form.entities.map((entity, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-xl border">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={entity.name}
                      onChange={(e) => {
                        const next = [...form.entities]
                        next[i] = { ...next[i], name: e.target.value }
                        set("entities", next)
                      }}
                      placeholder="Entity name (e.g. Ryzha Inc)"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <select
                    value={entity.currency}
                    onChange={(e) => {
                      const next = [...form.entities]
                      next[i] = { ...next[i], currency: e.target.value }
                      set("entities", next)
                    }}
                    className="rounded-lg border bg-background px-3 py-2 text-sm w-24"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {form.entities.length > 1 && (
                    <button
                      type="button"
                      onClick={() => set("entities", form.entities.filter((_, idx) => idx !== i))}
                      className="text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => set("entities", [...form.entities, { name: "", currency: "USD" }])}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" /> Add entity
              </button>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600">
              <CheckCircle2 className="h-4 w-4" /> Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Save Architecture
          </button>
          {step < STEPS.length - 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-2 border text-sm font-medium rounded-lg px-4 py-2 hover:bg-muted transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      </>
      )}
    </div>
  )
}
