"use client"

import * as React from "react"
import { BookOpen, Plug, GitMerge, BarChart2, Bot, Settings, Zap, ChevronRight, ExternalLink } from "lucide-react"

interface Section {
  id: string
  title: string
  icon: React.ElementType
  items: {
    title: string
    anchor: string
    desc: string
  }[]
}

const TOC: Section[] = [
  {
    id: "overview",
    title: "Getting Started",
    icon: BookOpen,
    items: [
      { title: "What is Ryzha?", anchor: "what-is-ryzha", desc: "Mission and product overview" },
      { title: "Onboarding flow", anchor: "onboarding", desc: "First-time setup walkthrough" },
      { title: "Data ownership model", anchor: "data-ownership", desc: "Where your data lives" },
    ],
  },
  {
    id: "connect",
    title: "Connections",
    icon: Plug,
    items: [
      { title: "QuickBooks OAuth", anchor: "qb-oauth", desc: "Connect your accounting system" },
      { title: "Stripe", anchor: "stripe", desc: "Revenue and subscription events" },
      { title: "Mercury", anchor: "mercury", desc: "Bank transactions and balances" },
      { title: "Ramp", anchor: "ramp", desc: "Corporate card and AP spend" },
      { title: "Gusto / Rippling", anchor: "payroll", desc: "Payroll and headcount events" },
      { title: "Coming soon", anchor: "coming-soon", desc: "Xero, Salesforce, HubSpot, Chargebee" },
    ],
  },
  {
    id: "staging",
    title: "Staging Queue",
    icon: GitMerge,
    items: [
      { title: "Event lifecycle", anchor: "event-lifecycle", desc: "INGESTED → PROCESSING → POSTED" },
      { title: "Event statuses", anchor: "event-statuses", desc: "What each status means" },
      { title: "Event detail view", anchor: "event-detail", desc: "Inspecting AI decisions and sync logs" },
      { title: "Approvals", anchor: "approvals", desc: "Human-in-the-loop review" },
    ],
  },
  {
    id: "agents",
    title: "AI Agents",
    icon: Bot,
    items: [
      { title: "GL Coding Agent", anchor: "gl-coding", desc: "Auto-classifies events to GL accounts" },
      { title: "Revenue Agent", anchor: "revenue-agent", desc: "ASC 606 recognition and journal entries" },
      { title: "Cash Agent", anchor: "cash-agent", desc: "Bank reconciliation" },
      { title: "AP Agent", anchor: "ap-agent", desc: "3-way match and approval routing" },
      { title: "Payroll Agent", anchor: "payroll-agent", desc: "Department cost allocation" },
      { title: "Anomaly Agent", anchor: "anomaly-agent", desc: "Statistical and AI-powered anomaly detection" },
      { title: "Close Agent", anchor: "close-agent", desc: "Month-end automation" },
      { title: "Board Report Agent", anchor: "board-report", desc: "AI financial narrative generation" },
      { title: "Cron schedule", anchor: "cron", desc: "When agents run automatically" },
    ],
  },
  {
    id: "intelligence",
    title: "Intelligence",
    icon: BarChart2,
    items: [
      { title: "SaaS Metrics", anchor: "saas-metrics", desc: "MRR, ARR, NRR, Rule of 40, Burn Multiple" },
      { title: "Cash Forecast", anchor: "cash-forecast", desc: "13-week runway projection" },
      { title: "Reports", anchor: "reports", desc: "Board-ready financial narrative" },
      { title: "Month-End Close", anchor: "close", desc: "Automated close checklist" },
      { title: "Collections", anchor: "collections", desc: "AR aging buckets" },
    ],
  },
  {
    id: "config",
    title: "Configuration",
    icon: Settings,
    items: [
      { title: "Architecture wizard", anchor: "architect", desc: "Business model and COA setup" },
      { title: "AP Policies", anchor: "policies", desc: "Auto-approve, require approval, block rules" },
      { title: "AI model selection", anchor: "ai-models", desc: "Provider, model, API key per org" },
      { title: "Financial settings", anchor: "financial-settings", desc: "Fiscal year, currency, thresholds" },
      { title: "Team management", anchor: "team", desc: "Members and roles" },
    ],
  },
  {
    id: "ai-usage",
    title: "AI Monitoring",
    icon: Zap,
    items: [
      { title: "Token usage dashboard", anchor: "token-usage", desc: "Today / month / all-time token spend" },
      { title: "Cost by agent", anchor: "cost-by-agent", desc: "Which agents consume most tokens" },
      { title: "Provider breakdown", anchor: "providers", desc: "OpenAI / Anthropic / Groq / Gemini / Ollama" },
    ],
  },
]

function AnchorSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-6 space-y-4">
      <h2 className="text-xl font-bold border-b pb-3">{title}</h2>
      {children}
    </div>
  )
}

function DocCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-3">
      <h3 className="font-semibold text-base">{title}</h3>
      <div className="text-sm text-foreground/80 space-y-2 leading-relaxed">{children}</div>
    </div>
  )
}

function Code({ children }: { children: string }) {
  return <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{children}</code>
}

function Badge({ children, color = "default" }: { children: string; color?: "green" | "blue" | "orange" | "red" | "default" }) {
  const map = {
    green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    default: "bg-muted text-muted-foreground",
  }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[color]}`}>{children}</span>
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = React.useState("what-is-ryzha")

  return (
    <div className="flex gap-8 min-h-full">
      <aside className="w-56 shrink-0 hidden lg:block">
        <nav className="sticky top-0 space-y-5 py-1">
          {TOC.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.id} className="space-y-1">
                <div className="flex items-center gap-1.5 px-2 py-1">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">{section.title}</p>
                </div>
                {section.items.map((item) => (
                  <a
                    key={item.anchor}
                    href={`#${item.anchor}`}
                    onClick={() => setActiveSection(item.anchor)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                      activeSection === item.anchor
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <ChevronRight className="h-3 w-3 shrink-0" />
                    {item.title}
                  </a>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 min-w-0 space-y-12 pb-20">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-7 w-7 text-primary" />
            Ryzha Documentation
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete reference for the Ryzha financial data operating system.
          </p>
        </div>

        <AnchorSection id="what-is-ryzha" title="What is Ryzha?">
          <DocCard title="Mission">
            <p>
              Ryzha is a <strong>pre-ERP financial data operating system</strong> for hyper-growth startups. It sits between your 15-25 disconnected financial tools (Stripe, Mercury, Ramp, Gusto, etc.) and your accounting system (QuickBooks), normalising all data into a Unified Financial Event Stream, reconciling continuously, and reporting in real time.
            </p>
            <p>
              Traditional month-end close takes 2-3 weeks. Ryzha reduces this to 2-3 hours by doing continuous reconciliation throughout the month.
            </p>
          </DocCard>
          <DocCard title="The Five Pillars">
            <div className="space-y-2">
              {[
                ["CONNECT", "Pull from 50+ financial platforms via native connectors"],
                ["ARCHITECT", "AI designs your financial data blueprint and COA"],
                ["RECONCILE", "Continuous cross-system truth alignment every 15 minutes"],
                ["REPORT", "Real-time financial intelligence for every stakeholder"],
                ["CLOSE", "Month-end in hours, not weeks"],
              ].map(([pillar, desc]) => (
                <div key={pillar} className="flex items-start gap-3">
                  <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold shrink-0 mt-0.5">{pillar}</code>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="onboarding" title="Onboarding">
          <DocCard title="First-Time Setup">
            <p>When you first sign in, Ryzha runs through a 4-step onboarding flow:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li><strong>Welcome</strong> - Overview of what Ryzha does</li>
              <li><strong>Business model</strong> - SaaS / Marketplace / Services / Usage-based</li>
              <li><strong>Connect</strong> - Link your first integration (QuickBooks recommended)</li>
              <li><strong>Done</strong> - Ryzha generates your financial architecture blueprint</li>
            </ol>
            <p className="mt-2">You can edit your architecture at any time via <strong>Admin → Architecture</strong>.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="data-ownership" title="Data Ownership">
          <DocCard title="Where Your Data Lives">
            <p>
              Ryzha maintains its own PostgreSQL database as an <strong>intermediate processing layer</strong>. Your source-of-truth financial data remains in your connected platforms (QuickBooks, Stripe, Mercury, etc.).
            </p>
            <p>Ryzha stores:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Normalised financial events (the Unified Event Stream)</li>
              <li>AI decision logs (GL coding reasoning, anomaly flags)</li>
              <li>Sync logs (push/pull history to each platform)</li>
              <li>Approval records and audit trail</li>
              <li>Your financial architecture definition (COA mappings, policies)</li>
            </ul>
            <p className="mt-2">Ryzha <strong>never stores</strong> raw bank credentials. OAuth tokens are encrypted at rest. API keys are stored encrypted and never returned in plaintext after submission.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="qb-oauth" title="QuickBooks OAuth">
          <DocCard title="Connecting QuickBooks">
            <p>QuickBooks is your system of record. Ryzha pushes journal entries, bills, and expenses to QB after AI processing.</p>
            <p className="mt-2"><strong>To connect:</strong></p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Go to <strong>Connections</strong> and click QuickBooks</li>
              <li>Enter your QB Client ID, Client Secret, and Redirect URI</li>
              <li>Click <strong>Connect QuickBooks Online</strong></li>
              <li>Authorise access in the Intuit OAuth flow</li>
              <li>Ryzha syncs your Chart of Accounts on first connect</li>
            </ol>
            <p className="mt-2">Tokens auto-refresh before expiry. If a token expires, the connection status shows <Badge color="orange">EXPIRED</Badge> and you can re-authorise from the Connections page.</p>
          </DocCard>
          <DocCard title="What Gets Synced">
            <ul className="list-disc list-inside space-y-1">
              <li>Chart of Accounts pulled on connect and COA sync</li>
              <li>Journal entries pushed from revenue events (ASC 606)</li>
              <li>Bills and expenses pushed from AP workflow</li>
              <li>Bank balances pulled for cash position</li>
            </ul>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="stripe" title="Stripe">
          <DocCard title="Stripe Connector">
            <p>Stripe pulls payment and subscription events and normalises them into the Unified Financial Event Stream.</p>
            <p className="mt-2"><strong>Events ingested:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li><Code>payment_intent.succeeded</Code> → <Code>PAYMENT_RECEIVED</Code></li>
              <li><Code>invoice.paid</Code> → <Code>INVOICE_PAID</Code></li>
              <li><Code>customer.subscription.created/deleted</Code> → MRR movement</li>
              <li><Code>charge.refunded</Code> → <Code>REFUND_ISSUED</Code></li>
            </ul>
            <p className="mt-2">Connect via <strong>Connections → Stripe</strong> using your Stripe secret key. For real-time ingestion, point a Stripe webhook to <Code>/api/webhooks/stripe</Code> and enter the signing secret.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="mercury" title="Mercury">
          <DocCard title="Mercury Connector">
            <p>Mercury pulls bank transactions and account balances for cash position tracking.</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Transactions → <Code>BANK_TRANSACTION</Code> events</li>
              <li>Account balances for real-time cash position</li>
              <li>Wire and ACH transfers</li>
            </ul>
            <p className="mt-2">Connect via API token from Mercury Dashboard → Settings → API.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="ramp" title="Ramp">
          <DocCard title="Ramp Connector">
            <p>Ramp pulls corporate card transactions and routes them through the AP Agent for GL coding and approval.</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Card transactions → <Code>EXPENSE_CREATED</Code> events</li>
              <li>Merchant category codes for AI GL coding</li>
              <li>Department spend allocation</li>
            </ul>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="payroll" title="Payroll (Gusto / Rippling)">
          <DocCard title="Payroll Connectors">
            <p>Payroll connectors ingest payroll run data and route it through the Payroll Agent for department cost allocation.</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Payroll runs → <Code>PAYROLL_PROCESSED</Code> events</li>
              <li>Gross wages split by employer taxes and net pay</li>
              <li>Department allocation based on headcount data</li>
            </ul>
            <p className="mt-2"><Badge color="orange">Coming Soon</Badge> Full OAuth connectors for Gusto and Rippling are in development. Currently supported via manual CSV import or API key.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="coming-soon" title="Coming Soon">
          <DocCard title="Planned Connectors">
            <div className="grid grid-cols-2 gap-2">
              {["Xero", "Salesforce", "HubSpot", "Chargebee", "Zuora", "NetSuite", "Deel", "Paddle", "ADP", "Brex", "Expensify", "BILL"].map((name) => (
                <div key={name} className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="event-lifecycle" title="Event Lifecycle">
          <DocCard title="From Ingestion to Books">
            <div className="space-y-3">
              {[
                { status: "INGESTED", color: "blue" as const, desc: "Event received from source platform. Raw payload stored." },
                { status: "PROCESSING", color: "orange" as const, desc: "GL Coding Agent running. AI classifying to GL account." },
                { status: "PENDING_APPROVAL", color: "orange" as const, desc: "AP policy requires human review before posting." },
                { status: "APPROVED", color: "blue" as const, desc: "Human approved. Queued for push to accounting system." },
                { status: "PUSHING", color: "blue" as const, desc: "Actively writing to QuickBooks via API." },
                { status: "POSTED", color: "green" as const, desc: "Successfully written to QuickBooks. Fully reconciled." },
                { status: "FAILED", color: "red" as const, desc: "Push to QB failed. Check sync log for error. Retry available." },
                { status: "SKIPPED", color: "default" as const, desc: "Event did not meet criteria for processing (e.g. duplicate)." },
              ].map((s) => (
                <div key={s.status} className="flex items-start gap-3">
                  <Badge color={s.color}>{s.status.replace(/_/g, " ")}</Badge>
                  <p className="text-sm">{s.desc}</p>
                </div>
              ))}
            </div>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="event-detail" title="Event Detail View">
          <DocCard title="Inspecting Events">
            <p>Click any event in the Staging Queue to open the detail view. You can see:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Full normalised data fields</li>
              <li>AI agent decisions with confidence score and reasoning</li>
              <li>Approval history (who approved/rejected and when)</li>
              <li>Sync activity log (every push/pull attempt with duration and errors)</li>
              <li>Raw payload from the source platform</li>
            </ul>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="approvals" title="Approvals">
          <DocCard title="Human-in-the-Loop Review">
            <p>When an AP policy rule matches an event (e.g. bill over $5,000 from unknown vendor), the event is routed to the Approvals queue before being posted to QuickBooks.</p>
            <p className="mt-2"><strong>Approve</strong> - Ryzha immediately pushes the journal entry to QuickBooks and marks the event POSTED.</p>
            <p><strong>Reject</strong> - Event is marked FAILED and flagged for investigation.</p>
            <p className="mt-2">Configure routing rules via <strong>Admin → Policies</strong>.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="gl-coding" title="GL Coding Agent">
          <DocCard title="How It Works">
            <p>The GL Coding Agent runs first in every 15-minute sync cycle. For each <Code>INGESTED</Code> event, it:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Fetches your live Chart of Accounts from the QuickBooks connection</li>
              <li>Sends the event (vendor, amount, type, description) to your configured AI model</li>
              <li>AI returns the best matching GL account code, name, and confidence score</li>
              <li>Falls back to rule-based matching if AI is unavailable</li>
              <li>Writes the GL code to the event and logs the AI decision</li>
            </ol>
            <p className="mt-2">Configure the AI model via <strong>Settings → AI Models</strong>. Trigger manually via the agent API or from the AI Monitoring page.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="revenue-agent" title="Revenue Agent">
          <DocCard title="ASC 606 Revenue Recognition">
            <p>The Revenue Agent processes <Code>PAYMENT_RECEIVED</Code> and <Code>INVOICE_PAID</Code> events and posts journal entries to QuickBooks following ASC 606 / IFRS 15 rules defined in your architecture.</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Point in time</strong> - Revenue recognised immediately on payment</li>
              <li><strong>Over time</strong> - Revenue spread across contract duration via deferred revenue schedule</li>
              <li><strong>Milestone</strong> - Revenue recognised at defined deliverable points</li>
            </ul>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="cash-agent" title="Cash Agent">
          <DocCard title="Bank Reconciliation">
            <p>The Cash Agent matches bank transactions from Mercury against posted events in the event stream. It auto-reconciles matched items and surfaces unmatched transactions as exceptions in the Reconcile view.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="ap-agent" title="AP Agent">
          <DocCard title="3-Way Match and Approval Routing">
            <p>For each <Code>EXPENSE_CREATED</Code> or <Code>BILL_CREATED</Code> event, the AP Agent:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>Checks the event against active AP policy rules</li>
              <li>Auto-approves if within policy thresholds</li>
              <li>Routes to Approvals queue if a rule requires human review</li>
              <li>Blocks if the event matches a blocking rule</li>
            </ol>
            <p className="mt-2">Configure policies in <strong>Admin → Policies</strong>.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="anomaly-agent" title="Anomaly Agent">
          <DocCard title="Two-Layer Detection">
            <p>The Anomaly Agent uses a two-layer approach:</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li><strong>Statistical rules</strong> - Amount spikes (3x historical average), duplicate detection (same amount/source within 24h)</li>
              <li><strong>AI analysis</strong> - Sends the top 20 recent events to your configured AI model for contextual anomaly detection</li>
            </ol>
            <p className="mt-2">Anomaly flags appear in the AI Decision Log on each event's detail page.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="close-agent" title="Close Agent">
          <DocCard title="Month-End Automation">
            <p>The Close Agent generates a month-end close checklist automatically. Since Ryzha reconciles continuously, most items are already complete by month-end.</p>
            <p className="mt-2">The agent auto-generates:</p>
            <ul className="list-disc list-inside space-y-1 mt-1">
              <li>Prepayment amortisation entries</li>
              <li>Accrued expense entries</li>
              <li>Depreciation entries</li>
              <li>FX revaluation entries</li>
              <li>Deferred revenue schedules</li>
            </ul>
            <p className="mt-2">Trigger from <strong>Month-End Close</strong> in the sidebar. Remaining exceptions require human review (~2 hours).</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="board-report" title="Board Report Agent">
          <DocCard title="AI Financial Narrative">
            <p>The Board Report Agent generates a board-ready financial commentary using your configured AI model. It pulls live metrics (MRR, ARR, burn, runway) and writes 3-4 paragraphs explaining variances, risks, and forward outlook.</p>
            <p className="mt-2">Generated from <strong>Reports</strong> in the sidebar. Output can be copied directly into board decks.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="cron" title="Cron Schedule">
          <DocCard title="When Agents Run">
            <div className="space-y-3">
              {[
                { schedule: "Every 15 min", agents: "GL Coding, Revenue, Cash, AP, Anomaly" },
                { schedule: "Daily (overnight)", agents: "Payroll, Cash Forecast refresh, Budget check" },
                { schedule: "Monthly", agents: "Close, Flux Analysis, Board Report, Compliance" },
              ].map((row) => (
                <div key={row.schedule} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <code className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded shrink-0 mt-0.5">{row.schedule}</code>
                  <p className="text-sm">{row.agents}</p>
                </div>
              ))}
            </div>
            <p className="mt-3">Agents are also triggered by webhooks (e.g. Stripe payment fires Revenue Agent immediately). Trigger any agent manually via the <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">POST /api/agents/[agentName]</code> endpoints.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="saas-metrics" title="SaaS Metrics">
          <DocCard title="Calculated Metrics">
            <p>All metrics are calculated from the Unified Financial Event Stream in real time:</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-2">
              {["MRR / ARR", "Net Revenue Retention", "Gross Revenue Retention", "CAC by channel", "LTV by segment", "CAC Payback Period", "Rule of 40", "Burn Multiple", "Magic Number", "Cohort revenue retention"].map((m) => (
                <div key={m} className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="cash-forecast" title="Cash Forecast">
          <DocCard title="13-Week Runway Projection">
            <p>The Cash Forecast page shows both actuals (posted events) and a 13-week forward projection. The projection uses your average weekly inflow and outflow from the past 13 weeks to project cash balance week by week.</p>
            <p className="mt-2">Rows turn <strong className="text-orange-500">orange</strong> when projected balance falls below 20% of current balance, and <strong className="text-red-500">red</strong> when cash runs out. Set your starting bank balance via <strong>Settings → Financial Configuration</strong>.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="architect" title="Architecture Wizard">
          <DocCard title="Financial Blueprint">
            <p>The Architecture wizard (Admin → Architecture) lets you define:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Business model (SaaS, marketplace, services, usage-based)</li>
              <li>Revenue recognition standard (ASC 606 / IFRS 15)</li>
              <li>Recognition method (point in time, over time, milestone)</li>
              <li>Cost centres and department structure</li>
              <li>Board metrics definitions</li>
            </ul>
            <p className="mt-2">This blueprint drives how agents classify events, recognise revenue, and allocate costs.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="policies" title="AP Policies">
          <DocCard title="Approval Rules">
            <p>Policies define how the AP Agent routes transactions. Each rule has:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Condition</strong> - amount threshold, vendor name pattern, category match</li>
              <li><strong>Action</strong> - AUTO_APPROVE, REQUIRE_APPROVAL, BLOCK, FLAG</li>
              <li><strong>Priority</strong> - lower number = evaluated first</li>
            </ul>
            <p className="mt-2">Example: "All bills over $5,000 require approval" + "All AWS expenses auto-approve" = engineering cloud costs flow through automatically while large unknown vendors are held for review.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="ai-models" title="AI Model Selection">
          <DocCard title="Supported Providers">
            <div className="space-y-2">
              {[
                { provider: "OpenAI", models: "gpt-4o, gpt-4o-mini, gpt-4-turbo", note: "Default provider" },
                { provider: "Anthropic", models: "claude-3-5-sonnet, claude-3-5-haiku, claude-3-opus", note: "" },
                { provider: "Groq", models: "llama-3.3-70b, llama-3.1-70b, mixtral-8x7b", note: "Fastest inference" },
                { provider: "Google Gemini", models: "gemini-2.0-flash, gemini-1.5-pro", note: "" },
                { provider: "Ollama", models: "llama3, mistral, mixtral", note: "Local - no API key needed" },
              ].map((p) => (
                <div key={p.provider} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{p.provider} {p.note && <span className="text-xs text-muted-foreground ml-1">{p.note}</span>}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{p.models}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3">Configure in <strong>Settings → AI Models</strong>. Store your API key per-org (encrypted). Leave blank to use environment variable fallback.</p>
          </DocCard>
        </AnchorSection>

        <AnchorSection id="token-usage" title="AI Token Monitoring">
          <DocCard title="Usage Tracking">
            <p>Every AI call made by any agent is logged to the AI Usage Log with token counts, model, provider, and feature. The AI Monitoring page (<strong>Intelligence → AI Monitoring</strong>) shows:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Today / this month / all-time token totals</li>
              <li>Monthly trend bar chart</li>
              <li>Breakdown by agent feature</li>
              <li>Breakdown by model and provider</li>
              <li>Last 100 API calls with full detail</li>
            </ul>
            <p className="mt-2">Use a cheaper model (e.g. <Code>gpt-4o-mini</Code> or <Code>gemini-2.0-flash</Code>) for the GL Coding Agent which runs at high volume, and a more capable model for Board Reports.</p>
          </DocCard>
        </AnchorSection>

        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 space-y-2">
          <p className="font-semibold text-primary">Need help?</p>
          <p className="text-sm text-muted-foreground">
            Ryzha is in active development. For questions, feature requests, or bug reports, reach out via{" "}
            <a href="https://ryzha.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
              ryzha.ai <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
