"use client"

import * as React from "react"
import { Bell, Moon, Sun, Settings, LogOut, CheckCheck, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react"
import { useTheme } from "next-themes"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"

function BrandLogo() {
  return (
    <Link href="/overview" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity mr-4">
      <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
        <span className="font-display font-bold text-primary-foreground text-[12px] tracking-tight">R</span>
      </div>
      <span className="font-display font-semibold text-[15px] tracking-tight">ryzha</span>
    </Link>
  )
}

const ROUTE_LABELS: Record<string, string> = {
  "/overview":           "Overview",
  "/connect":            "Connections",
  "/staging":            "Staging Queue",
  "/reconcile":          "Reconcile",
  "/approvals":          "Approvals",
  "/collections":        "Collections",
  "/metrics":            "SaaS Metrics",
  "/department-pl":      "Department P&L",
  "/deferred-revenue":   "Deferred Revenue",
  "/cash-forecast":      "Cash Forecast",
  "/budget":             "Budget",
  "/reports":            "Reports",
  "/close":              "Month-End Close",
  "/workflows":          "Workflows",
  "/audit":              "Audit Trail",
  "/ai-usage":           "AI Monitoring",
  "/settings/architect": "Architecture",
  "/settings/policies":  "Policies",
  "/coa-mapping":        "Chart of Accounts",
  "/settings":           "Settings",
  "/docs":               "Documentation",
}

function getPageLabel(pathname: string): string {
  if (ROUTE_LABELS[pathname]) return ROUTE_LABELS[pathname]
  const base = "/" + pathname.split("/")[1]
  return ROUTE_LABELS[base] ?? pathname.split("/").pop()?.replace(/-/g, " ") ?? "Dashboard"
}

function avatarGradient(name?: string | null): string {
  const colors = [
    "from-violet-500 to-indigo-500",
    "from-blue-500 to-cyan-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-pink-500 to-rose-500",
    "from-fuchsia-500 to-purple-500",
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

function Avatar({ name }: { name?: string | null }) {
  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "U"
  const gradient = avatarGradient(name)
  return (
    <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-xs font-semibold text-white shrink-0 select-none shadow-sm`}>
      {initials}
    </div>
  )
}

function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors"
      >
        <Avatar name={name} />
        {name && (
          <span className="text-sm font-medium hidden sm:block max-w-[110px] truncate">
            {name.split(" ")[0]}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border bg-popover shadow-xl z-50 py-1 overflow-hidden">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold truncate">{name ?? "User"}</p>
            {email && <p className="text-xs text-muted-foreground truncate mt-0.5">{email}</p>}
          </div>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
          >
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}

interface NotificationItem {
  id: string
  type: string
  title: string
  message: string
  link?: string | null
  read: boolean
  createdAt: string
}

function typeIcon(type: string) {
  const map: Record<string, React.ElementType> = {
    INFO: Info, SUCCESS: CheckCircle2, WARNING: AlertTriangle, ERROR: XCircle,
  }
  return map[type] ?? Info
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    INFO: "text-blue-500", SUCCESS: "text-emerald-500", WARNING: "text-amber-500", ERROR: "text-red-500",
  }
  return map[type] ?? "text-muted-foreground"
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const ref = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  const fetchNotifications = React.useCallback(async () => {
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {}
  }, [])

  React.useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  React.useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center ring-2 ring-background leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] rounded-xl border bg-popover shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="btn-ghost text-xs py-1 px-2"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                <Bell className="h-7 w-7 text-muted-foreground/30 mb-1" />
                <p className="text-sm font-medium text-muted-foreground">All caught up</p>
                <p className="text-xs text-muted-foreground/60">Agent alerts will appear here</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => {
                  const Icon = typeIcon(n.type)
                  const color = typeColor(n.type)
                  return (
                    <button
                      key={n.id}
                      onClick={async () => {
                        if (!n.read) await markRead(n.id)
                        setOpen(false)
                        if (n.link) router.push(n.link)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-start gap-3 ${!n.read ? "bg-primary/3" : ""}`}
                    >
                      <div className={`h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`h-3.5 w-3.5 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-1.5">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0 mt-2" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function LiveSyncChip() {
  const [syncState, setSyncState] = React.useState<"syncing" | "synced" | "error">("synced")

  React.useEffect(() => {
    const stored = localStorage.getItem("rc-last-sync")
    if (!stored) return
    const diff = Date.now() - parseInt(stored)
    setSyncState(diff < 20 * 60 * 1000 ? "synced" : "error")
  }, [])

  return (
    <div className={`hidden md:flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border ${
      syncState === "synced" ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-900 dark:text-emerald-400"
      : syncState === "error" ? "bg-red-50 border-red-200 text-red-600 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400"
      : "bg-muted border-border text-muted-foreground"
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${syncState === "synced" ? "bg-emerald-500 animate-pulse" : syncState === "error" ? "bg-red-500" : "bg-muted-foreground"}`} />
      {syncState === "synced" ? "Live" : syncState === "error" ? "Sync issue" : "Syncing…"}
    </div>
  )
}

export function Header({ orgName }: { orgName?: string | null }) {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const pathname = usePathname()
  const pageLabel = getPageLabel(pathname ?? "")

  return (
    <header className="h-14 border-b bg-background/95 backdrop-blur-sm flex items-center justify-between px-5 shrink-0 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <BrandLogo />
        <div className="w-px h-4 bg-border shrink-0" />
        <h1 className="text-sm font-semibold truncate">{pageLabel}</h1>
        {orgName && (
          <span className="hidden lg:block text-xs text-muted-foreground/50 truncate">
            · {orgName}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <LiveSyncChip />

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <NotificationBell />

        <div className="w-px h-4 bg-border mx-1" />

        <UserMenu name={session?.user?.name} email={session?.user?.email} />
      </div>
    </header>
  )
}
