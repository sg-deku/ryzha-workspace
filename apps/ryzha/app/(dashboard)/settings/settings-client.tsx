"use client"

import * as React from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Building2,
  Hash,
  Brain,
  Zap,
  Users,
  ShieldCheck,
} from "lucide-react"
import OrganizationSettingsPage from "./organization/page-client"
import NumberingSettingsClient from "./numbering/numbering-client"
import FinancialEngineClient from "./financial-engine/financial-engine-client"
import { AIUsagePage } from "./ai-usage/ai-usage-client"
import UsersManagementPage from "./users/page-client"

interface SettingsClientProps {
  org: any
  financialSettings: any
  numberingSettings: any
  userRole: string
}

const isAdmin = (role: string) => ["admin", "owner", "superadmin"].includes(role)

interface TabDef {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

interface TabGroup {
  label: string
  tabs: TabDef[]
}

const TAB_GROUPS: TabGroup[] = [
  {
    label: "Organization",
    tabs: [
      { id: "general", label: "General", icon: Building2 },
      { id: "numbering", label: "Numbering", icon: Hash },
    ],
  },
  {
    label: "AI & Automation",
    tabs: [
      { id: "financial-engine", label: "Financial Engine", icon: Brain },
      { id: "ai-usage", label: "AI Usage", icon: Zap },
    ],
  },
  {
    label: "Administration",
    tabs: [
      { id: "users", label: "Users", icon: Users, adminOnly: true },
      { id: "security", label: "Security", icon: ShieldCheck, adminOnly: true },
    ],
  },
]

export function SettingsClient({
  org,
  financialSettings,
  numberingSettings,
  userRole,
}: SettingsClientProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = searchParams.get("tab") ?? "general"

  const setTab = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", id)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="w-56 shrink-0 border-r bg-muted/30 overflow-y-auto">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold">Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Organization configuration</p>
        </div>

        <nav className="p-2 space-y-4">
          {TAB_GROUPS.map((group) => {
            const visibleTabs = group.tabs.filter(
              (t) => !t.adminOnly || isAdmin(userRole)
            )
            if (visibleTabs.length === 0) return null
            return (
              <div key={group.label}>
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleTabs.map((tab) => {
                    const Icon = tab.icon
                    const active = activeTab === tab.id
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setTab(tab.id)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors text-left",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-4xl">
          {activeTab === "general" && (
            <OrganizationSettingsPage organization={org} />
          )}

          {activeTab === "numbering" && (
            <NumberingSettingsClient settings={numberingSettings} />
          )}

          {activeTab === "financial-engine" && (
            <FinancialEngineClient initialData={financialSettings} />
          )}

          {activeTab === "ai-usage" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">AI Usage</h2>
                <p className="text-muted-foreground mt-1">Token consumption across all AI features and agents.</p>
              </div>
              <AIUsagePage />
            </div>
          )}

          {activeTab === "users" && isAdmin(userRole) && (
            <UsersManagementPage />
          )}

          {activeTab === "security" && isAdmin(userRole) && (
            <SecurityTab />
          )}
        </div>
      </main>
    </div>
  )
}

function SecurityTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Security</h2>
        <p className="text-muted-foreground mt-1">Compliance and access control settings.</p>
      </div>

      <div className="rounded-lg border divide-y">
        <div className="p-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Audit Log</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Full field-level trail of all financial mutations. Required for SOC 2.
            </p>
          </div>
          <a
            href="/audit-log"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View Audit Log →
          </a>
        </div>
        <div className="p-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Session Timeout</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Automatically sign out inactive users. Configurable via your auth provider.
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming soon</span>
        </div>
        <div className="p-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Enforce 2FA for all users in your organization.
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming soon</span>
        </div>
        <div className="p-5 flex items-start justify-between gap-4">
          <div>
            <p className="font-medium text-sm">IP Allowlist</p>
            <p className="text-sm text-muted-foreground mt-0.5">
              Restrict access to specific IP ranges.
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming soon</span>
        </div>
      </div>
    </div>
  )
}
