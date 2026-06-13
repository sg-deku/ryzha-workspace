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
  CreditCard,
  Database,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
}

interface NavSection {
  id: string
  label: string
  icon: React.ElementType
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    items: [
      { href: "/overview", icon: LayoutDashboard, label: "Overview" },
    ],
  },
  {
    id: "data",
    label: "Data",
    icon: Database,
    items: [
      { href: "/connect",   icon: Plug,      label: "Connections"   },
      { href: "/staging",   icon: InboxIcon, label: "Staging Queue" },
      { href: "/reconcile", icon: GitMerge,  label: "Reconcile"     },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: TrendingUp,
    items: [
      { href: "/metrics",          icon: LineChart,  label: "SaaS Metrics"    },
      { href: "/department-pl",    icon: Building2,  label: "Department P&L"  },
      { href: "/deferred-revenue", icon: Clock,      label: "Deferred Revenue" },
      { href: "/cash-forecast",    icon: TrendingUp, label: "Cash Forecast"   },
      { href: "/budget",           icon: PieChart,   label: "Budget"          },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    icon: CheckSquare,
    items: [
      { href: "/approvals",   icon: CheckSquare, label: "Approvals"   },
      { href: "/collections", icon: Users,       label: "Collections" },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: BarChart2,
    items: [
      { href: "/reports",   icon: BarChart2,     label: "Reports"          },
      { href: "/close",     icon: CalendarCheck, label: "Month-End Close"  },
      { href: "/workflows", icon: Workflow,      label: "Workflows"        },
      { href: "/audit",     icon: ShieldCheck,   label: "Audit Trail"      },
      { href: "/ai-usage",  icon: Zap,           label: "AI Monitoring"    },
    ],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    items: [
      { href: "/settings/architect", icon: Cpu,        label: "Architecture"       },
      { href: "/settings/policies",  icon: Shield,     label: "Policies"           },
      { href: "/coa-mapping",        icon: ListTree,   label: "Chart of Accounts"  },
      { href: "/settings/billing",   icon: CreditCard, label: "Billing"            },
      { href: "/settings",           icon: Settings,   label: "Settings"           },
      { href: "/docs",               icon: BookOpen,   label: "Documentation"      },
    ],
  },
]

function useSectionForPath(pathname: string): string | null {
  for (const section of navSections) {
    for (const item of section.items) {
      if (
        pathname === item.href ||
        (item.href !== "/settings" && pathname.startsWith(item.href + "/"))
      ) {
        return section.id
      }
    }
  }
  return null
}

function AgentStatusDot() {
  const [lastSync, setLastSync] = React.useState<string>("just now")

  React.useEffect(() => {
    const update = () => {
      const stored = localStorage.getItem("rc-last-sync")
      if (stored) {
        const diff = Math.floor((Date.now() - parseInt(stored)) / 60000)
        if (diff < 1) setLastSync("just now")
        else if (diff < 60) setLastSync(`${diff}m ago`)
        else setLastSync(`${Math.floor(diff / 60)}h ago`)
      }
    }
    update()
    const iv = setInterval(update, 30000)
    return () => clearInterval(iv)
  }, [])

  return (
    <div className="flex justify-center pb-4">
      <span className="status-dot-green" title={`Agents syncing · ${lastSync}`} />
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const activeSection = useSectionForPath(pathname)
  const [hoveredSection, setHoveredSection] = React.useState<string | null>(null)
  const [flyoutTop, setFlyoutTop] = React.useState<number>(0)
  const hoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const sectionRefs = React.useRef<Record<string, HTMLButtonElement | HTMLAnchorElement | null>>({})

  function openSection(id: string) {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    const el = sectionRefs.current[id]
    if (el) {
      const rect = el.getBoundingClientRect()
      setFlyoutTop(rect.top)
    }
    setHoveredSection(id)
  }

  function closeSection() {
    hoverTimerRef.current = setTimeout(() => setHoveredSection(null), 80)
  }

  function keepOpen() {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }

  const activeFlyoutSection = navSections.find((s) => s.id === hoveredSection) ?? null

  return (
    <>
      <aside className="flex h-screen w-14 flex-col border-r bg-background shrink-0 z-30">
        <div className="flex h-14 items-center justify-center border-b">
          <Link href="/overview" className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30 hover:opacity-90 transition-opacity">
            <span className="font-display font-bold text-primary-foreground text-[13px] tracking-tight">R</span>
          </Link>
        </div>

        <nav className="flex flex-col items-center gap-1 flex-1 py-3 overflow-y-auto">
          {navSections.map((section) => {
            const Icon = section.icon
            const isActive = activeSection === section.id
            const isHovered = hoveredSection === section.id

            if (section.items.length === 1) {
              const item = section.items[0]
              return (
                <Link
                  key={section.id}
                  href={item.href}
                  ref={(el) => { sectionRefs.current[section.id] = el }}
                  onMouseEnter={() => { if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current); setHoveredSection(null) }}
                  title={section.label}
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Link>
              )
            }

            return (
              <button
                key={section.id}
                type="button"
                ref={(el) => { sectionRefs.current[section.id] = el }}
                onMouseEnter={() => openSection(section.id)}
                onMouseLeave={closeSection}
                className={cn(
                  "h-9 w-9 rounded-lg flex items-center justify-center transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
                    : isHovered
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            )
          })}
        </nav>

        <AgentStatusDot />
      </aside>

      {activeFlyoutSection && (
        <div
          className="fixed z-50 pointer-events-auto"
          style={{ left: 56, top: flyoutTop }}
          onMouseEnter={keepOpen}
          onMouseLeave={closeSection}
        >
          <div className="ml-1 min-w-[180px] rounded-xl border bg-popover shadow-xl shadow-black/10 py-2 overflow-hidden">
            <p className="px-3 pt-1 pb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/50 select-none">
              {activeFlyoutSection.label}
            </p>
            {activeFlyoutSection.items.map((item) => {
              const Icon = item.icon
              const isItemActive =
                pathname === item.href ||
                (item.href !== "/settings" && pathname.startsWith(item.href + "/"))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setHoveredSection(null)}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                    isItemActive
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5 shrink-0", isItemActive ? "text-primary" : "")} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
