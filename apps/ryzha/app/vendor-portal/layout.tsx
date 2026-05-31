"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, FileText, CreditCard, User } from "lucide-react"

const NAV = [
  { href: "/vendor-portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor-portal/orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/vendor-portal/invoices", label: "Invoices", icon: FileText },
  { href: "/vendor-portal/payments", label: "Payments", icon: CreditCard },
  { href: "/vendor-portal/profile", label: "My Profile", icon: User },
]

export default function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname === "/vendor-portal/auth" || pathname === "/vendor-portal/expired") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">R</span>
            </div>
            <span className="font-semibold text-sm text-gray-800">Vendor Portal</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="md:hidden flex border-t overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium whitespace-nowrap",
                pathname.startsWith(href) ? "text-blue-700 border-b-2 border-blue-600" : "text-gray-500"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      <footer className="py-4 text-center text-xs text-gray-400 border-t bg-white">
        Powered by <span className="font-semibold text-gray-600">Ryzha</span>
      </footer>
    </div>
  )
}
