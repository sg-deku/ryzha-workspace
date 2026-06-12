"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import {
  Building2, Cpu, Users, Bell, ShieldCheck, LogOut, ExternalLink,
  CheckCircle2, Loader2, AlertCircle, Plug, Bot, Eye, EyeOff, Zap, Clock,
  Play, Info
} from "lucide-react"
import Link from "next/link"

type Tab = "general" | "financial" | "team" | "notifications" | "security" | "ai" | "agents"

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "general",       label: "General",          icon: Building2  },
  { id: "financial",     label: "Financial Config",  icon: Cpu        },
  { id: "ai",            label: "AI Models",         icon: Bot        },
  { id: "agents",        label: "Agent Schedule",    icon: Clock      },
  { id: "team",          label: "Team",              icon: Users      },
  { id: "notifications", label: "Notifications",     icon: Bell       },
  { id: "security",      label: "Security",          icon: ShieldCheck},
]

interface Member {
  id: string
  name: string | null
  email: string | null
  role: string
  joinedAt: Date
}

interface Props {
  org: { id: string; name: string; status: string } | null
  members: Member[]
  architecture: {
    businessModel: string
    billingModel: string
    revenueRecognition: unknown
    departmentStructure: unknown
    metricsDefinitions: unknown
  } | null
  currentUserId: string
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">{children}</p>
}

function Field({ label, helpText, children }: { label: string; helpText?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {helpText && <p className="text-xs text-muted-foreground">{helpText}</p>}
    </div>
  )
}

function Input({ defaultValue, placeholder }: { defaultValue?: string; placeholder?: string }) {
  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
    />
  )
}

function Select({ value, options }: { value?: string; options: { value: string; label: string }[] }) {
  return (
    <select
      defaultValue={value}
      className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SaveButton() {
  return (
    <button
      type="submit"
      className="mt-2 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors"
    >
      Save changes
    </button>
  )
}

function Toggle({ label, description, defaultChecked }: { label: string; description: string; defaultChecked?: boolean }) {
  const [checked, setChecked] = React.useState(defaultChecked ?? false)
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => setChecked((v) => !v)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${checked ? "bg-primary" : "bg-muted-foreground/25"}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  )
}

function GeneralTab({ org }: { org: Props["org"] }) {
  const [name, setName] = React.useState(org?.name ?? "")
  const [baseCurrency, setBaseCurrency] = React.useState("USD")
  const [fiscalYearEnd, setFiscalYearEnd] = React.useState("December")
  const [timezone, setTimezone] = React.useState("America/New_York")
  const [dateFormat, setDateFormat] = React.useState("MM/DD/YYYY")
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/settings/org")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setName(d.name)
        if (d.baseCurrency) setBaseCurrency(d.baseCurrency)
        if (d.fiscalYearEnd) setFiscalYearEnd(d.fiscalYearEnd)
      })
      .catch(() => {})
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/settings/org", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, baseCurrency, fiscalYearEnd, timezone, dateFormat }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave}>
        <div className="rounded-xl border bg-card p-6 space-y-5">
          <SectionLabel>Organisation</SectionLabel>
          <Field label="Company name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base currency" helpText="Used for all reporting and normalisation">
              <select
                value={baseCurrency}
                onChange={(e) => setBaseCurrency(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[
                  { value: "USD", label: "USD - US Dollar" },
                  { value: "EUR", label: "EUR - Euro" },
                  { value: "GBP", label: "GBP - British Pound" },
                  { value: "CAD", label: "CAD - Canadian Dollar" },
                  { value: "AUD", label: "AUD - Australian Dollar" },
                ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Fiscal year end" helpText="Last month of your accounting year">
              <select
                value={fiscalYearEnd}
                onChange={(e) => setFiscalYearEnd(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Timezone">
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[
                  { value: "America/New_York",    label: "Eastern Time (ET)"    },
                  { value: "America/Chicago",     label: "Central Time (CT)"    },
                  { value: "America/Denver",      label: "Mountain Time (MT)"   },
                  { value: "America/Los_Angeles", label: "Pacific Time (PT)"    },
                  { value: "Europe/London",       label: "London (GMT/BST)"     },
                  { value: "Europe/Berlin",       label: "Central Europe (CET)" },
                  { value: "Asia/Kolkata",        label: "India (IST)"          },
                  { value: "Asia/Singapore",      label: "Singapore (SGT)"      },
                ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
            <Field label="Date format">
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {[
                  { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                  { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
                ].map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
            {saved ? "Saved!" : saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <SectionLabel>Integrations</SectionLabel>
        <p className="text-sm text-muted-foreground">
          Manage your connected platforms - accounting systems, payroll, banking, CRM, and revenue tools.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/connect"
            className="flex items-center gap-2 text-sm font-medium rounded-lg border px-4 py-2 hover:bg-muted transition-colors"
          >
            <Plug className="h-4 w-4" /> Manage Connections
          </Link>
          <Link
            href="/settings/integrations"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            View integration details <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function FinancialTab({ architecture }: { architecture: Props["architecture"] }) {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <SectionLabel>Business Model</SectionLabel>
          <p className="text-xs text-muted-foreground mb-4">
            Ryzha uses this to configure your Chart of Accounts mapping, revenue recognition policy, and SaaS metrics definitions automatically.
          </p>
        </div>
        <Field label="Business model" helpText="How your company primarily generates revenue">
          <Select value={architecture?.businessModel ?? "saas"} options={[
            { value: "saas",        label: "SaaS - Recurring subscriptions"          },
            { value: "marketplace", label: "Marketplace - GMV / take rate"           },
            { value: "services",    label: "Professional Services - project / T&M"   },
            { value: "usage_based", label: "Usage-based - consumption billing"        },
            { value: "hybrid",      label: "Hybrid - multiple models"                },
          ]} />
        </Field>
        <Field label="Billing model">
          <Select value={architecture?.billingModel ?? "monthly"} options={[
            { value: "annual",    label: "Annual contracts (upfront)"      },
            { value: "monthly",   label: "Month-to-month"                  },
            { value: "usage",     label: "Usage / metered"                 },
            { value: "milestone", label: "Milestone-based"                  },
            { value: "blended",   label: "Blended (annual + monthly)"      },
          ]} />
        </Field>
        <SaveButton />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <SectionLabel>Revenue Recognition</SectionLabel>
        <Field label="Accounting standard" helpText="Applied automatically by the R2R agent to every revenue event">
          <Select value="asc606" options={[
            { value: "asc606",  label: "ASC 606 (US GAAP)"  },
            { value: "ifrs15",  label: "IFRS 15"             },
            { value: "cash",    label: "Cash basis"           },
          ]} />
        </Field>
        <Field label="Default recognition timing">
          <Select value="over_time" options={[
            { value: "immediate",  label: "Point in time - recognise on invoice paid"  },
            { value: "over_time",  label: "Over time - spread across contract duration" },
            { value: "milestone",  label: "Milestone - recognise per deliverable"       },
          ]} />
        </Field>
        <SaveButton />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <SectionLabel>SaaS Metrics Definitions</SectionLabel>
        <p className="text-xs text-muted-foreground">
          Controls how the Reports page calculates ARR, MRR, NRR, CAC, LTV and churn. These definitions are applied by the Reporting agent.
        </p>
        <Field label="ARR calculation" helpText="How to derive Annual Recurring Revenue from subscription data">
          <Select value="mrr_x12" options={[
            { value: "mrr_x12",    label: "MRR × 12 (most common)"               },
            { value: "acv",        label: "ACV from contract value"               },
            { value: "committed",  label: "Committed ARR (signed, not started)"   },
          ]} />
        </Field>
        <Field label="Churn definition">
          <Select value="logo_revenue" options={[
            { value: "logo",           label: "Logo churn (customer count)"         },
            { value: "revenue",        label: "Revenue churn (MRR lost)"            },
            { value: "logo_revenue",   label: "Both logo and revenue churn"          },
          ]} />
        </Field>
        <Field label="CAC period">
          <Select value="3_month" options={[
            { value: "1_month",  label: "1-month trailing"  },
            { value: "3_month",  label: "3-month trailing"  },
            { value: "6_month",  label: "6-month trailing"  },
            { value: "12_month", label: "12-month trailing" },
          ]} />
        </Field>
        <SaveButton />
      </div>
    </div>
  )
}

const ROLE_COLORS: Record<string, string> = {
  OWNER:      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN:      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  CONTROLLER: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  MEMBER:     "bg-muted text-muted-foreground",
  VIEWER:     "bg-muted text-muted-foreground",
}

function TeamTab({ members: initialMembers, currentUserId }: { members: Member[]; currentUserId: string }) {
  const [members, setMembers] = React.useState(initialMembers)
  const [showInvite, setShowInvite] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("MEMBER")
  const [inviting, setInviting] = React.useState(false)
  const [inviteResult, setInviteResult] = React.useState<{ ok: boolean; message: string } | null>(null)
  const [removing, setRemoving] = React.useState<string | null>(null)

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteResult(null)
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const json = await res.json()
      if (res.ok) {
        setInviteResult({ ok: true, message: json.alreadyMember ? "Already a member" : `Invited as ${inviteRole}` })
        setInviteEmail("")
        if (!json.alreadyMember) {
          setMembers((prev) => [
            ...prev,
            { id: json.userId, name: null, email: inviteEmail, role: inviteRole, joinedAt: new Date() },
          ])
        }
        setTimeout(() => { setShowInvite(false); setInviteResult(null) }, 1800)
      } else {
        setInviteResult({ ok: false, message: json.error ?? "Invite failed" })
      }
    } catch {
      setInviteResult({ ok: false, message: "Network error" })
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId: string) {
    if (!confirm("Remove this member from the workspace?")) return
    setRemoving(userId)
    try {
      const res = await fetch(`/api/team/${userId}/remove`, { method: "DELETE" })
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== userId))
      }
    } finally {
      setRemoving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <p className="font-semibold">{members.length} member{members.length !== 1 ? "s" : ""}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Manage access to your Ryzha workspace</p>
          </div>
          <button
            type="button"
            onClick={() => { setShowInvite((v) => !v); setInviteResult(null) }}
            className="text-sm font-medium rounded-lg bg-primary text-primary-foreground px-3 py-1.5 hover:bg-primary/90 transition-colors"
          >
            Invite member
          </button>
        </div>

        {showInvite && (
          <form onSubmit={handleInvite} className="px-5 py-4 border-b bg-muted/10 space-y-3">
            <div className="flex gap-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {["ADMIN", "CONTROLLER", "MEMBER", "VIEWER"].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={inviting}
                className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {inviting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {inviting ? "Inviting..." : "Invite"}
              </button>
            </div>
            {inviteResult && (
              <p className={`text-xs flex items-center gap-1.5 ${inviteResult.ok ? "text-emerald-600" : "text-red-500"}`}>
                {inviteResult.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                {inviteResult.message}
              </p>
            )}
          </form>
        )}

        <div className="divide-y">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {(m.name ?? m.email ?? "U").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {m.name ?? m.email}
                    {m.id === currentUserId && (
                      <span className="ml-2 text-xs text-muted-foreground font-normal">(you)</span>
                    )}
                  </p>
                  {m.name && <p className="text-xs text-muted-foreground truncate">{m.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[m.role] ?? ROLE_COLORS.MEMBER}`}>
                  {m.role}
                </span>
                {m.id !== currentUserId && m.role !== "OWNER" && (
                  <button
                    type="button"
                    disabled={removing === m.id}
                    onClick={() => handleRemove(m.id)}
                    className="text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {removing === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Remove"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <SectionLabel>Roles & Permissions</SectionLabel>
        <div className="space-y-2 text-sm">
          {[
            { role: "Owner",      desc: "Full access, billing, can delete workspace"                        },
            { role: "Admin",      desc: "Full access, manage team, cannot delete workspace"                  },
            { role: "Controller", desc: "Can approve events, manage COA mappings, configure policies"        },
            { role: "Member",     desc: "Can view all data, submit events for approval"                      },
            { role: "Viewer",     desc: "Read-only access to overview, reports and reconcile"                },
          ].map(({ role, desc }) => (
            <div key={role} className="flex items-start gap-3 text-sm">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-24 shrink-0 text-center ${ROLE_COLORS[role.toUpperCase()] ?? ROLE_COLORS.MEMBER}`}>
                {role}
              </span>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function NotificationsTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <SectionLabel>Email Alerts</SectionLabel>
        <div className="space-y-5 divide-y">
          {[
            { label: "Failed events",       description: "Notify when a financial event fails to push to your accounting system", defaultChecked: true  },
            { label: "Pending approvals",   description: "Daily digest of events awaiting your approval",                         defaultChecked: true  },
            { label: "Sync errors",         description: "Alert when a platform connection fails to sync",                        defaultChecked: true  },
            { label: "Reconciliation gaps", description: "Notify when events remain unreconciled for more than 48 hours",        defaultChecked: false },
            { label: "Weekly summary",      description: "Every Monday: events processed, ARR movement, cash position delta",    defaultChecked: false },
          ].map((item) => (
            <div key={item.label} className="pt-4 first:pt-0">
              <Toggle {...item} />
            </div>
          ))}
        </div>
        <SaveButton />
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <SectionLabel>Slack Notifications</SectionLabel>
        <Field label="Webhook URL" helpText="Create an Incoming Webhook at api.slack.com/messaging/webhooks and paste the URL here.">
          <input
            type="url"
            placeholder="https://hooks.slack.com/services/..."
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>
        <div className="space-y-4 pt-1">
          <Toggle label="Failed event alerts in Slack" description="Post to Slack when an event fails" defaultChecked={false} />
          <Toggle label="Approval requests in Slack" description="Ping approvers in Slack when events need sign-off" defaultChecked={false} />
        </div>
        <SaveButton />
      </div>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <SectionLabel>Session</SectionLabel>
        <p className="text-sm text-muted-foreground">
          You are currently signed in. Sessions use secure HTTP-only JWT cookies and expire after 30 days of inactivity.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm text-red-500 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Sign out of this session
        </button>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-4">
        <SectionLabel>Two-Factor Authentication</SectionLabel>
        <div className="flex items-start gap-3 rounded-lg border-2 border-dashed border-muted p-4">
          <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">2FA coming soon</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              TOTP-based two-factor authentication will be available in a future release.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-card p-6 space-y-4">
        <SectionLabel>Danger Zone</SectionLabel>
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Export all data</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download all financial events, AI decision logs, and sync history as JSON.
              </p>
            </div>
            <button className="text-xs border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors shrink-0">
              Export
            </button>
          </div>
          <div className="h-px bg-border" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-red-500">Delete workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Permanently removes all connections, events, and configuration. This cannot be undone.
              </p>
            </div>
            <button className="text-xs text-red-500 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors shrink-0">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PROVIDERS = [
  { value: "openai",    label: "OpenAI",          models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic",        models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"] },
  { value: "groq",      label: "Groq (Llama 3)",   models: ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"] },
  { value: "gemini",    label: "Google Gemini",    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"] },
  { value: "ollama",    label: "Ollama (Local)",   models: ["llama3", "llama3.1", "mistral", "mixtral"] },
]

function AITab() {
  const [provider, setProvider] = React.useState("openai")
  const [model, setModel] = React.useState("gpt-4o-mini")
  const [apiKey, setApiKey] = React.useState("")
  const [hasKey, setHasKey] = React.useState(false)
  const [showKey, setShowKey] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/settings/ai")
      .then((r) => r.json())
      .then((d) => {
        setProvider(d.aiProvider ?? "openai")
        setModel(d.aiModel ?? "gpt-4o-mini")
        setHasKey(!!d.hasApiKey)
      })
      .finally(() => setLoading(false))
  }, [])

  const currentProvider = PROVIDERS.find((p) => p.value === provider)

  async function save() {
    setSaving(true)
    try {
      await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiProvider: provider, aiModel: model, aiApiKey: apiKey || undefined }),
      })
      setSaved(true)
      if (apiKey) setHasKey(true)
      setApiKey("")
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <div>
          <SectionLabel>AI Model Configuration</SectionLabel>
          <p className="text-xs text-muted-foreground">
            Choose which AI provider and model powers Ryzha's agents - GL coding, anomaly detection, board reports, and more. Each agent uses this model unless overridden.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Provider</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PROVIDERS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  setProvider(p.value)
                  setModel(p.models[0])
                }}
                className={`rounded-lg border px-3 py-2.5 text-sm text-left transition-colors ${
                  provider === p.value
                    ? "border-primary bg-primary/5 text-primary font-medium"
                    : "border-border hover:border-muted-foreground/40"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {currentProvider?.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
            <option value="__custom__">Custom model…</option>
          </select>
          {model === "__custom__" && (
            <input
              type="text"
              placeholder="Enter exact model name e.g. gpt-4o, llama3.2"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              onChange={(e) => setModel(e.target.value)}
            />
          )}
          <p className="text-xs text-muted-foreground">
            Tip: Use a faster/cheaper model for GL coding (high volume) and a more capable model for board reports.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium">API Key</label>
          <div className="relative">
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasKey ? "••••••••  (key saved - enter new to replace)" : `Enter your ${currentProvider?.label ?? ""} API key`}
              className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {provider === "ollama" && (
            <p className="text-xs text-muted-foreground">Ollama runs locally - no API key needed. Make sure Ollama is running on <code>localhost:11434</code>.</p>
          )}
          {provider !== "ollama" && !hasKey && (
            <p className="text-xs text-muted-foreground">
              Leave blank to use the system default key from environment variables (if configured).
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={save}
          className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
          {saved ? "Saved!" : saving ? "Saving…" : "Save AI Configuration"}
        </button>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-3">
        <SectionLabel>Agent Feature Mapping</SectionLabel>
        <p className="text-xs text-muted-foreground mb-3">All agents use the configured model above. Token usage is tracked per agent on the monitoring page.</p>
        <div className="space-y-2">
          {[
            { feature: "agent_gl_coding",    label: "GL Coding Agent",     desc: "Classifies every financial event into the right GL account" },
            { feature: "agent_anomaly",       label: "Anomaly Agent",       desc: "Detects suspicious patterns and unusual transactions" },
            { feature: "agent_board_report",  label: "Board Report Agent",  desc: "Generates financial narrative for board presentations" },
          ].map((item) => (
            <div key={item.feature} className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <code className="text-xs bg-muted px-2 py-0.5 rounded shrink-0 mt-0.5">{model}</code>
            </div>
          ))}
        </div>
        <Link
          href="/ai-usage"
          className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
        >
          <Zap className="h-3.5 w-3.5" /> View token usage monitoring →
        </Link>
      </div>
    </div>
  )
}

const AGENT_GROUPS = [
  {
    label: "Every 15 minutes",
    schedule: "*/15 * * * *",
    agents: [
      { key: "connectorsEnabled",  label: "Connector Sync",        desc: "Pull new events from all connected platforms (Stripe, Mercury, Gusto, Ramp)" },
      { key: "glCodingEnabled",    label: "GL Coding Agent",        desc: "Auto-assign GL account codes to ingested events using AI" },
      { key: "revenueEnabled",     label: "Revenue Agent",          desc: "ASC 606 recognition validation and journal entry generation" },
      { key: "cashEnabled",        label: "Cash Agent",             desc: "Bank feed vs QuickBooks cash account reconciliation" },
      { key: "apEnabled",          label: "AP Agent",               desc: "3-way match on bills: Ramp/BILL vs QuickBooks vs purchase orders" },
      { key: "anomalyEnabled",     label: "Anomaly Agent",          desc: "Cross-system pattern analysis to flag outliers" },
    ],
  },
  {
    label: "Daily (overnight)",
    schedule: "0 2 * * *",
    agents: [
      { key: "payrollEnabled",     label: "Payroll Agent",          desc: "Validate Gusto/Rippling payroll vs QuickBooks expense allocation" },
      { key: "fxEnabled",          label: "FX Agent",               desc: "Revalue foreign currency positions at daily exchange rates" },
      { key: "headcountEnabled",   label: "Headcount Agent",        desc: "Validate payroll amounts against headcount records" },
      { key: "collectionsEnabled", label: "Collections Agent",      desc: "AI-drafted dunning emails for overdue AR" },
    ],
  },
  {
    label: "Monthly (1st of month)",
    schedule: "0 6 1 * *",
    agents: [
      { key: "closeEnabled",       label: "Close Agent",            desc: "Execute automated month-end close checklist" },
      { key: "boardReportEnabled", label: "Board Report Agent",     desc: "Generate AI financial narrative for board deck" },
      { key: "complianceEnabled",  label: "Compliance Agent",       desc: "Validate rev rec policy, flag duplicates and unapproved expenses" },
    ],
  },
]

const CRON_GROUP_KEYS: Record<string, string> = {
  "Every 15 minutes": "sync",
  "Daily (overnight)": "daily",
  "Monthly (1st of month)": "monthly",
}

function AgentsTab() {
  const [config, setConfig] = React.useState<Record<string, boolean>>({})
  const [schedules, setSchedules] = React.useState<Record<string, string>>({
    sync: "*/15 * * * *",
    daily: "0 2 * * *",
    monthly: "1 0 1 * *",
  })
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [running, setRunning] = React.useState<string | null>(null)
  const [runResult, setRunResult] = React.useState<Record<string, string>>({})

  React.useEffect(() => {
    fetch("/api/settings/agents")
      .then((r) => r.json())
      .then((d) => {
        setConfig(d.agentConfig ?? {})
        if (d.cronSchedules) setSchedules((prev) => ({ ...prev, ...d.cronSchedules }))
      })
      .finally(() => setLoading(false))
  }, [])

  function toggle(key: string) {
    setConfig((prev) => ({ ...prev, [key]: prev[key] === false ? true : false }))
  }

  function isEnabled(key: string) {
    return config[key] !== false
  }

  function updateSchedule(groupKey: string, value: string) {
    setSchedules((prev) => ({ ...prev, [groupKey]: value }))
  }

  async function save() {
    setSaving(true)
    try {
      await fetch("/api/settings/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentConfig: config, cronSchedules: schedules }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  async function runNow(groupKey: string) {
    setRunning(groupKey)
    setRunResult((prev) => ({ ...prev, [groupKey]: "" }))
    try {
      const res = await fetch("/api/cron/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group: groupKey }),
      })
      const json = await res.json()
      if (res.ok) {
        setRunResult((prev) => ({ ...prev, [groupKey]: `Completed at ${new Date(json.ranAt).toLocaleTimeString()}` }))
      } else {
        setRunResult((prev) => ({ ...prev, [groupKey]: json.error ?? "Failed" }))
      }
    } catch {
      setRunResult((prev) => ({ ...prev, [groupKey]: "Run failed" }))
    } finally {
      setRunning(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 p-4 flex gap-3">
        <Info className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-800 dark:text-amber-300">About schedule changes</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            Edited schedules are saved and displayed here. To apply them to Vercel Cron in production, update <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 rounded">vercel.json</code> and redeploy. Use <strong>Run now</strong> to trigger any group immediately without waiting for the schedule.
          </p>
        </div>
      </div>

      {AGENT_GROUPS.map((group) => {
        const groupKey = CRON_GROUP_KEYS[group.label] ?? "sync"
        const isRunning = running === groupKey
        const result = runResult[groupKey]
        return (
          <div key={group.label} className="rounded-xl border bg-card overflow-hidden">
            <div className="flex items-start justify-between gap-4 px-5 py-4 border-b bg-muted/20">
              <div className="flex-1 min-w-0 space-y-2">
                <p className="text-sm font-semibold">{group.label}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <input
                    value={schedules[groupKey] ?? group.schedule}
                    onChange={(e) => updateSchedule(groupKey, e.target.value)}
                    className="font-mono text-xs bg-muted/50 border border-border rounded px-2 py-1 w-44 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="cron expression"
                    spellCheck={false}
                  />
                  <span className="text-[10px] text-muted-foreground">cron expression</span>
                </div>
                {result && (
                  <p className={`text-xs flex items-center gap-1 ${result.startsWith("Completed") ? "text-emerald-600 dark:text-emerald-400" : "text-red-500"}`}>
                    {result.startsWith("Completed") ? <CheckCircle2 className="h-3 w-3" /> : null}
                    {result}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => runNow(groupKey)}
                disabled={isRunning}
                className="flex items-center gap-1.5 text-xs font-medium border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors disabled:opacity-60 shrink-0"
              >
                {isRunning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                {isRunning ? "Running..." : "Run now"}
              </button>
            </div>
            <div className="divide-y">
              {group.agents.map((agent) => {
                const enabled = isEnabled(agent.key)
                return (
                  <div key={agent.key} className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{agent.label}</p>
                        {!enabled && (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-medium">Disabled</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.desc}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      onClick={() => toggle(agent.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 mt-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${enabled ? "bg-primary" : "bg-muted-foreground/25"}`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ${enabled ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <button
        type="button"
        disabled={saving}
        onClick={save}
        className="flex items-center gap-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium px-4 py-2 hover:bg-primary/90 transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
        {saved ? "Saved!" : saving ? "Saving..." : "Save Configuration"}
      </button>
    </div>
  )
}

export function SettingsTabs({ org, members, architecture, currentUserId }: Props) {
  const [active, setActive] = React.useState<Tab>("general")

  return (
    <div className="space-y-6">
      <div className="flex border-b gap-0 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
                active === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {active === "general"       && <GeneralTab org={org} />}
      {active === "financial"     && <FinancialTab architecture={architecture} />}
      {active === "ai"            && <AITab />}
      {active === "agents"        && <AgentsTab />}
      {active === "team"          && <TeamTab members={members} currentUserId={currentUserId} />}
      {active === "notifications" && <NotificationsTab />}
      {active === "security"      && <SecurityTab />}
    </div>
  )
}
