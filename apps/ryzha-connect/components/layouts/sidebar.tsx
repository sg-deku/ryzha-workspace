"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Plug,
  GitMerge,
  InboxIcon,
  CheckSquare,
  Users,
  TrendingUp,
  BarChart2,
  Workflow,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LineChart,
  CalendarCheck,
  Cpu,
  Shield,
  Zap,
  BookOpen,
  PieChart,
  ListTree,
  Building2,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "",
    items: [
      { href: "/overview", icon: LayoutDashboard, label: "Overview" },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/connect",   icon: Plug,       label: "Connections"   },
      { href: "/staging",   icon: InboxIcon,  label: "Staging Queue" },
      { href: "/reconcile", icon: GitMerge,   label: "Reconcile"     },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/approvals",   icon: CheckSquare, label: "Approvals"   },
      { href: "/collections", icon: Users,       label: "Collections" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/metrics",          icon: LineChart,  label: "SaaS Metrics"    },
      { href: "/department-pl",    icon: Building2,  label: "Department P&L"  },
      { href: "/deferred-revenue", icon: Clock,      label: "Deferred Revenue" },
      { href: "/cash-forecast",    icon: TrendingUp, label: "Cash Forecast"   },
      { href: "/budget",           icon: PieChart,   label: "Budget"          },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/reports",   icon: BarChart2,   label: "Reports"         },
      { href: "/close",     icon: CalendarCheck, label: "Month-End Close" },
      { href: "/workflows", icon: Workflow,    label: "Workflows"       },
      { href: "/audit",     icon: ShieldCheck, label: "Audit Trail"     },
      { href: "/ai-usage",  icon: Zap,         label: "AI Monitoring"   },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/settings/architect", icon: Cpu,      label: "Architecture"       },
      { href: "/settings/policies",  icon: Shield,   label: "Policies"           },
      { href: "/coa-mapping",        icon: ListTree, label: "Chart of Accounts"  },
      { href: "/settings",           icon: Settings, label: "Settings"           },
      { href: "/docs",               icon: BookOpen, label: "Documentation"      },
    ],
  },
]

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname()
  const isActive =
    pathname === item.href ||
    (item.href !== "/settings" && pathname.startsWith(item.href + "/"))
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(
        "group flex items-center gap-2.5 rounded-lg py-2 text-sm transition-all duration-150",
        collapsed ? "justify-center px-2" : "px-3",
        isActive
          ? "border-l-2 border-primary bg-primary/6 text-foreground font-medium pl-[calc(0.75rem-2px)]"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground font-normal"
      )}
    >
      <Icon
        className={cn(
          "shrink-0 transition-colors",
          collapsed ? "h-4 w-4" : "h-4 w-4",
          isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  )
}

function AgentStatusFooter({ collapsed }: { collapsed: boolean }) {
  const [lastSync, setLastSync] = React.useState<string>("just now")

  React.useEffect(() => {
    const updateTime = () => {
      const stored = localStorage.getItem("rc-last-sync")
      if (stored) {
        const diff = Math.floor((Date.now() - parseInt(stored)) / 60000)
        if (diff < 1) setLastSync("just now")
        else if (diff < 60) setLastSync(`${diff}m ago`)
        else setLastSync(`${Math.floor(diff / 60)}h ago`)
      }
    }
    updateTime()
    const iv = setInterval(updateTime, 30000)
    return () => clearInterval(iv)
  }, [])

  if (collapsed) {
    return (
      <div className="border-t p-3 flex justify-center">
        <span className="status-dot-green" title={`Agents syncing · ${lastSync}`} />
      </div>
    )
  }

  return (
    <div className="border-t px-3 py-3">
      <div className="flex items-center gap-2">
        <span className="status-dot-green" />
        <span className="text-[11px] text-muted-foreground/60 truncate">
          Agents syncing · {lastSync}
        </span>
      </div>
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("rc-sidebar-collapsed")
    if (saved !== null) setCollapsed(JSON.parse(saved))
    setMounted(true)
  }, [])

  const toggle = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("rc-sidebar-collapsed", JSON.stringify(next))
  }

  if (!mounted) return null

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-200 shrink-0",
        collapsed ? "w-14" : "w-[220px]"
      )}
    >
      <div className="flex h-14 items-center border-b px-3 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/30">
            <span className="font-display font-bold text-primary-foreground text-[13px] tracking-tight">R</span>
          </div>
          {!collapsed && (
            <span className="font-display font-semibold text-[15px] tracking-tight truncate">ryzha</span>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={toggle}
            className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted transition-colors shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {navSections.map((section, si) => (
          <div key={si} className="space-y-0.5">
            {section.label && !collapsed && (
              <p className="px-3 pb-1 text-[9px] uppercase tracking-[0.15em] font-semibold text-muted-foreground/40 select-none">
                {section.label}
              </p>
            )}
            {section.items.map((item) => (
              <NavLink key={item.href} item={item} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>

      {collapsed && (
        <div className="border-t p-2">
          <button
            onClick={toggle}
            className="w-full h-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <AgentStatusFooter collapsed={collapsed} />
    </aside>
  )
}
