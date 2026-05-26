"use client"

import * as React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "./sidebar"
import { BottomNav } from "./bottom-nav"
import { Search, Zap, Loader2, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CommandPalette } from "@/components/ui/command-palette"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "next-auth/react"
import Link from "next/link"
import type { Session } from "next-auth"

interface MainLayoutProps {
  children: React.ReactNode
  session: Session | null
}

export function MainLayout({ children, session }: MainLayoutProps) {
  const router = useRouter()
  const [lylaLaunching, setLylaLaunching] = useState(false)

  const userInitials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "U"

  const launchLyla = () => {
    if (lylaLaunching) return
    setLylaLaunching(true)
    setTimeout(() => {
      router.push("/lyla")
      setLylaLaunching(false)
    }, 350)
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-full max-w-md hidden md:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <div
                onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
                className="flex items-center h-9 w-full pl-9 pr-3 rounded-md bg-muted/40 border border-transparent hover:bg-muted/60 hover:cursor-pointer focus-visible:ring-1 focus-visible:ring-primary/20 text-sm text-muted-foreground"
              >
                Search...
                <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={launchLyla}
                    className={cn(
                      "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 overflow-hidden group",
                      "bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500",
                      "text-white shadow-md shadow-violet-500/20 hover:shadow-violet-500/40",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      lylaLaunching && "opacity-80 scale-95"
                    )}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    {lylaLaunching
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Zap className="h-3.5 w-3.5" />
                    }
                    <span className="hidden sm:inline">{lylaLaunching ? "Launching..." : "Launch Lyla"}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>AI Accounting Co-pilot</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <NotificationBell />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{session?.user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(e) => { e.preventDefault(); signOut({ callbackUrl: "/login" }) }}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20 p-4 md:p-6">
          {children}
        </main>
      </div>
      <CommandPalette />
      <BottomNav />
    </div>
  )
}
