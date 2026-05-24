"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  link?: string
  read: boolean
  createdAt: string
}

const TYPE_DOT: Record<string, string> = {
  ERROR: "bg-destructive",
  WARNING: "bg-amber-500",
  SUCCESS: "bg-emerald-500",
  INFO: "bg-primary",
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch("/api/notifications")
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
          setUnreadCount(data.filter((n: any) => !n.read).length)
        }
      } catch {}
    }

    async function generateAndFetch() {
      try {
        await fetch("/api/notifications/generate", { method: "POST" })
      } catch {}
      await fetchNotifications()
    }

    generateAndFetch()
    const interval = setInterval(fetchNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  const markAsReadAndNavigate = async (notification: Notification) => {
    if (!notification.read) {
      const res = await fetch(`/api/notifications/${notification.id}/read`, { method: "PUT" }).catch(() => null)
      if (res?.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    }
    if (notification.link) router.push(notification.link)
  }

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read)
    await Promise.all(
      unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: "PUT" }).catch(() => null))
    )
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const unread = notifications.filter(n => !n.read)
  const read = notifications.filter(n => n.read)

  const displayed = showAll
    ? [...unread, ...read.slice(0, 5)]
    : unread.length > 0
      ? [...unread, ...read.slice(0, 5)]
      : read.slice(0, 5)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0 text-[10px]"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => { e.preventDefault(); setShowAll(v => !v) }}
              className={cn(
                "text-[10px] px-2 py-0.5 rounded-full border transition-colors",
                showAll
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              )}
            >
              {showAll ? "Unread only" : "All"}
            </button>
            {unreadCount > 0 && (
              <button
                onClick={(e) => { e.preventDefault(); markAllRead() }}
                className="text-[10px] text-muted-foreground hover:text-foreground px-2 py-0.5 rounded transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {displayed.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-muted-foreground">
              <Bell className="h-6 w-6 mb-2 opacity-30" />
              <p className="text-sm">All caught up</p>
            </div>
          ) : (
            displayed.map((notification) => (
              <button
                key={notification.id}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0",
                  !notification.read && "bg-primary/5"
                )}
                onClick={() => markAsReadAndNavigate(notification)}
              >
                <div className="mt-1.5 flex-shrink-0">
                  <span className={cn("block w-2 h-2 rounded-full", TYPE_DOT[notification.type] || "bg-primary")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("text-sm font-medium truncate", !notification.read ? "text-foreground" : "text-muted-foreground")}>
                      {notification.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 flex-shrink-0">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
