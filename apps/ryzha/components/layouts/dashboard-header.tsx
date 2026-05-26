"use client"

import { useSession, signOut } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import { User, LogOut, Zap, Loader2 } from "lucide-react"
import Link from "next/link"
import { OrganizationSwitcher } from "@/components/dashboard/org-switcher"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function DashboardHeader() {
  const { data: session } = useSession()
  const router = useRouter()
  const [lylaLaunching, setLylaLaunching] = useState(false)

  const initials = session?.user?.name
    ? session.user.name.split(" ").map(n => n[0]).join("").toUpperCase()
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
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex flex-1 items-center gap-4">
        <OrganizationSwitcher />
        {!session?.user?.organizationId && (
           <h2 className="text-lg font-semibold md:text-xl">
            {session?.user?.name ? `${session.user.name}'s Workspace` : "Dashboard"}
          </h2>
        )}
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
                <span className="hidden sm:inline">{lylaLaunching ? "Launching..." : "Lyla"}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>AI Accounting Co-pilot</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <NotificationBell />
        <ThemeToggle />
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex w-full items-center">
                <User className="mr-2 h-4 w-4" />
                <span>Your Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onSelect={(e) => {
                e.preventDefault()
                signOut({ callbackUrl: "/login" })
              }} 
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
