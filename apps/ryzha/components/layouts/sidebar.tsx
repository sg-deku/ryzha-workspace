"use client"

import * as React from "react"
import {
  LayoutDashboard,
  ArrowLeftRight,
  BookMarked,
  BookOpen,
  GitMerge,
  ListTree,
  CalendarDays,
  TrendingDown,
  DollarSign,
  BarChart2,
  UserCircle,
  Users,
  Package,
  Truck,
  FileText,
  Banknote,
  FileX,
  FilePenLine,
  ShoppingCart,
  FileCheck,
  CreditCard,
  FileMinus,
  ClipboardCheck,
  Layers,
  BarChart,
  ShieldCheck,
  Settings,
  Workflow,
  Globe,
  ChevronLeft,
  ChevronRight,
  Scale,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SidebarItem } from "./sidebar-item"
import { SidebarSection } from "./sidebar-section"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Authorized } from "@/components/auth/authorized"

export function Sidebar() {
  const [collapsed, setCollapsed] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) setCollapsed(JSON.parse(saved))
    setMounted(true)
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", JSON.stringify(next))
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
            <div className="h-10 w-10 bg-primary logo-mask shrink-0" />
            {!collapsed && <span className="text-xl">Ryzha</span>}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <SidebarItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />

          <SidebarSection label="Financials" storageKey="financials" collapsed={collapsed}>
            <SidebarItem href="/transactions" icon={ArrowLeftRight} label="Transactions" collapsed={collapsed} />
            <SidebarItem href="/journal-entries" icon={BookMarked} label="Journal Entries" collapsed={collapsed} />
            <SidebarItem href="/reports/general-ledger" icon={BookOpen} label="General Ledger" collapsed={collapsed} />
            <SidebarItem href="/chart-of-accounts" icon={ListTree} label="Chart of Accounts" collapsed={collapsed} />
            <SidebarItem href="/trial-balance" icon={Scale} label="Trial Balance" collapsed={collapsed} />
            <SidebarItem href="/accounting-periods" icon={CalendarDays} label="Accounting Periods" collapsed={collapsed} />
            <SidebarItem href="/bank-reconciliation" icon={GitMerge} label="Bank Reconciliation" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="Master Data" storageKey="master-data" collapsed={collapsed}>
            <SidebarItem href="/customers" icon={UserCircle} label="Customers" collapsed={collapsed} />
            <SidebarItem href="/vendors" icon={Users} label="Vendors" collapsed={collapsed} />
            <SidebarItem href="/products" icon={Package} label="Product Catalog" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="Order-to-Cash" storageKey="o2c" collapsed={collapsed}>
            <SidebarItem href="/sales-orders" icon={Truck} label="Sales Orders" collapsed={collapsed} />
            <SidebarItem href="/invoices" icon={FileText} label="Invoices" collapsed={collapsed} />
            <SidebarItem href="/payments" icon={Banknote} label="Payments Received" collapsed={collapsed} />
            <SidebarItem href="/credit-notes" icon={FileX} label="Credit Notes" collapsed={collapsed} />
            <SidebarItem href="/contracts" icon={FilePenLine} label="Contracts" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="Procure-to-Pay" storageKey="p2p" collapsed={collapsed}>
            <SidebarItem href="/purchases" icon={ShoppingCart} label="Purchase Orders" collapsed={collapsed} />
            <SidebarItem href="/vendor-invoices" icon={FileCheck} label="Vendor Invoices" collapsed={collapsed} />
            <SidebarItem href="/expenses" icon={CreditCard} label="Expenses" collapsed={collapsed} />
            <SidebarItem href="/payment-runs" icon={Layers} label="Payment Runs" collapsed={collapsed} />
            <SidebarItem href="/vendor-debit-memos" icon={FileMinus} label="Debit Memos" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="Assets & Planning" storageKey="assets-planning" collapsed={collapsed}>
            <SidebarItem href="/fixed-assets" icon={TrendingDown} label="Fixed Assets" collapsed={collapsed} />
            <SidebarItem href="/budgets" icon={BarChart2} label="Budgets" collapsed={collapsed} />
            <SidebarItem href="/fx-rates" icon={DollarSign} label="FX Rates" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="Approvals" storageKey="approvals" collapsed={collapsed}>
            <SidebarItem href="/approvals" icon={ClipboardCheck} label="Approvals" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="Reports" storageKey="reports" collapsed={collapsed}>
            <SidebarItem href="/reports" icon={BarChart} label="All Reports" collapsed={collapsed} />
            <SidebarItem href="/audit-log" icon={ShieldCheck} label="Audit Log" collapsed={collapsed} />
          </SidebarSection>

          <SidebarSection label="System" storageKey="system" collapsed={collapsed} defaultOpen={false}>
            <SidebarItem href="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
            <SidebarItem href="/settings/integrations" icon={Globe} label="Integrations" collapsed={collapsed} />
            <Authorized permission="financial:manage">
              <SidebarItem href="/workflow-studio" icon={Workflow} label="Workflow Studio" collapsed={collapsed} />
            </Authorized>
          </SidebarSection>
        </nav>

        <div className="border-t p-2">
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
