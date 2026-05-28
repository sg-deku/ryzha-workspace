"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ArrowRight,
  ArrowDown,
  Brain,
  Zap,
  ShoppingCart,
  FileText,
  CreditCard,
  Banknote,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Webhook,
  Building,
  Users,
  BarChart3,
  BookOpen,
  Activity,
  Layers,
  GitBranch,
  DollarSign,
  Receipt,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

type DbField = { name: string; type: string; pk?: boolean; fk?: boolean; note?: string }
type DbEntity = {
  name: string; cardinality: string; desc: string
  dotColor: string; borderColor: string; bgColor: string; textColor: string
  fields: DbField[]; children?: DbEntity[]
}

const DB_SCHEMA: DbEntity[] = [
  {
    name: "Organization", cardinality: "root", desc: "Multi-tenant root — every record is scoped to an org",
    dotColor: "bg-primary", borderColor: "border-primary/20", bgColor: "bg-primary/5", textColor: "text-primary",
    fields: [
      { name: "id", type: "String", pk: true }, { name: "name", type: "String" },
      { name: "slug", type: "String @unique" }, { name: "plan", type: "Plan", note: "FREE | PRO | ENTERPRISE" },
      { name: "currency", type: "String", note: "default: USD" }, { name: "taxId", type: "String?" },
      { name: "defaultTaxRate", type: "Float" }, { name: "onboardingCompleted", type: "Boolean" },
    ],
    children: [
      {
        name: "FinancialSettings", cardinality: "1:1", desc: "Stripe, ElevenLabs, Twilio, AI config, audit policy",
        dotColor: "bg-blue-500", borderColor: "border-blue-200 dark:border-blue-800", bgColor: "bg-blue-50/50 dark:bg-blue-950/20", textColor: "text-blue-700 dark:text-blue-400",
        fields: [
          { name: "stripeSecretKey", type: "String?" }, { name: "stripeWebhookSecret", type: "String?" },
          { name: "bankBalance", type: "Float", note: "manual seed" }, { name: "deferralPeriodMonths", type: "Int", note: "default: 12" },
          { name: "deferredRevenueRules", type: "Json", note: '["annual","subscription"]' },
          { name: "anomalyThreshold", type: "Float", note: "default: 50000" },
          { name: "requireAuditSeal", type: "Boolean" }, { name: "autoRejectUnverified", type: "Boolean" },
          { name: "elevenLabsApiKey", type: "String?" }, { name: "twilioAccountSid", type: "String?" },
          { name: "targetMonthlyRevenue", type: "Float" }, { name: "aiModel", type: "String", note: "configurable (default: Groq)" },
          { name: "emailProvider", type: "String?", note: "smtp | sendgrid | resend" },
        ],
        children: [],
      },
      {
        name: "FinancialSnapshot", cardinality: "1:1", desc: "Live FP&A metrics — updated after every transaction",
        dotColor: "bg-indigo-500", borderColor: "border-indigo-200 dark:border-indigo-800", bgColor: "bg-indigo-50/50 dark:bg-indigo-950/20", textColor: "text-indigo-700 dark:text-indigo-400",
        fields: [
          { name: "bankBalance", type: "Float" }, { name: "averageMonthlyExpenses", type: "Float" },
          { name: "runwayMonths", type: "Float" }, { name: "zeroCashDate", type: "DateTime" },
        ],
        children: [],
      },
      {
        name: "Customer", cardinality: "1:N", desc: "O2C — buyer entity, credit-limit gated",
        dotColor: "bg-violet-500", borderColor: "border-violet-200 dark:border-violet-800", bgColor: "bg-violet-50/50 dark:bg-violet-950/20", textColor: "text-violet-700 dark:text-violet-400",
        fields: [
          { name: "name", type: "String" }, { name: "email", type: "String?" },
          { name: "creditLimit", type: "Float", note: "default: 5000" }, { name: "paymentTerms", type: "String", note: "default: NET30" },
          { name: "status", type: "String", note: "ACTIVE | FLAGGED" }, { name: "taxId", type: "String?" },
        ],
        children: [
          {
            name: "SalesOrder", cardinality: "1:N", desc: "O2C order — validated by O2C agent before invoicing",
            dotColor: "bg-violet-400", borderColor: "border-violet-200 dark:border-violet-800", bgColor: "bg-violet-50/30 dark:bg-violet-950/10", textColor: "text-violet-600 dark:text-violet-400",
            fields: [
              { name: "orderNumber", type: "String @unique" }, { name: "totalAmount", type: "Float" },
              { name: "status", type: "String", note: "DRAFT|APPROVED|INVOICED|PAID" },
              { name: "workflowStatus", type: "String?" }, { name: "invoiceId", type: "String?", fk: true },
              { name: "agentLogs", type: "Json", note: "[]" },
            ],
            children: [
              {
                name: "Invoice", cardinality: "1:1 (via invoiceId)", desc: "AR document — status drives the O2C lifecycle",
                dotColor: "bg-violet-300", borderColor: "border-violet-200 dark:border-violet-800", bgColor: "bg-violet-50/20", textColor: "text-violet-500 dark:text-violet-300",
                fields: [
                  { name: "invoiceNumber", type: "String" }, { name: "issueDate", type: "DateTime" },
                  { name: "dueDate", type: "DateTime" }, { name: "total", type: "Float" },
                  { name: "status", type: "InvoiceStatus", note: "DRAFT→SENT→PAID" },
                  { name: "clientName / clientEmail", type: "String" }, { name: "pdfUrl", type: "String?" },
                ],
                children: [
                  {
                    name: "InvoiceLineItem", cardinality: "1:N", desc: "Line items — qty × unitPrice + tax",
                    dotColor: "bg-slate-400", borderColor: "border-slate-200 dark:border-slate-700", bgColor: "bg-slate-50/50 dark:bg-slate-900/20", textColor: "text-slate-600 dark:text-slate-400",
                    fields: [
                      { name: "description", type: "String" }, { name: "quantity", type: "Float" },
                      { name: "unitPrice", type: "Float" }, { name: "taxRate", type: "Float" },
                      { name: "amount", type: "Float" }, { name: "invoiceId", type: "String", fk: true },
                    ],
                    children: [],
                  },
                  {
                    name: "Payment", cardinality: "1:N", desc: "Cash receipt against invoice — links to Stripe transaction",
                    dotColor: "bg-green-500", borderColor: "border-green-200 dark:border-green-800", bgColor: "bg-green-50/50 dark:bg-green-950/20", textColor: "text-green-700 dark:text-green-400",
                    fields: [
                      { name: "amount", type: "Float" }, { name: "paymentDate", type: "DateTime" },
                      { name: "method", type: "String", note: "bank_transfer | stripe" },
                      { name: "referenceNumber", type: "String?" },
                      { name: "transactionId", type: "String?", fk: true }, { name: "invoiceId", type: "String", fk: true },
                    ],
                    children: [],
                  },
                  {
                    name: "CreditNote", cardinality: "1:N", desc: "Revenue reversal — posts DR Revenue / CR AR",
                    dotColor: "bg-purple-500", borderColor: "border-purple-200 dark:border-purple-800", bgColor: "bg-purple-50/50 dark:bg-purple-950/20", textColor: "text-purple-700 dark:text-purple-400",
                    fields: [
                      { name: "amount", type: "Float" }, { name: "reason", type: "String" },
                      { name: "reasonCategory", type: "String" }, { name: "refundMethod", type: "String?" },
                      { name: "transactionId", type: "String?", fk: true }, { name: "invoiceId", type: "String", fk: true },
                    ],
                    children: [],
                  },
                  {
                    name: "Transaction", cardinality: "1:N", desc: "Stripe payment event — drives all 6 agent pipelines",
                    dotColor: "bg-yellow-500", borderColor: "border-yellow-200 dark:border-yellow-800", bgColor: "bg-yellow-50/50 dark:bg-yellow-950/20", textColor: "text-yellow-700 dark:text-yellow-500",
                    fields: [
                      { name: "stripePaymentIntentId", type: "String @unique" }, { name: "amount", type: "Float" },
                      { name: "stripeFee", type: "Float?", note: "2.9% + $0.30" }, { name: "fxFee", type: "Float?", note: "extra 1% intl" },
                      { name: "clearingStatus", type: "String", note: "pending | paid_out" },
                      { name: "revenueRecognitionType", type: "String", note: "immediate | deferred" },
                      { name: "recognizedRevenue", type: "Float?" }, { name: "deferredRevenue", type: "Float?" },
                      { name: "auditStatus", type: "String", note: "pending|verified|flagged|rejected" },
                      { name: "auditHash", type: "String?" }, { name: "runwayMonths", type: "Float?" },
                      { name: "zeroCashDate", type: "DateTime?" }, { name: "percentAhead", type: "Float?" },
                      { name: "agentLogs", type: "Json" }, { name: "workflowStatus", type: "String", note: "pending|running|completed" },
                    ],
                    children: [
                      {
                        name: "GeneralLedgerEntry", cardinality: "1:N", desc: "Double-entry GL row — accountType + debit/credit",
                        dotColor: "bg-cyan-500", borderColor: "border-cyan-200 dark:border-cyan-800", bgColor: "bg-cyan-50/50 dark:bg-cyan-950/20", textColor: "text-cyan-700 dark:text-cyan-400",
                        fields: [
                          { name: "date", type: "DateTime" }, { name: "accountType", type: "String", note: "Revenue|Asset|Expense" },
                          { name: "accountName", type: "String", note: '"Accounts Receivable"' },
                          { name: "debit", type: "Float" }, { name: "credit", type: "Float" },
                          { name: "sourceType", type: "String" }, { name: "sourceId", type: "String" },
                        ],
                        children: [],
                      },
                      {
                        name: "DeferredRevenueSchedule", cardinality: "1:N", desc: "ASC 606 monthly release schedule — N rows per deferred transaction",
                        dotColor: "bg-teal-500", borderColor: "border-teal-200 dark:border-teal-800", bgColor: "bg-teal-50/50 dark:bg-teal-950/20", textColor: "text-teal-700 dark:text-teal-400",
                        fields: [
                          { name: "period", type: "DateTime", note: "first day of recognition month" },
                          { name: "amount", type: "Float", note: "total / deferralMonths" },
                          { name: "recognized", type: "Boolean" }, { name: "recognizedAt", type: "DateTime?" },
                          { name: "glEntryId", type: "String?", fk: true }, { name: "transactionId", type: "String", fk: true },
                        ],
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Vendor", cardinality: "1:N", desc: "P2P — supplier entity, payment-terms gated",
        dotColor: "bg-orange-500", borderColor: "border-orange-200 dark:border-orange-800", bgColor: "bg-orange-50/50 dark:bg-orange-950/20", textColor: "text-orange-700 dark:text-orange-400",
        fields: [
          { name: "name", type: "String" }, { name: "email", type: "String?" },
          { name: "taxId", type: "String?" }, { name: "paymentTerms", type: "String", note: "default: NET30" },
          { name: "status", type: "String", note: "ACTIVE | INACTIVE" },
        ],
        children: [
          {
            name: "PurchaseOrder", cardinality: "1:N", desc: "P2P purchase order — approved before vendor invoice matching",
            dotColor: "bg-orange-400", borderColor: "border-orange-200 dark:border-orange-800", bgColor: "bg-orange-50/30 dark:bg-orange-950/10", textColor: "text-orange-600 dark:text-orange-400",
            fields: [
              { name: "poNumber", type: "String @unique" }, { name: "totalAmount", type: "Float" },
              { name: "status", type: "String", note: "DRAFT|PENDING_APPROVAL|APPROVED|REJECTED" },
              { name: "paymentTerms", type: "String" }, { name: "vendorId", type: "String", fk: true },
            ],
            children: [
              {
                name: "PurchaseOrderLine", cardinality: "1:N", desc: "PO line item — description, qty, unit price",
                dotColor: "bg-slate-400", borderColor: "border-slate-200 dark:border-slate-700", bgColor: "bg-slate-50/50 dark:bg-slate-900/20", textColor: "text-slate-600 dark:text-slate-400",
                fields: [
                  { name: "description", type: "String" }, { name: "quantity", type: "Float" },
                  { name: "unitPrice", type: "Float" }, { name: "amount", type: "Float" },
                  { name: "purchaseOrderId", type: "String", fk: true },
                ],
                children: [],
              },
            ],
          },
          {
            name: "VendorInvoice", cardinality: "1:N", desc: "Vendor-issued invoice — 3-way matched before GL coding",
            dotColor: "bg-amber-500", borderColor: "border-amber-200 dark:border-amber-800", bgColor: "bg-amber-50/50 dark:bg-amber-950/20", textColor: "text-amber-700 dark:text-amber-400",
            fields: [
              { name: "invoiceNumber", type: "String" }, { name: "totalAmount", type: "Float" },
              { name: "status", type: "String", note: "PENDING|MATCHED|DISPUTED|APPROVED" },
              { name: "dueDate", type: "DateTime" },
              { name: "vendorId", type: "String", fk: true }, { name: "purchaseOrderId", type: "String?", fk: true },
            ],
            children: [],
          },
        ],
      },
      {
        name: "Expense", cardinality: "1:N", desc: "Operating expense — categorized and anomaly-scanned by Auditor",
        dotColor: "bg-rose-500", borderColor: "border-rose-200 dark:border-rose-800", bgColor: "bg-rose-50/50 dark:bg-rose-950/20", textColor: "text-rose-700 dark:text-rose-400",
        fields: [
          { name: "date", type: "DateTime" }, { name: "description", type: "String" },
          { name: "amount", type: "Float" }, { name: "category", type: "String?" },
          { name: "status", type: "ExpenseStatus", note: "PENDING→APPROVED→PAID" }, { name: "taxRelevant", type: "Boolean?" },
        ],
        children: [
          {
            name: "ExpenseAnomaly", cardinality: "1:N", desc: "Anomaly flag generated by Auditor agent",
            dotColor: "bg-red-400", borderColor: "border-red-200 dark:border-red-800", bgColor: "bg-red-50/50 dark:bg-red-950/20", textColor: "text-red-600 dark:text-red-400",
            fields: [
              { name: "reason", type: "String" }, { name: "severity", type: "String", note: "LOW | MEDIUM | HIGH" },
              { name: "expenseId", type: "String", fk: true },
            ],
            children: [],
          },
        ],
      },
      {
        name: "Contract", cardinality: "1:N", desc: "Signed contract — Auditor matches by stripePaymentIntentId for SHA-256 hash",
        dotColor: "bg-slate-500", borderColor: "border-slate-200 dark:border-slate-700", bgColor: "bg-slate-50/50 dark:bg-slate-900/20", textColor: "text-slate-600 dark:text-slate-400",
        fields: [
          { name: "stripePaymentIntentId", type: "String @unique" }, { name: "customerEmail", type: "String" },
          { name: "amount", type: "Float" }, { name: "status", type: "String", note: "signed | pending" },
          { name: "startDate / endDate", type: "DateTime?" },
        ],
        children: [],
      },
      {
        name: "BankTransaction", cardinality: "1:N", desc: "Bank feed import — reconciled against GL Stripe Clearing",
        dotColor: "bg-emerald-500", borderColor: "border-emerald-200 dark:border-emerald-800", bgColor: "bg-emerald-50/50 dark:bg-emerald-950/20", textColor: "text-emerald-700 dark:text-emerald-400",
        fields: [
          { name: "date", type: "DateTime" }, { name: "amount", type: "Float" },
          { name: "description", type: "String?" },
          { name: "reconciliationStatus", type: "String", note: "PENDING|MATCHED|UNMATCHED" },
          { name: "paymentId", type: "String?", fk: true },
        ],
        children: [],
      },
      {
        name: "AIUsageLog", cardinality: "1:N", desc: "Tracks every LLM call — model, tokens, cost per agent",
        dotColor: "bg-pink-500", borderColor: "border-pink-200 dark:border-pink-800", bgColor: "bg-pink-50/50 dark:bg-pink-950/20", textColor: "text-pink-700 dark:text-pink-400",
        fields: [
          { name: "agentType", type: "String", note: "agent_r2r | agent_om | ..." },
          { name: "model", type: "String" }, { name: "promptTokens", type: "Int" },
          { name: "completionTokens", type: "Int" }, { name: "cost", type: "Float?" },
        ],
        children: [],
      },
    ],
  },
]

function DbNode({ entity, depth = 0 }: { entity: DbEntity; depth?: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={cn(depth > 0 && "ml-4")}>
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 w-full text-left rounded-md px-2 py-1.5 hover:bg-muted/50 transition-colors"
      >
        <div className={cn("h-2.5 w-2.5 rounded-full flex-shrink-0", entity.dotColor)} />
        <span className={cn("font-mono font-semibold text-xs", entity.textColor)}>{entity.name}</span>
        <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{entity.cardinality}</span>
        <span className="text-[10px] text-muted-foreground flex-1">{entity.desc}</span>
        <ChevronRight className={cn("h-3.5 w-3.5 flex-shrink-0 transition-transform duration-150 text-muted-foreground", open && "rotate-90")} />
      </button>
      {open && (
        <div className="ml-5 border-l-2 border-border/40 pl-3 mt-0.5 pb-1.5 space-y-1">
          <div className={cn("rounded-md border p-2.5 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-1", entity.borderColor, entity.bgColor)}>
            {entity.fields.map(f => (
              <div key={f.name} className="flex items-baseline gap-1.5 text-[11px]">
                {f.pk && <span className="text-[9px] font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 px-1 rounded flex-shrink-0">PK</span>}
                {f.fk && <span className="text-[9px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-1 rounded flex-shrink-0">FK</span>}
                <span className="font-mono text-foreground/80 font-medium">{f.name}</span>
                <span className="text-muted-foreground/60 font-mono text-[10px]">{f.type}</span>
                {f.note && <span className="text-muted-foreground/40 italic text-[10px]">{f.note}</span>}
              </div>
            ))}
          </div>
          {entity.children?.map(child => <DbNode key={child.name} entity={child} depth={depth + 1} />)}
        </div>
      )}
    </div>
  )
}

const SECTIONS = [
  { id: "overview", label: "System Overview", icon: BookOpen },
  { id: "stripe", label: "Stripe Payment Lifecycle", icon: CreditCard },
  { id: "o2c", label: "Order-to-Cash (O2C)", icon: FileText },
  { id: "p2p", label: "Procure-to-Pay (P2P)", icon: ShoppingCart },
  { id: "r2r", label: "Record-to-Report (R2R)", icon: RefreshCw },
  { id: "fpna", label: "FP&A Module", icon: TrendingUp },
  { id: "agents", label: "AI Agents", icon: Brain },
  { id: "journal-entries", label: "Journal Entries", icon: BookOpen },
  { id: "integrations", label: "Integrations", icon: Webhook },
  { id: "schema", label: "Data Model", icon: Database },
]

function FlowStep({ step, title, description, badge, badgeVariant = "default", isLast = false }: {
  step: number | string
  title: string
  description: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  isLast?: boolean
}) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold flex-shrink-0">
          {step}
        </div>
        {!isLast && <div className="w-px flex-1 bg-border mt-2 min-h-[2rem]" />}
      </div>
      <div className="pb-6 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold">{title}</span>
          {badge && <Badge variant={badgeVariant} className="text-xs">{badge}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

function JournalEntry({ debit, credit, amount }: { debit: string; credit: string; amount: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm space-y-1">
      <div className="flex justify-between">
        <span className="text-green-600 dark:text-green-400">DR {debit}</span>
        <span className="font-semibold">{amount}</span>
      </div>
      <div className="flex justify-between pl-6">
        <span className="text-blue-600 dark:text-blue-400">CR {credit}</span>
        <span className="font-semibold">{amount}</span>
      </div>
    </div>
  )
}

function AgentCard({ name, trigger, actions, output, color }: {
  name: string
  trigger: string
  actions: string[]
  output: string
  color: string
}) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-3 w-3 rounded-full", color)} />
          <CardTitle className="text-base">{name}</CardTitle>
        </div>
        <CardDescription className="text-xs">Trigger: {trigger}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">ACTIONS</p>
          <ul className="space-y-1">
            {actions.map((a, i) => (
              <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">OUTPUT</p>
          <p className="text-xs text-muted-foreground">{output}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  )
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview")

  return (
    <div className="flex gap-6 animate-fade-in">
      <aside className="hidden lg:flex flex-col w-52 flex-shrink-0">
        <div className="sticky top-6 space-y-1">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 pb-2">Contents</p>
          {SECTIONS.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-left transition-colors",
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{s.label}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <div className="flex-1 min-w-0 space-y-10 pb-16">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Documentation</h1>
          <p className="text-muted-foreground mt-1">End-to-end guide to Ryzha — architecture, flows, agents, and accounting rules.</p>
        </div>

        {(activeSection === "overview" || activeSection === "all") && (
          <section id="overview">
            <SectionTitle icon={BookOpen} title="System Overview" subtitle="How Ryzha's AI-powered ERP works end-to-end" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: Layers, title: "3 Core ERP Processes", desc: "Order-to-Cash (O2C), Procure-to-Pay (P2P), and Record-to-Report (R2R) are the backbone of all financial operations." },
                { icon: Brain, title: "6 AI Agents", desc: "O2C, P2P, R2R, O&M, FP&A, and Auditor — each agent owns a complete ERP process. O2C and P2P each contain 9 specialized sub-agents that run in sequence." },
                { icon: GitBranch, title: "Orchestrator", desc: "A central workflow engine coordinates agent pipelines, ensuring proper sequencing and error isolation for every transaction." },
              ].map((item) => (
                <Card key={item.title}>
                  <CardContent className="pt-5">
                    <item.icon className="h-8 w-8 text-primary mb-3" />
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Architecture Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "O2C Workflow", cls: "bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-950 dark:border-violet-700 dark:text-violet-300" },
                      { label: "P2P Workflow", cls: "bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-950 dark:border-orange-700 dark:text-orange-300" },
                      { label: "R2R Workflow", cls: "bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-950 dark:border-cyan-700 dark:text-cyan-300" },
                      { label: "FP&A Module", cls: "bg-indigo-100 border-indigo-300 text-indigo-700 dark:bg-indigo-950 dark:border-indigo-700 dark:text-indigo-300" },
                    ].map((item) => (
                      <div key={item.label} className={cn("rounded-lg border-2 px-3 py-2.5 text-center text-sm font-semibold", item.cls)}>{item.label}</div>
                    ))}
                  </div>
                  <div className="flex justify-center"><div className="h-5 w-px bg-border" /></div>
                  <div className="rounded-lg border-2 border-primary/40 bg-primary/5 p-3 text-center">
                    <p className="text-sm font-bold text-primary">ORCHESTRATOR</p>
                    <p className="text-xs text-muted-foreground mt-0.5">orchestrator.ts — coordinates pipelines, GL posting &amp; notifications</p>
                  </div>
                  <div className="flex justify-center"><div className="h-5 w-px bg-border" /></div>
                  <div className="rounded-lg border-2 border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/30 p-3">
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 text-center mb-2.5">AI AGENT LAYER — lib/agents/</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                      {[
                        { label: "O2C Agent", sub: "9 sub-agents", cls: "border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400" },
                        { label: "P2P Agent", sub: "9 sub-agents", cls: "border-orange-200 dark:border-orange-800 bg-orange-50/60 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400" },
                        { label: "R2R Agent", sub: "r2r.ts", cls: "border-cyan-200 dark:border-cyan-800 bg-cyan-50/60 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-400" },
                        { label: "O&M Agent", sub: "om.ts", cls: "border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400" },
                        { label: "FP&A Agent", sub: "fpna.ts", cls: "border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400" },
                        { label: "Auditor Agent", sub: "auditor.ts", cls: "border-red-200 dark:border-red-800 bg-red-50/60 dark:bg-red-950/30 text-red-700 dark:text-red-400" },
                      ].map((item) => (
                        <div key={item.label} className={cn("rounded border p-2 text-center", item.cls)}>
                          <p className="text-xs font-semibold">{item.label}</p>
                          <p className="text-[10px] opacity-70 font-mono mt-0.5">{item.sub}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-center"><div className="h-5 w-px bg-border" /></div>
                  <div className="rounded-lg border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 p-3 text-center">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">DATA LAYER — Prisma + PostgreSQL</p>
                    <p className="text-xs text-muted-foreground mt-0.5">GL Entries · Invoices · Transactions · Deferred Revenue · Snapshots</p>
                  </div>
                  <div className="flex justify-center"><div className="h-5 w-px bg-border" /></div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Stripe Webhooks", cls: "bg-[#635BFF]/10 border-[#635BFF]/40 text-[#635BFF]" },
                      { label: "Bank Feed", cls: "bg-green-100 border-green-300 text-green-700 dark:bg-green-950 dark:border-green-700 dark:text-green-400" },
                      { label: "ElevenLabs Voice", cls: "bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300" },
                      { label: "Twilio SMS", cls: "bg-red-100 border-red-300 text-red-700 dark:bg-red-950 dark:border-red-700 dark:text-red-400" },
                    ].map((item) => (
                      <div key={item.label} className={cn("rounded-lg border px-3 py-2 text-center text-xs font-medium", item.cls)}>{item.label}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {(activeSection === "stripe" || activeSection === "all") && (
          <section id="stripe">
            <SectionTitle icon={CreditCard} title="Stripe Payment Lifecycle" subtitle="4-stage US GAAP accrual accounting flow for Stripe payments" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Stage 1 — Invoice Sent</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline">ASC 606 — Revenue Recognition</Badge>
                  <p className="text-sm text-muted-foreground">Revenue is recognized when the performance obligation is satisfied — when the service is delivered or product shipped — regardless of payment timing.</p>
                  <JournalEntry debit="Accounts Receivable (AR)" credit="Service Revenue" amount="$1,000.00" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Stage 2 — Customer Pays via Stripe</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline">Payment Settlement</Badge>
                  <p className="text-sm text-muted-foreground">AR is settled. Funds are in Stripe Clearing (not yet your bank). The processing fee (2.9% + $0.30) is immediately expensed.</p>
                  <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR Stripe Clearing</span><span className="font-semibold">$970.70</span></div>
                    <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR Merchant Processing Fee (Exp)</span><span className="font-semibold">$29.30</span></div>
                    <div className="flex justify-between pl-6"><span className="text-blue-600 dark:text-blue-400">CR Accounts Receivable</span><span className="font-semibold">$1,000.00</span></div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Stage 3 — Stripe Payout to Bank</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline">Cash Settlement (~T+2)</Badge>
                  <p className="text-sm text-muted-foreground">Stripe initiates a batch payout (typically 2 business days). The clearing account is cleared and cash moves to your checking account.</p>
                  <JournalEntry debit="Cash / Corporate Checking" credit="Stripe Clearing Account" amount="$970.70" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">Stage 4 — Bank Reconciliation</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline">Month-End R2R</Badge>
                  <p className="text-sm text-muted-foreground">Match the bank statement deposit against the Stripe Payout Report. Stripe Clearing Account balance must return to $0 for each transaction.</p>
                  <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-xs text-amber-800 dark:text-amber-200 space-y-1">
                    <p className="font-semibold">⚠ Cutoff Rule</p>
                    <p>If customer pays Dec 31 but Stripe deposits Jan 3 — leave the $970.70 in Stripe Clearing on the Dec 31 Balance Sheet. Never record it as Cash prematurely.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">US GAAP Blind Spots</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: AlertTriangle, color: "text-destructive", title: "Gross vs Net Revenue", desc: "NEVER record revenue net of fees ($970.70). Always record full gross revenue ($1,000) and separate fees ($29.30) as an operating expense." },
                    { icon: Clock, color: "text-amber-500", title: "Payout Timing Cutoff", desc: "Dec 31 payment sitting in Stripe stays in 'Stripe Clearing Account' on the Dec 31 Balance Sheet — not in Checking Account." },
                    { icon: DollarSign, color: "text-blue-500", title: "FX Fees (International)", desc: "Stripe charges an additional 1% FX fee for international customers. Must be recorded in 'Foreign Exchange Expense' — separate from regular processing fees." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-3">
                      <item.icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", item.color)} />
                      <div>
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {(activeSection === "o2c" || activeSection === "all") && (
          <section id="o2c">
            <SectionTitle icon={FileText} title="Order-to-Cash (O2C)" subtitle="From customer order creation to cash collection — automated end-to-end" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Full O2C Flow</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <FlowStep step={1} title="Sales Order Created" description="Customer places order. Order Intake Agent validates the customer, checks credit limits, and creates the SalesOrder record with line items." badge="Order Intake Agent" />
                  <FlowStep step={2} title="Invoice Generated" description="Invoice Generation Agent creates an Invoice from the sales order. Sets payment terms (30 days default), assigns invoice number, updates SalesOrder.status = INVOICED." badge="Invoice Gen Agent" />
                  <FlowStep step={3} title="GL Entry: Revenue Recognition" description="Orchestrator posts: DR Accounts Receivable / CR Service Revenue. ASC 606 satisfied — revenue recognized at delivery." badge="ASC 606" badgeVariant="secondary" />
                  <FlowStep step={4} title="Customer Pays (Stripe Webhook)" description="Stripe fires payment_intent.succeeded or invoice.paid event. Webhook handler triggers Cash Application Agent asynchronously via after()." badge="Stripe Webhook" />
                  <FlowStep step={5} title="Cash Application" description="Agent matches payment to invoice, calculates Stripe fee (2.9% + $0.30), creates Payment record, updates invoice to PAID. Posts 3-entry journal: DR Stripe Clearing, DR Processing Fee Exp / CR AR." badge="Cash App Agent" />
                  <FlowStep step={6} title="Stripe Payout Sync" description="Bank feed sync (or manual) triggers payout processing: DR Cash / CR Stripe Clearing. Clearing account returns to $0." badge="Bank Feed" />
                  <FlowStep step={7} title="Collections (if overdue)" description="Collections Agent sends automated reminder emails at 7, 14, 30 days overdue. Escalates to manual review at 60 days." badge="Collections Agent" isLast />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Journal Entries — Full O2C Example ($1,000)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">STEP 1 — Invoice Sent</p>
                      <JournalEntry debit="Accounts Receivable" credit="Service Revenue" amount="$1,000.00" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">STEP 2 — Customer Pays (Stripe Fee: 2.9% + $0.30 = $29.30)</p>
                      <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR Stripe Clearing</span><span>$970.70</span></div>
                        <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR Merchant Processing Fee</span><span>$29.30</span></div>
                        <div className="flex justify-between pl-6"><span className="text-blue-600 dark:text-blue-400">CR Accounts Receivable</span><span>$1,000.00</span></div>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">STEP 3 — Stripe Payout (T+2)</p>
                      <JournalEntry debit="Cash / Checking Account" credit="Stripe Clearing Account" amount="$970.70" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">O2C Key Entities</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ["Customer", "Name, email, credit limit, status"],
                        ["SalesOrder", "Order number, line items, totalAmount"],
                        ["Invoice", "ASC 606 status, due date, terms"],
                        ["Payment", "Amount, method, reference, date"],
                        ["Transaction", "GL reference, Stripe clearing"],
                        ["CreditNote", "Reversal against original invoice"],
                        ["GeneralLedgerEntry", "DR/CR, account, amount, period"],
                        ["DeferredRevenueSchedule", "ASC 606 multi-period recognition"],
                      ].map(([entity, desc]) => (
                        <div key={entity} className="p-2 rounded-md bg-muted/40">
                          <p className="font-mono font-semibold text-primary">{entity}</p>
                          <p className="text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {(activeSection === "p2p" || activeSection === "all") && (
          <section id="p2p">
            <SectionTitle icon={ShoppingCart} title="Procure-to-Pay (P2P)" subtitle="From vendor onboarding to payment disbursement — AI-assisted" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Full P2P Flow</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <FlowStep step={1} title="Vendor Onboarding" description="Vendor Intake Agent validates vendor data (name, email, tax ID, payment terms). Creates Vendor record with ACTIVE status. Checks for duplicates." badge="Vendor Intake Agent" />
                  <FlowStep step={2} title="Purchase Order Created" description="PO is raised with vendor, line items, and approved amounts. Status starts at DRAFT → PENDING_APPROVAL → APPROVED." badge="Manual / AI" />
                  <FlowStep step={3} title="Vendor Invoice Received" description="3-way match: Purchase Order ↔ Vendor Invoice ↔ Goods Receipt. If amounts match within tolerance, invoice is auto-approved." badge="3-Way Match" badgeVariant="secondary" />
                  <FlowStep step={4} title="GL Entry: Accrual" description="Orchestrator posts: DR Accounts Payable / CR Accrued Liabilities when invoice is received but not yet paid." badge="Accrual Basis" badgeVariant="secondary" />
                  <FlowStep step={5} title="Payment Scheduled" description="Payment Scheduler Agent groups payables by due date and payment terms (NET15/30/45/60/IMMEDIATE). Creates payment batch." badge="Payment Scheduler" />
                  <FlowStep step={6} title="Payment Disbursed" description="Payment executed. GL: DR Accounts Payable / CR Cash. VendorInvoice status → PAID." badge="Bank Transfer" isLast />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Journal Entries — P2P Example ($5,000 vendor invoice)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">INVOICE RECEIVED (Accrual)</p>
                      <JournalEntry debit="Operating Expense" credit="Accounts Payable" amount="$5,000.00" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">PAYMENT DISBURSED</p>
                      <JournalEntry debit="Accounts Payable" credit="Cash / Checking Account" amount="$5,000.00" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Payment Terms Reference</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1.5">
                      {[
                        ["IMMEDIATE", "Pay on receipt", "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"],
                        ["NET15", "Pay within 15 days", "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"],
                        ["NET30", "Pay within 30 days (standard)", "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"],
                        ["NET45", "Pay within 45 days", "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"],
                        ["NET60", "Pay within 60 days", "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"],
                      ].map(([term, desc, cls]) => (
                        <div key={term} className="flex items-center gap-3">
                          <span className={cn("text-xs font-mono font-semibold px-2 py-0.5 rounded", cls)}>{term}</span>
                          <span className="text-xs text-muted-foreground">{desc}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {(activeSection === "r2r" || activeSection === "all") && (
          <section id="r2r">
            <SectionTitle icon={RefreshCw} title="Record-to-Report (R2R)" subtitle="Month-end close, reconciliation, and financial statement generation" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">R2R Process Flow</CardTitle></CardHeader>
                <CardContent className="pt-2">
                  <FlowStep step={1} title="GL Sync (syncGLForOrganization)" description="Aggregates all transactions, invoices, and payments into GeneralLedgerEntry records. Creates Trial Balance snapshot." badge="R2R Agent" />
                  <FlowStep step={2} title="Deferred Revenue Release" description="/api/cron/release-deferred-revenue runs periodically. Queries DeferredRevenueSchedule where recognized = false AND period ≤ now(). Posts: DR Deferred Revenue / CR Service Revenue. Marks recognized = true." badge="CRON Job" badgeVariant="secondary" />
                  <FlowStep step={3} title="Bank Reconciliation" description="Matches bank feed transactions against GL entries. Identifies unmatched items. Stripe Clearing Account should net to $0 per payout cycle." badge="Bank Reconcile" />
                  <FlowStep step={4} title="Trial Balance Generation" description="Aggregates all DR and CR entries by account. Total debits must equal total credits. Any discrepancy flags an anomaly." badge="Balance Check" badgeVariant="secondary" />
                  <FlowStep step={5} title="Financial Statements" description="Income Statement: Revenue − Expenses = Net Income. Balance Sheet: Assets = Liabilities + Equity. Cash Flow Statement derived from GL entries." badge="Reports" />
                  <FlowStep step={6} title="Audit Seal" description="Auditor Agent reviews GL entries for anomalies, duplicate transactions, missing references. Generates AuditReport with findings." badge="Auditor Agent" isLast />
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Deferred Revenue — ASC 606 Multi-Period</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">Annual subscriptions ($1,200/year) are deferred and recognized monthly ($100/month) per ASC 606.</p>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">AT SALE (Defer revenue)</p>
                      <JournalEntry debit="Accounts Receivable" credit="Deferred Revenue" amount="$1,200.00" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5 font-medium">EACH MONTH (Release $100)</p>
                      <JournalEntry debit="Deferred Revenue" credit="Service Revenue" amount="$100.00" />
                    </div>
                    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-800 dark:text-blue-200">
                      <p className="font-semibold mb-1">O&M Keyword Detection</p>
                      <p>Transactions containing keywords like "annual", "yearly", "subscription", "maintenance" are automatically flagged for deferred revenue treatment. A DeferredRevenueSchedule is created with 12 monthly entries.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">GL Account Structure</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-1.5 text-xs font-mono">
                      {[
                        ["1000-1999", "Assets", "Accounts Receivable, Cash, Stripe Clearing"],
                        ["2000-2999", "Liabilities", "Accounts Payable, Deferred Revenue"],
                        ["3000-3999", "Equity", "Retained Earnings"],
                        ["4000-4999", "Revenue", "Service Revenue"],
                        ["5000-5999", "Expenses", "Merchant Processing Fee, FX Expense, COGS"],
                      ].map(([range, type, examples]) => (
                        <div key={range} className="grid grid-cols-[80px_80px_1fr] gap-2 items-start p-1.5 rounded bg-muted/30">
                          <span className="text-primary font-semibold">{range}</span>
                          <span className="font-semibold">{type}</span>
                          <span className="text-muted-foreground">{examples}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {(activeSection === "fpna" || activeSection === "all") && (
          <section id="fpna">
            <SectionTitle icon={TrendingUp} title="FP&A Module" subtitle="Financial Planning & Analysis — runway, burn rate, and forecast" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { icon: Activity, title: "Cash Runway", desc: "Current bank balance ÷ average monthly burn rate. Expressed in months and projected zero-cash date. Alerts sent when runway < threshold (default 3 months)." },
                { icon: TrendingUp, title: "Revenue Forecast", desc: "FP&A Agent compares current month's recognized GL revenue entries against targetMonthlyRevenue. Calculates percentAhead metric for performance tracking." },
                { icon: BarChart3, title: "Burn Rate Analysis", desc: "30-day rolling average of all expense GL entries. Excludes non-cash items. Used to project cash runway and trigger low-runway alerts." },
                { icon: Receipt, title: "Expense Anomaly Detection", desc: "Compares each expense against historical category averages. Flags transactions > anomalyThreshold (default $50,000) or > 3σ from category mean." },
                { icon: Building, title: "Financial Snapshot", desc: "FinancialSnapshot entity stores pre-computed: MRR, ARR, gross margin, net income, cash balance. Updated after each major transaction." },
                { icon: Banknote, title: "Weekly Report", desc: "CRON job generates weekly summary email + ElevenLabs voice digest + Twilio SMS alert for key metrics: revenue, expenses, runway, overdue AR." },
              ].map((item) => (
                <Card key={item.title}>
                  <CardContent className="pt-5">
                    <item.icon className="h-6 w-6 text-primary mb-2" />
                    <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">FP&A Calculation Reference</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-md bg-muted/30 p-4 font-mono text-sm space-y-2">
                    <p className="text-xs text-muted-foreground font-sans mb-2">KEY FORMULAS</p>
                    <p><span className="text-primary">Cash Runway</span> = bankBalance ÷ avgMonthlyBurn</p>
                    <p><span className="text-primary">Zero-Cash Date</span> = today + (runway × 30 days)</p>
                    <p><span className="text-primary">% Ahead</span> = (currentRevenue ÷ targetRevenue) × 100</p>
                    <p><span className="text-primary">Burn Rate</span> = Σ expenses (last 30 days)</p>
                    <p><span className="text-primary">Gross Margin</span> = (Revenue − COGS) ÷ Revenue</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">ALERT THRESHOLDS</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between p-2 rounded bg-red-50 dark:bg-red-900/20"><span>Low Runway Alert</span><span className="font-semibold">≤ 3 months (configurable)</span></div>
                      <div className="flex justify-between p-2 rounded bg-amber-50 dark:bg-amber-900/20"><span>Expense Anomaly</span><span className="font-semibold">&gt; $50,000 or 3σ</span></div>
                      <div className="flex justify-between p-2 rounded bg-blue-50 dark:bg-blue-900/20"><span>Overdue Invoice</span><span className="font-semibold">Past due date</span></div>
                      <div className="flex justify-between p-2 rounded bg-orange-50 dark:bg-orange-900/20"><span>Collections Escalation</span><span className="font-semibold">60 days overdue</span></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {(activeSection === "agents" || activeSection === "all") && (
          <section id="agents">
            <SectionTitle icon={Brain} title="AI Agents" subtitle="6 specialized agents — each owns a complete ERP process end-to-end" />

            <div className="space-y-6">

              {/* O2C Agent */}
              <Card className="border-violet-200 dark:border-violet-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-violet-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">Order-to-Cash Agent (O2C)</CardTitle>
                      <CardDescription>Manages the full customer revenue cycle — from order creation to cash collected in bank</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Order Intake",
                        file: "o2c/order-intake.ts",
                        trigger: "SalesOrder created",
                        actions: ["Validates customer credit limit", "Checks for duplicate orders", "Sets workflow status on SalesOrder", "Logs agent actions to agentLogs JSON"],
                        output: "SalesOrder.workflowStatus = VALIDATED",
                      },
                      {
                        name: "Invoice Generation",
                        file: "o2c/invoice-generation.ts",
                        trigger: "After order intake passes",
                        actions: ["Creates Invoice from SalesOrder line items", "Auto-assigns invoice number (INV-XXXX)", "Sets 30-day net payment terms", "Links SalesOrder.invoiceId → Invoice"],
                        output: "Invoice (SENT) + SalesOrder.invoiceId set",
                      },
                      {
                        name: "Cash Application",
                        file: "o2c/cash-application.ts",
                        trigger: "Stripe payment webhook received",
                        actions: ["Matches Stripe payment to open invoice", "Calculates fee: 2.9% + $0.30 (standard) or +1% FX", "Creates Payment record", "Posts 3-line GL journal (Stripe Clearing / Fee Exp / AR)", "Updates Invoice.status → PAID"],
                        output: "Payment + 3 GL entries + Invoice = PAID",
                      },
                      {
                        name: "Collections",
                        file: "o2c/collections.ts",
                        trigger: "Scheduled job / overdue invoice scan",
                        actions: ["Queries all invoices past due date", "Sends reminder emails at 7, 14, 30 days", "Escalates to manual review at 60 days", "Creates Notification records per escalation"],
                        output: "Email reminders + Notification records",
                      },
                      {
                        name: "Credit Note",
                        file: "o2c/credit-note.ts",
                        trigger: "Manual issue or refund event",
                        actions: ["Creates CreditNote linked to original Invoice", "Posts reversal GL: DR Service Revenue / CR AR", "Partially or fully reduces invoice balance", "Updates Invoice.status → REFUNDED / PARTIAL"],
                        output: "CreditNote + reversal GL entries",
                      },
                      {
                        name: "Customer Validation",
                        file: "o2c/customer-validation.ts",
                        trigger: "Customer created or updated",
                        actions: ["Validates required fields (name, email)", "Checks credit limit configuration", "Flags incomplete customer profiles"],
                        output: "Customer.status = ACTIVE or FLAGGED",
                      },
                      {
                        name: "Credit Assessment",
                        file: "o2c/credit.ts",
                        trigger: "Credit check request",
                        actions: ["Evaluates customer payment history", "Checks outstanding AR balance vs credit limit", "Returns credit decision"],
                        output: "Credit decision: APPROVED / REVIEW / DECLINED",
                      },
                      {
                        name: "Dispute Handler",
                        file: "o2c/dispute.ts",
                        trigger: "Dispute opened on invoice",
                        actions: ["Logs dispute against invoice", "Pauses collections workflow for disputed invoice", "Creates dispute Notification for review"],
                        output: "Invoice flagged as disputed, collections paused",
                      },
                      {
                        name: "Pricing Engine",
                        file: "o2c/pricing.ts",
                        trigger: "Line item price calculation",
                        actions: ["Applies pricing rules to line items", "Handles discount tiers and overrides", "Returns calculated unit price"],
                        output: "Resolved unit prices for SalesOrderLines",
                      },
                    ].map((sub) => (
                      <div key={sub.name} className="rounded-md border bg-muted/20 p-3 space-y-2">
                        <p className="text-sm font-semibold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">Trigger:</span> {sub.trigger}</p>
                        <ul className="space-y-0.5">
                          {sub.actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-violet-500 mt-0.5 flex-shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs"><span className="font-medium text-foreground/70">Output:</span> <span className="text-muted-foreground">{sub.output}</span></p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* P2P Agent */}
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-orange-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">Procure-to-Pay Agent (P2P)</CardTitle>
                      <CardDescription>Manages the full vendor spend cycle — from purchase requisition to payment disbursed</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Vendor Intake",
                        file: "p2p/vendor-intake.ts",
                        trigger: "Vendor created or updated",
                        actions: ["Validates vendor name, email, tax ID", "Checks for duplicate vendor entries", "Sets payment terms defaults (NET30)", "Creates P2PSettings record if missing"],
                        output: "Vendor.status = ACTIVE",
                      },
                      {
                        name: "Requisition",
                        file: "p2p/requisition.ts",
                        trigger: "Purchase request submitted",
                        actions: ["Validates requisition fields", "Routes to appropriate approver by amount tier", "Creates pending PurchaseOrder draft"],
                        output: "PurchaseOrder.status = PENDING_APPROVAL",
                      },
                      {
                        name: "PO Creation",
                        file: "p2p/po-creation.ts",
                        trigger: "Requisition approved",
                        actions: ["Generates PO number (PO-XXXXXX)", "Finalises line items and amounts", "Sets PurchaseOrder.status = APPROVED"],
                        output: "PurchaseOrder with confirmed line items",
                      },
                      {
                        name: "Approval",
                        file: "p2p/approval.ts",
                        trigger: "PO pending approval",
                        actions: ["Checks approval thresholds by amount", "Routes to manager / finance based on rules", "Auto-approves below threshold (configurable)", "Creates Notification for approver"],
                        output: "PurchaseOrder.status = APPROVED or REJECTED",
                      },
                      {
                        name: "Invoice Capture",
                        file: "p2p/invoice-capture.ts",
                        trigger: "Vendor invoice received",
                        actions: ["Parses vendor invoice data", "Links to matching PurchaseOrder", "Creates VendorInvoice record", "Queues for 3-way match"],
                        output: "VendorInvoice record created",
                      },
                      {
                        name: "3-Way Matching",
                        file: "p2p/matching.ts",
                        trigger: "Vendor invoice capture complete",
                        actions: ["Matches: PO ↔ Vendor Invoice ↔ Goods Receipt", "Validates amounts within tolerance", "Auto-approves if match passes", "Flags discrepancies for manual review"],
                        output: "VendorInvoice.status = MATCHED or DISPUTED",
                      },
                      {
                        name: "Receiving",
                        file: "p2p/receiving.ts",
                        trigger: "Goods/services received",
                        actions: ["Records goods receipt against PO", "Updates received quantities", "Triggers 3-way match if invoice exists"],
                        output: "PurchaseOrder received quantities updated",
                      },
                      {
                        name: "GL Coding",
                        file: "p2p/gl-coding.ts",
                        trigger: "Vendor invoice approved",
                        actions: ["Assigns GL account codes to line items", "Maps expense categories to chart of accounts", "Posts DR Expense / CR Accounts Payable"],
                        output: "GL entries posted for vendor invoice",
                      },
                      {
                        name: "Payment Scheduler",
                        file: "p2p/payment-scheduler.ts",
                        trigger: "Vendor invoices approved and GL coded",
                        actions: ["Groups payables by due date and payment terms", "Calculates optimal payment run dates", "Respects NET15/30/45/60/IMMEDIATE terms", "Creates scheduled payment batches"],
                        output: "Payment batches ready for disbursement",
                      },
                    ].map((sub) => (
                      <div key={sub.name} className="rounded-md border bg-muted/20 p-3 space-y-2">
                        <p className="text-sm font-semibold">{sub.name}</p>
                        <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground/70">Trigger:</span> {sub.trigger}</p>
                        <ul className="space-y-0.5">
                          {sub.actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs"><span className="font-medium text-foreground/70">Output:</span> <span className="text-muted-foreground">{sub.output}</span></p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* R2R Agent */}
              <Card className="border-cyan-200 dark:border-cyan-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-cyan-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">Record-to-Report Agent (R2R)</CardTitle>
                      <CardDescription>Closes the books — syncs every transaction into double-entry GL, validates trial balance, and releases deferred revenue on schedule</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary" className="text-xs">Trigger: month-end close · on-demand sync · post every transaction</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { name: "AI Transaction Extraction", step: "Step 1", actions: ["Calls AI model with transaction description", "Extracts: customer, product_type, is_subscription, period_months", "Structured output schema enforced via Zod", "Falls back to deterministic parsing on AI failure", "Logs extraction result to agentLogs JSON"], output: "Structured metadata enriching the transaction record" },
                      { name: "Revenue Recognition", step: "Step 2", actions: ["Sets transaction.recognizedRevenue = full amount", "Sets revenueRecognitionType = 'immediate' (O&M may override to deferred)", "Marks transaction as R2R-processed in agentStatus", "Appends structured agent log with timestamp"], output: "Transaction.recognizedRevenue set, type = immediate" },
                      { name: "GL Journal Sync", step: "Step 3", actions: ["Runs syncGLForOrganization across all unprocessed transactions", "Posts DR Accounts Receivable (1100) / CR Service Revenue (4000)", "Each GL row includes: date, accountType, accountName, debit, credit, sourceType, sourceId", "Trial balance validated: SUM(debit) must equal SUM(credit)"], output: "GeneralLedgerEntry records — balanced (DR = CR)" },
                      { name: "Stripe Clearing Reconciliation", step: "Step 4", actions: ["Triggered by payout.paid webhook event", "Stage 2: DR Stripe Clearing (1150) / CR AR (1100) — on card charge", "Stage 3: DR Cash/Checking (1000) / CR Stripe Clearing (1150) — on payout", "Stripe Clearing account must net to $0 per payout cycle", "Flags any unreconciled clearing items for review"], output: "Stripe Clearing Account balance = $0 after payout" },
                      { name: "Deferred Revenue Release", step: "Step 5", actions: ["Queries DeferredRevenueSchedule WHERE recognized = false AND period ≤ now()", "For each due row: posts DR Deferred Revenue (1200) / CR Service Revenue (4000)", "Marks schedule row recognized = true, sets recognizedAt = now()", "Links glEntryId FK on schedule row back to the GL entry created", "Updates FinancialSnapshot with released amounts"], output: "Monthly deferred slices recognized to revenue P&L" },
                      { name: "Trial Balance & Snapshot", step: "Step 6", actions: ["Aggregates all GL entries: total debits, total credits, net by account", "Asserts SUM(DR) === SUM(CR) — throws on imbalance", "Upserts FinancialSnapshot with latest revenue, AR, deferred totals", "Generates period-end closing summary in agentLogs", "Chains to FP&A agent for runway recalculation"], output: "FinancialSnapshot reflects closed-period balances + trial balance" },
                    ].map((cap) => (
                      <div key={cap.name} className="rounded-md border bg-muted/20 p-3 space-y-2">
                        <div><p className="text-sm font-semibold">{cap.name}</p><p className="text-[10px] font-mono text-muted-foreground/70">{cap.step}</p></div>
                        <ul className="space-y-0.5">{cap.actions.map((a, i) => (<li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-cyan-500 mt-0.5 flex-shrink-0" />{a}</li>))}</ul>
                        <p className="text-xs"><span className="font-medium text-foreground/70">Output:</span> <span className="text-muted-foreground">{cap.output}</span></p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GL Journal Entries Posted</p>
                      {[
                        { label: "Stage 1 — Invoice Issued", dr: "Accounts Receivable (1100)", cr: "Service Revenue (4000)", amount: "$1,000.00" },
                        { label: "Stage 2 — Stripe Charge", dr: "Stripe Clearing (1150) + Fee Expense (5000)", cr: "Accounts Receivable (1100)", amount: "$1,000.00" },
                        { label: "Stage 3 — Stripe Payout", dr: "Cash / Checking (1000)", cr: "Stripe Clearing (1150)", amount: "$970.70" },
                        { label: "Deferred Release (monthly)", dr: "Deferred Revenue (1200)", cr: "Service Revenue (4000)", amount: "$1,000 / N months" },
                      ].map((e) => (
                        <div key={e.label} className="space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground">{e.label}</p>
                          <div className="rounded border bg-background p-2 text-xs font-mono space-y-0.5">
                            <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR {e.dr}</span><span className="font-semibold">{e.amount}</span></div>
                            <div className="flex justify-between pl-4"><span className="text-blue-600 dark:text-blue-400">CR {e.cr}</span><span className="font-semibold">{e.amount}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Outputs & Validations</p>
                      <div className="space-y-2">
                        {[
                          { label: "Trial Balance", value: "SUM(ALL debits) = SUM(ALL credits)" },
                          { label: "Stripe Clearing", value: "Balance must equal $0.00 after payout cycle" },
                          { label: "AI Extraction Schema", value: "{ customer, product_type, is_subscription, period_months }" },
                          { label: "agentStatus field", value: '{ r2r: "done", om: "pending", fpna: "pending", auditor: "pending" }' },
                          { label: "GL Source Types", value: "INVOICE, PAYMENT, CREDIT_NOTE, PAYOUT, DEFERRED_RELEASE" },
                          { label: "Deferred Schedule guard", value: "Checks count > 0 before createMany — prevents double-insert" },
                        ].map((item) => (
                          <div key={item.label} className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium">{item.label}</span>
                            <span className="text-xs text-muted-foreground font-mono">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* O&M Agent */}
              <Card className="border-teal-200 dark:border-teal-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-teal-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">Operations &amp; Management Agent (O&amp;M)</CardTitle>
                      <CardDescription>Enforces ASC 606 deferral policy — uses AI + RAG to decide deferred vs immediate recognition, then creates the monthly release schedule</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary" className="text-xs">Trigger: every transaction — runs as step 2 of orchestrator pipeline</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { name: "Settings Resolution", step: "Step 1", actions: ["Loads FinancialSettings for the organization", "Reads deferralPeriodMonths (default: 12)", "Reads deferredRevenueRules keyword list (default: ['annual','yearly','subscription'])", "Reads paymentFraction for partial payment support"], output: "Deferral config loaded — keywords, period, fraction" },
                      { name: "Keyword Deferral Detection", step: "Step 2", actions: ["Scans transaction.description against keyword list (case-insensitive)", "Sets isDeferred = true if any keyword matched", "This is the fast deterministic path — no LLM call yet", "Can be fully overridden by the AI decision in step 4"], output: "Preliminary isDeferred flag (pre-AI, fast path)" },
                      { name: "RAG Context Retrieval", step: "Step 3", actions: ["Calls getFinancialContext(description, organizationId)", "Retrieves relevant accounting policy chunks from vector store", "Context includes: org-specific ASC 606 rules, past decisions", "Injected into the AI system prompt for grounded reasoning"], output: "ASC 606 policy context injected into AI prompt" },
                      { name: "AI ASC 606 Decision", step: "Step 4", actions: ["Calls AI model as expert accountant (temperature: 0)", "Input: transaction description, amount, RAG context", "Output schema: { deferred: boolean, reason: string, period: number }", "AI can flip the keyword decision based on full context", "Falls back to keyword detection result on AI failure"], output: "Final deferred/immediate decision + AI explanation string" },
                      { name: "Deferred Schedule Creation", step: "Step 5", actions: ["effectiveAmount = amount × paymentFraction (partial payment support)", "monthlyPortion = effectiveAmount / deferralPeriodMonths", "Duplicate guard: COUNT existing schedule rows before createMany", "Creates N rows: period = 1st of each future month, amount = monthlyPortion, recognized = false", "Only runs if isDeferred = true and no existing schedule"], output: "DeferredRevenueSchedule: N rows (one per month)" },
                      { name: "Transaction Update", step: "Step 6", actions: ["Deferred path: recognizedRevenue = monthlyPortion, deferredRevenue = effectiveAmount - monthlyPortion", "Immediate path: recognizedRevenue = full amount, deferredRevenue = 0", "Sets revenueRecognitionType = 'deferred' | 'immediate'", "Appends AI reasoning to agentLogs with 'O&M' agent label", "Feeds deferred amount to R2R for balance sheet Deferred Revenue line"], output: "Transaction.deferredRevenue + recognizedRevenue updated" },
                    ].map((cap) => (
                      <div key={cap.name} className="rounded-md border bg-muted/20 p-3 space-y-2">
                        <div><p className="text-sm font-semibold">{cap.name}</p><p className="text-[10px] font-mono text-muted-foreground/70">{cap.step}</p></div>
                        <ul className="space-y-0.5">{cap.actions.map((a, i) => (<li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground"><CheckCircle2 className="h-3 w-3 text-teal-500 mt-0.5 flex-shrink-0" />{a}</li>))}</ul>
                        <p className="text-xs"><span className="font-medium text-foreground/70">Output:</span> <span className="text-muted-foreground">{cap.output}</span></p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GL Journal Entries — Deferred Path Example</p>
                      <p className="text-xs text-muted-foreground italic">Example: $12,000 annual subscription — deferred over 12 months</p>
                      {[
                        { label: "On Invoice / Transaction Receipt", dr: "Accounts Receivable (1100)", cr: "Deferred Revenue (1200)", amount: "$12,000.00" },
                        { label: "Month 1 Release (R2R cron job)", dr: "Deferred Revenue (1200)", cr: "Service Revenue (4000)", amount: "$1,000.00" },
                        { label: "Month 2–12 (repeated monthly)", dr: "Deferred Revenue (1200)", cr: "Service Revenue (4000)", amount: "$1,000.00 × 11" },
                      ].map((e) => (
                        <div key={e.label} className="space-y-1">
                          <p className="text-[10px] font-semibold text-muted-foreground">{e.label}</p>
                          <div className="rounded border bg-background p-2 text-xs font-mono space-y-0.5">
                            <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR {e.dr}</span><span className="font-semibold">{e.amount}</span></div>
                            <div className="flex justify-between pl-4"><span className="text-blue-600 dark:text-blue-400">CR {e.cr}</span><span className="font-semibold">{e.amount}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration &amp; Key Formulas</p>
                      <div className="space-y-2">
                        {[
                          { label: "deferralPeriodMonths", value: "Int — how many months to spread (default: 12)" },
                          { label: "deferredRevenueRules", value: 'Json — keyword array e.g. ["annual","yearly","subscription"]' },
                          { label: "paymentFraction", value: "Float (0–1) — for partial payment support (default: 1)" },
                          { label: "monthlyPortion formula", value: "(amount × paymentFraction) / deferralPeriodMonths" },
                          { label: "Duplicate guard", value: "COUNT(DeferredRevenueSchedule WHERE transactionId) === 0 before insert" },
                          { label: "AI model", value: "Configurable (default: Groq) — temperature: 0, JSON response mode" },
                          { label: "RAG source", value: "getFinancialContext() — vector store per organization" },
                        ].map((item) => (
                          <div key={item.label} className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium font-mono text-teal-700 dark:text-teal-400">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FP&A Agent */}
              <Card className="border-indigo-200 dark:border-indigo-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-indigo-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">Financial Planning &amp; Analysis Agent (FP&amp;A)</CardTitle>
                      <CardDescription>Acts as an AI CFO — recalculates runway, burn rate, and zero-cash date after every transaction, then delivers voice + SMS briefings</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary" className="text-xs">Trigger: post-transaction · weekly CRON</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Balance &amp; Settings Load",
                        step: "Step 1",
                        actions: ["Reads FinancialSnapshot.bankBalance (current cash position)", "Falls back to FinancialSettings.bankBalance if no snapshot", "Loads targetMonthlyRevenue from settings (default: $10,000)", "Establishes current-month and 3-month-ago date boundaries"],
                        output: "bankBalance, targetMonthlyRevenue, date ranges ready",
                        dot: "bg-indigo-500",
                      },
                      {
                        name: "GL Revenue Aggregation",
                        step: "Step 2",
                        actions: ["Queries GeneralLedgerEntry SUM(credit) for accountType=Revenue (all-time)", "Queries same filtered to current month only", "Runs in parallel with expense query via Promise.all", "Uses actual recognized GL credits — not raw transaction amounts"],
                        output: "currentRevenue (all-time) + actualMonthlyRevenue (MTD)",
                        dot: "bg-indigo-500",
                      },
                      {
                        name: "Burn Rate Calculation",
                        step: "Step 3",
                        actions: ["Aggregates expenses from last 3 months", "Divides by 3 for rolling average monthly burn", "avgMonthlyExpenses drives runway formula", "Zero division guard: returns 999 months if no expenses"],
                        output: "avgMonthlyExpenses = 3-month rolling average",
                        dot: "bg-indigo-500",
                      },
                      {
                        name: "Runway &amp; Zero-Cash Forecast",
                        step: "Step 4",
                        actions: ["runwayMonths = bankBalance / avgMonthlyExpenses", "zeroCashDate = today + (runwayMonths × 30 days)", "percentAhead = (actualMonthly - target) / target × 100", "All three metrics written back to Transaction record"],
                        output: "runwayMonths, zeroCashDate, percentAhead on transaction",
                        dot: "bg-indigo-500",
                      },
                      {
                        name: "AI CFO Narrative",
                        step: "Step 5",
                        actions: ["Calls AI model (temperature 0.7) as strategic CFO", "Generates narrative + optimistic/pessimistic scenarios", "Narrative replaces default log message if successful", "Falls back to deterministic log string on AI failure"],
                        output: "AI narrative + scenario analysis in agent log",
                        dot: "bg-indigo-500",
                      },
                      {
                        name: "Snapshot &amp; Notifications",
                        step: "Step 6",
                        actions: ["Upserts FinancialSnapshot with latest bankBalance, burn rate, runway, zeroCashDate", "Triggers ElevenLabs voice briefing with configurable script template", "Sends Twilio SMS with runway and zero-cash date", "All notifications non-blocking via after()"],
                        output: "FinancialSnapshot updated + voice digest + SMS alert fired",
                        dot: "bg-indigo-500",
                      },
                    ].map((cap) => (
                      <div key={cap.name} className="rounded-md border bg-muted/20 p-3 space-y-2">
                        <div>
                          <p className="text-sm font-semibold" dangerouslySetInnerHTML={{ __html: cap.name }} />
                          <p className="text-[10px] font-mono text-muted-foreground/70">{cap.step}</p>
                        </div>
                        <ul className="space-y-0.5">
                          {cap.actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs"><span className="font-medium text-foreground/70">Output:</span> <span className="text-muted-foreground">{cap.output}</span></p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key Metrics &amp; Formulas</p>
                      <div className="space-y-2.5">
                        {[
                          { label: "Runway Formula", value: "runwayMonths = bankBalance ÷ avgMonthlyExpenses" },
                          { label: "Zero-Cash Date", value: "today + (runwayMonths × 30 days)" },
                          { label: "Burn Rate", value: "SUM(expenses last 3 months) ÷ 3  →  rolling monthly avg" },
                          { label: "% Ahead of Plan", value: "(actualMonthlyRevenue − targetMonthlyRevenue) ÷ targetMonthlyRevenue × 100" },
                          { label: "Revenue Source", value: "SUM(GeneralLedgerEntry.credit WHERE accountType = 'Revenue')" },
                          { label: "Zero Division Guard", value: "If avgMonthlyExpenses = 0 → runwayMonths = 999 (infinite)" },
                        ].map((item) => (
                          <div key={item.label} className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium font-mono text-indigo-700 dark:text-indigo-400">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notification Channels &amp; Config</p>
                      <div className="space-y-2.5">
                        {[
                          { label: "AI Model", value: "Configurable (default: Groq) — temperature: 0.7, strategic CFO persona" },
                          { label: "AI Output Schema", value: '{ narrative: string, scenarios: { optimistic, pessimistic } }' },
                          { label: "ElevenLabs Voice", value: "elevenLabsApiKey in FinancialSettings — async voice briefing" },
                          { label: "Twilio SMS", value: "twilioAccountSid + authToken + phone — runway digest SMS" },
                          { label: "FinancialSnapshot fields", value: "bankBalance, averageMonthlyExpenses, runwayMonths, zeroCashDate" },
                          { label: "targetMonthlyRevenue", value: "Float in FinancialSettings — default: $10,000 / month" },
                          { label: "Fallback behavior", value: "AI narrative failure → deterministic log string emitted instead" },
                        ].map((item) => (
                          <div key={item.label} className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium font-mono text-indigo-700 dark:text-indigo-400">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Auditor Agent */}
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-red-500 flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">Auditor Agent</CardTitle>
                      <CardDescription>Forensic AI auditor — verifies every transaction against signed contracts, detects anomalies, and generates tamper-evident SHA-256 audit hashes</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary" className="text-xs">Trigger: every transaction · month-end audit run</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      {
                        name: "Audit Settings Load",
                        step: "Step 1",
                        actions: ["Reads requireAuditSeal (default: true)", "Reads autoRejectUnverified flag from FinancialSettings", "Reads anomalyThreshold (default: $50,000)", "Determines auto-reject vs flag-for-review policy"],
                        output: "Audit policy config loaded per organization",
                        dot: "bg-red-500",
                      },
                      {
                        name: "Contract Matching",
                        step: "Step 2",
                        actions: ["Queries Contract table by stripePaymentIntentId", "Verifies contract belongs to same organization", "Checks contract.status === 'signed'", "Absence of contract triggers flagged/rejected path"],
                        output: "Matching signed contract found — or audit path = flagged",
                        dot: "bg-red-500",
                      },
                      {
                        name: "Threshold Anomaly Check",
                        step: "Step 3",
                        actions: ["Compares transaction.amount against anomalyThreshold", "Amounts > $50,000 (configurable) trigger anomalyDetected = true", "Deterministic first pass before AI investigation", "Logged as WARNING in audit trail"],
                        output: "anomalyDetected flag set if amount exceeds threshold",
                        dot: "bg-red-500",
                      },
                      {
                        name: "AI Forensic Investigation",
                        step: "Step 4",
                        actions: ["Calls AI model as forensic auditor (temperature 0)", "Evaluates: amount vs description, contract availability, fraud patterns", "Returns: { is_anomaly, investigation_notes, risk_score }", "AI can override threshold result — either direction"],
                        output: "AI-determined is_anomaly + investigation notes + risk score",
                        dot: "bg-red-500",
                      },
                      {
                        name: "SHA-256 Audit Hash",
                        step: "Step 5",
                        actions: ["Only generated when signed contract is found", "Hash = SHA-256(contractId + transactionAmount)", "First 8 chars shown in log as tamper-evident seal", "Hash stored on transaction.auditHash field"],
                        output: "auditHash on transaction — verifiable cryptographic seal",
                        dot: "bg-red-500",
                      },
                      {
                        name: "Status &amp; Audit Report",
                        step: "Step 6",
                        actions: ["auditStatus = 'verified' (signed contract + hash match)", "auditStatus = 'flagged' (requireAuditSeal + no contract)", "auditStatus = 'rejected' (autoRejectUnverified = true)", "auditStatus = 'unverified' (no seal required)", "Appends full investigation log to transaction agentLogs"],
                        output: "transaction.auditStatus + detailed audit trail entry",
                        dot: "bg-red-500",
                      },
                    ].map((cap) => (
                      <div key={cap.name} className="rounded-md border bg-muted/20 p-3 space-y-2">
                        <div>
                          <p className="text-sm font-semibold" dangerouslySetInnerHTML={{ __html: cap.name }} />
                          <p className="text-[10px] font-mono text-muted-foreground/70">{cap.step}</p>
                        </div>
                        <ul className="space-y-0.5">
                          {cap.actions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <CheckCircle2 className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                              {a}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs"><span className="font-medium text-foreground/70">Output:</span> <span className="text-muted-foreground">{cap.output}</span></p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Decision Matrix</p>
                      <div className="space-y-2">
                        {[
                          { status: "verified", color: "text-green-600 dark:text-green-400", bg: "bg-green-50/50 dark:bg-green-950/20", cond: "Signed contract found + SHA-256 hash generated" },
                          { status: "flagged", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50/50 dark:bg-yellow-950/20", cond: "requireAuditSeal = true AND no contract found" },
                          { status: "rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-50/50 dark:bg-red-950/20", cond: "autoRejectUnverified = true AND no contract found" },
                          { status: "unverified", color: "text-slate-500", bg: "bg-slate-50/50 dark:bg-slate-900/20", cond: "requireAuditSeal = false — no seal required by policy" },
                        ].map((row) => (
                          <div key={row.status} className={`rounded border px-3 py-2 flex items-center gap-3 ${row.bg}`}>
                            <span className={`text-xs font-bold font-mono w-20 flex-shrink-0 ${row.color}`}>{row.status}</span>
                            <span className="text-xs text-muted-foreground">{row.cond}</span>
                          </div>
                        ))}
                      </div>
                      <div className="rounded border bg-background p-2 text-xs font-mono space-y-0.5">
                        <p className="text-[10px] text-muted-foreground font-semibold mb-1">SHA-256 Hash Formula</p>
                        <div className="text-green-600 dark:text-green-400">hash = SHA-256( contractId + transactionAmount )</div>
                        <div className="text-muted-foreground pl-2">stored on: transaction.auditHash</div>
                        <div className="text-muted-foreground pl-2">displayed: first 8 chars in audit log</div>
                      </div>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Configuration &amp; Risk Thresholds</p>
                      <div className="space-y-2.5">
                        {[
                          { label: "anomalyThreshold", value: "Float — default $50,000 (configurable per org in FinancialSettings)" },
                          { label: "requireAuditSeal", value: "Boolean — default true — forces contract match before verified status" },
                          { label: "autoRejectUnverified", value: "Boolean — default false — auto-rejects unmatched transactions" },
                          { label: "AI Model", value: "Configurable (default: Groq) — temperature: 0, forensic auditor persona, deterministic" },
                          { label: "AI Output Schema", value: "{ is_anomaly: boolean, investigation_notes: string, risk_score: number }" },
                          { label: "Contract match key", value: "Contract.stripePaymentIntentId = Transaction.stripePaymentIntentId" },
                          { label: "Fallback behavior", value: "AI failure → threshold-only anomaly detection still applies" },
                        ].map((item) => (
                          <div key={item.label} className="flex flex-col gap-0.5">
                            <span className="text-xs font-medium font-mono text-red-700 dark:text-red-400">{item.label}</span>
                            <span className="text-xs text-muted-foreground">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {(activeSection === "journal-entries" || activeSection === "all") && (
          <section id="journal-entries">
            <SectionTitle icon={BookOpen} title="Journal Entry System" subtitle="Double-entry bookkeeping — manual GL entries, trial balance, and period-end controls" />

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle className="text-base">What is a Journal Entry?</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Every financial transaction in Ryzha follows the double-entry principle: every debit has an equal and opposite credit. Journal entries are the mechanism for recording transactions that fall outside the automated agent pipelines — adjustments, accruals, closing entries, and reversals.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: "Regular Entry", badge: "REGULAR", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300", desc: "Day-to-day transactions. E.g. purchasing equipment: DR Equipment / CR Cash." },
                      { title: "Adjusting Entry", badge: "ADJUSTING", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300", desc: "Period-end accruals and deferrals. E.g. DR Utilities Expense / CR Utilities Payable for December bill not yet received." },
                      { title: "Closing Entry", badge: "CLOSING", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300", desc: "Year-end transfers. DR Revenue / CR Income Summary to clear temporary accounts into Retained Earnings." },
                      { title: "Reversing Entry", badge: "REVERSING", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300", desc: "Automatically reverses a prior adjusting entry at the start of the next period to prevent double-counting." },
                    ].map((t) => (
                      <div key={t.title} className="rounded-lg border p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${t.color}`}>{t.badge}</span>
                          <span className="font-semibold text-sm">{t.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">The JE → GL Pipeline</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">All journal entries flow directly to the General Ledger upon posting. The pipeline ensures complete audit trails and balance integrity.</p>
                  <div className="space-y-3">
                    {[
                      { step: 1, title: "Create Entry (DRAFT)", desc: "Enter date, reference, period, and type. Add debit/credit lines using the CoA-backed account picker. Save as Draft — not yet in GL.", badge: "Draft", badgeVariant: "secondary" as const },
                      { step: 2, title: "Balance Check", desc: "The system enforces ΣDebits = ΣCredits before allowing posting. The UI shows a live 'Balanced / Off by $X' indicator on each save.", badge: "Validation", badgeVariant: "outline" as const },
                      { step: 3, title: "Post to GL (POSTED)", desc: "Posting materializes each JE line as a GeneralLedgerEntry record via syncGLForOrganization(). The entry is locked — no edits allowed.", badge: "Posted", badgeVariant: "default" as const },
                      { step: 4, title: "Trial Balance", desc: "The Trial Balance page aggregates all GL entries by account, groups by type (Assets / Liabilities / Equity / Revenue / Expenses), and verifies ΣDR = ΣCR.", badge: "Reconciliation", badgeVariant: "outline" as const, isLast: true },
                    ].map((s) => <FlowStep key={s.step} {...s} />)}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Example: Adjusting Entry (Accrual)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline">ADJUSTING · Dec 31</Badge>
                    <p className="text-sm text-muted-foreground">Accrue December utility expense that will be billed in January. The expense is recognised in the correct period per the matching principle.</p>
                    <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR Utilities Expense</span><span className="font-semibold">$300.00</span></div>
                      <div className="flex justify-between pl-6"><span className="text-blue-600 dark:text-blue-400">CR Utilities Payable</span><span className="font-semibold">$300.00</span></div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Example: Reversing Entry (Feb 1)</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant="outline">REVERSING · Feb 1</Badge>
                    <p className="text-sm text-muted-foreground">On the first day of the new period, the December accrual is automatically reversed so that the actual January bill is not double-counted.</p>
                    <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm space-y-1">
                      <div className="flex justify-between"><span className="text-green-600 dark:text-green-400">DR Utilities Payable</span><span className="font-semibold">$300.00</span></div>
                      <div className="flex justify-between pl-6"><span className="text-blue-600 dark:text-blue-400">CR Utilities Expense</span><span className="font-semibold">$300.00</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-base">Double-Entry Rules (US GAAP)</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground">
                          <th className="text-left py-2 pr-4 font-semibold">Account Type</th>
                          <th className="text-left py-2 pr-4 font-semibold">Increases with</th>
                          <th className="text-left py-2 font-semibold">Decreases with</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[
                          { type: "Assets", inc: "Debit (DR)", dec: "Credit (CR)", color: "text-blue-600 dark:text-blue-400" },
                          { type: "Liabilities", inc: "Credit (CR)", dec: "Debit (DR)", color: "text-orange-600 dark:text-orange-400" },
                          { type: "Equity", inc: "Credit (CR)", dec: "Debit (DR)", color: "text-purple-600 dark:text-purple-400" },
                          { type: "Revenue", inc: "Credit (CR)", dec: "Debit (DR)", color: "text-green-600 dark:text-green-400" },
                          { type: "Expenses", inc: "Debit (DR)", dec: "Credit (CR)", color: "text-red-600 dark:text-red-400" },
                        ].map((r) => (
                          <tr key={r.type}>
                            <td className={`py-2 pr-4 font-semibold ${r.color}`}>{r.type}</td>
                            <td className="py-2 pr-4 text-muted-foreground">{r.inc}</td>
                            <td className="py-2 text-muted-foreground">{r.dec}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">GL Sync Sources</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">The General Ledger is populated from multiple sources, all unified through <code className="text-xs bg-muted rounded px-1 py-0.5">syncGLForOrganization()</code>.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { src: "Invoices", desc: "Revenue recognition + Tax Payable + AR" },
                      { src: "Payments (Stripe)", desc: "Cash, Stripe Clearing, Merchant Fees, FX Fees" },
                      { src: "Expenses", desc: "Expense debit + Cash credit" },
                      { src: "Vendor Invoices", desc: "Vendor Expense + Accounts Payable" },
                      { src: "Journal Entries", desc: "Manual POSTED JEs — any account, any type" },
                      { src: "Deferred Revenue", desc: "DR Deferred Revenue / CR Service Revenue on schedule release" },
                    ].map((s) => (
                      <div key={s.src} className="rounded-lg border p-3">
                        <p className="font-semibold text-sm">{s.src}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {(activeSection === "integrations" || activeSection === "all") && (
          <section id="integrations">
            <SectionTitle icon={Webhook} title="Integrations" subtitle="External systems connected to Ryzha" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-[#635BFF] flex items-center justify-center text-white text-xs font-bold">S</div>
                    <CardTitle className="text-base">Stripe</CardTitle>
                  </div>
                  <CardDescription>Payment processing & webhook integration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Webhook</Badge>
                      <span className="text-muted-foreground">`/api/webhooks/stripe` — handles payment_intent.succeeded, invoice.paid, charge.refunded, payout.paid</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Fee Calc</Badge>
                      <span className="text-muted-foreground">Standard: 2.9% + $0.30. International FX: additional 1% recorded to Foreign Exchange Expense account.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Badge variant="secondary" className="text-xs flex-shrink-0">Payout Sync</Badge>
                      <span className="text-muted-foreground">Payout report matched against Stripe Clearing account. Clearing balance must net to $0 per cycle.</span>
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/30 p-3 font-mono text-xs">
                    <p className="text-muted-foreground mb-1"># Required env vars</p>
                    <p>STRIPE_SECRET_KEY=sk_live_...</p>
                    <p>STRIPE_WEBHOOK_SECRET=whsec_...</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-black dark:bg-white flex items-center justify-center text-white dark:text-black text-xs font-bold">EL</div>
                    <CardTitle className="text-base">ElevenLabs Voice</CardTitle>
                  </div>
                  <CardDescription>AI voice summary notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Generates an AI voice briefing when a significant transaction is reconciled. The script template is fully configurable in Financial Settings.</p>
                  <div className="rounded-md bg-muted/30 p-3 text-xs text-muted-foreground">
                    <p className="font-semibold mb-1">Default Script Template:</p>
                    <p className="italic">"Karina, a {'{{amount}}'} credit has been reconciled under ASC 606. This improves our net income for the quarter and extends our cash runway by {'{{runwayDays}}'} days, moving our Zero Cash Date to {'{{zeroCashDate}}'}. We are currently {'{{percentAhead}}'}% ahead of our financial plan."</p>
                  </div>
                  <div className="rounded-md bg-muted/30 p-3 font-mono text-xs">
                    <p className="text-muted-foreground mb-1"># Configure in FinancialSettings</p>
                    <p>elevenLabsApiKey = "..."</p>
                    <p>elevenLabsVoiceId = "21m00Tcm4TlvDq8ikWAM"</p>
                    <p>enableVoiceSummary = true</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-[#F22F46] flex items-center justify-center text-white text-xs font-bold">T</div>
                    <CardTitle className="text-base">Twilio SMS</CardTitle>
                  </div>
                  <CardDescription>SMS alerts for critical financial events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Sends SMS notifications for processed transactions, low runway alerts, and critical overdue collections. Configurable recipient number.</p>
                  <div className="rounded-md bg-muted/30 p-3 font-mono text-xs">
                    <p className="text-muted-foreground mb-1"># Configure in FinancialSettings</p>
                    <p>twilioAccountSid = "AC..."</p>
                    <p>twilioAuthToken = "..."</p>
                    <p>twilioFromNumber = "+1..."</p>
                    <p>smsRecipientNumber = "+1..."</p>
                    <p>enableSMS = true</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                      <Activity className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-base">Bank Feed</CardTitle>
                  </div>
                  <CardDescription>Automated bank transaction import</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Bank transactions are imported into BankTransaction records. The reconciliation engine matches them against GL entries — identifying Stripe payouts, expense payments, and unmatched items.</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">Auto-match Stripe payout deposits to GL Stripe Clearing entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">Flag unmatched transactions for manual review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      <span className="text-muted-foreground">Track reconciliation status (PENDING / MATCHED / UNMATCHED)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {(activeSection === "schema" || activeSection === "all") && (
          <section id="schema">
            <SectionTitle icon={Database} title="Data Model" subtitle="Core Prisma entities and their relationships — click any row to expand fields" />

            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Entity Relationship Tree</CardTitle>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="text-[9px] font-bold text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300 px-1 rounded">PK</span> Primary Key</span>
                    <span className="flex items-center gap-1"><span className="text-[9px] font-bold text-blue-700 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-1 rounded">FK</span> Foreign Key</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-0.5">
                  {DB_SCHEMA.map(entity => <DbNode key={entity.name} entity={entity} />)}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Key Enum Values</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4 text-xs">
                    {[
                      {
                        name: "InvoiceStatus",
                        values: ["DRAFT", "SENT", "OVERDUE", "PARTIAL", "PAID", "VOID", "REFUNDED"],
                        colors: ["bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500", "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"],
                      },
                      {
                        name: "ExpenseStatus",
                        values: ["PENDING", "CATEGORIZED", "REVIEWED", "APPROVED", "PAID"],
                        colors: ["bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300", "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"],
                      },
                      {
                        name: "AuditStatus (Transaction)",
                        values: ["pending", "verified", "flagged", "rejected", "unverified"],
                        colors: ["bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300", "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300", "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"],
                      },
                      {
                        name: "ClearingStatus (Transaction)",
                        values: ["pending", "paid_out"],
                        colors: ["bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300", "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"],
                      },
                    ].map((e) => (
                      <div key={e.name}>
                        <p className="font-mono font-semibold text-primary mb-1.5">{e.name}</p>
                        <div className="flex flex-wrap gap-1">
                          {e.values.map((v, i) => (
                            <span key={v} className={cn("px-2 py-0.5 rounded font-mono text-[11px]", e.colors[i])}>{v}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base">GL Account Codes — Chart of Accounts</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { code: "1000", name: "Cash / Corporate Checking", type: "Asset", color: "text-green-600 dark:text-green-400" },
                      { code: "1100", name: "Accounts Receivable (AR)", type: "Asset", color: "text-green-600 dark:text-green-400" },
                      { code: "1150", name: "Stripe Clearing Account", type: "Asset", color: "text-green-600 dark:text-green-400" },
                      { code: "1200", name: "Deferred Revenue", type: "Liability", color: "text-orange-600 dark:text-orange-400" },
                      { code: "2000", name: "Accounts Payable (AP)", type: "Liability", color: "text-orange-600 dark:text-orange-400" },
                      { code: "4000", name: "Service Revenue", type: "Revenue", color: "text-blue-600 dark:text-blue-400" },
                      { code: "5000", name: "Merchant Processing Fees", type: "Expense", color: "text-red-600 dark:text-red-400" },
                      { code: "5010", name: "Foreign Exchange Expense", type: "Expense", color: "text-red-600 dark:text-red-400" },
                    ].map(a => (
                      <div key={a.code} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/40">
                        <span className="font-mono font-bold text-muted-foreground w-10 flex-shrink-0">{a.code}</span>
                        <span className="font-medium flex-1">{a.name}</span>
                        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted", a.color)}>{a.type}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
