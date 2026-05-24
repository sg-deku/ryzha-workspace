"use client"

import * as React from "react"
import {
  FileText,
  Receipt,
  BarChart,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  UserCircle,
  Building,
  Brain,
  Truck,
  ShoppingCart,
  Workflow,
  Globe,
  FilePenLine,
  ArrowLeftRight,
  FileCheck,
  CreditCard,
  Landmark,
  Banknote,
  FileX,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SidebarItem } from "./sidebar-item"
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Authorized } from "@/components/auth/authorized"
import { ThemeToggle } from "@/components/theme-toggle"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export function Sidebar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [collapsed, setCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [ariaLaunching, setAriaLaunching] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setCollapsed(JSON.parse(saved))
    }
    setMounted(true)
  }, [])

  const toggleCollapse = () => {
    const newState = !collapsed
    setCollapsed(newState)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
  }

  const launchAria = () => {
    setAriaLaunching(true)
    setTimeout(() => {
      router.push("/aria")
      setAriaLaunching(false)
    }, 400)
  }

  if (!mounted) return null

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "flex h-screen flex-col border-r bg-background transition-all duration-300",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-16 items-center border-b px-4">
          <div className="flex items-center gap-2 font-bold">
            <div className="h-10 w-10 bg-primary logo-mask" />
            {!collapsed && <span className="text-xl">Ryzha</span>}
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
          <SidebarItem
            href="/dashboard"
            icon={LayoutDashboard}
            label="Dashboard"
            collapsed={collapsed}
          />

          {/* ACCOUNTING */}
          <div className="pt-4 pb-2 px-3">
            {!collapsed && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Accounting</span>}
            {collapsed && <div className="border-t mx-2" />}
          </div>

          <SidebarItem
            href="/transactions"
            icon={ArrowLeftRight}
            label="Transactions"
            collapsed={collapsed}
          />

          {/* ORDER-TO-CASH */}
          <div className="pt-4 pb-2 px-3">
            {!collapsed && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order-to-Cash</span>}
            {collapsed && <div className="border-t mx-2" />}
          </div>

          <SidebarItem
            href="/customers"
            icon={UserCircle}
            label="Customers"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/sales-orders"
            icon={Truck}
            label="Sales Orders"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/invoices"
            icon={FileText}
            label="Invoices"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/payments"
            icon={Banknote}
            label="Payments"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/credit-notes"
            icon={FileX}
            label="Credit Notes"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/contracts"
            icon={FilePenLine}
            label="Contracts"
            collapsed={collapsed}
          />

          {/* PROCURE-TO-PAY */}
          <div className="pt-4 pb-2 px-3">
            {!collapsed && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Procure-to-Pay</span>}
            {collapsed && <div className="border-t mx-2" />}
          </div>

          <SidebarItem
            href="/vendors"
            icon={Users}
            label="Vendors"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/purchases"
            icon={ShoppingCart}
            label="Purchase Orders"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/vendor-invoices"
            icon={FileCheck}
            label="Vendor Invoices"
            collapsed={collapsed}
          />
          <SidebarItem
            href="/expenses"
            icon={CreditCard}
            label="Expenses"
            collapsed={collapsed}
          />

          {/* REPORTING */}
          <div className="pt-4 pb-2 px-3">
            {!collapsed && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reporting</span>}
            {collapsed && <div className="border-t mx-2" />}
          </div>

          <SidebarItem
            href="/reports"
            icon={BarChart}
            label="Reports"
            collapsed={collapsed}
          />

          {/* ADMIN */}
          <Authorized permission="users:manage">
            <div className="pt-4 pb-2 px-3">
              {!collapsed && <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</span>}
              {collapsed && <div className="border-t mx-2" />}
            </div>

            <SidebarItem
              href="/settings/users"
              icon={Users}
              label="User Management"
              collapsed={collapsed}
            />
            <SidebarItem
              href="/workflow-studio"
              icon={Workflow}
              label="Workflow Studio"
              collapsed={collapsed}
            />
          </Authorized>

          <Authorized permission="org:manage">
            <SidebarItem
              href="/settings/organization"
              icon={Building}
              label="Organization"
              collapsed={collapsed}
            />
            <SidebarItem
              href="/settings/integrations"
              icon={Globe}
              label="Integrations"
              collapsed={collapsed}
            />
          </Authorized>

          <Authorized permission="financial:manage">
            <SidebarItem
              href="/settings/financial-engine"
              icon={Brain}
              label="Financial Engine"
              collapsed={collapsed}
            />
          </Authorized>
        </nav>

        <div className="border-t p-2 space-y-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={launchAria}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 group relative overflow-hidden",
                  "bg-gradient-to-r from-violet-600/90 to-indigo-600/90 hover:from-violet-500 hover:to-indigo-500",
                  "text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/40",
                  "hover:scale-[1.02] active:scale-[0.98]",
                  ariaLaunching && "animate-pulse scale-95",
                  collapsed && "justify-center px-0"
                )}
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Zap className={cn("h-4 w-4 flex-shrink-0", ariaLaunching && "animate-spin")} />
                {!collapsed && (
                  <span className="tracking-wide">
                    {ariaLaunching ? "Launching..." : "Launch Aria"}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">
                <p className="font-medium">Aria — AI Co-pilot</p>
              </TooltipContent>
            )}
          </Tooltip>

          <div className={cn("flex items-center", collapsed ? "justify-center" : "px-2 justify-between")}>
            {!collapsed && <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Appearance</span>}
            <ThemeToggle />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-full justify-center"
            onClick={toggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <div className="flex w-full items-center gap-3 px-1">
                <ChevronLeft className="h-5 w-5" />
                <span className="text-sm">Collapse</span>
              </div>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
