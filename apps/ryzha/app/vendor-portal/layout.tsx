"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, ShoppingCart, FileText, CreditCard, User, Palette } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const NAV = [
  { href: "/vendor-portal/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor-portal/orders", label: "Purchase Orders", icon: ShoppingCart },
  { href: "/vendor-portal/invoices", label: "Invoices", icon: FileText },
  { href: "/vendor-portal/payments", label: "Payments", icon: CreditCard },
  { href: "/vendor-portal/profile", label: "My Profile", icon: User },
]

const THEMES = [
  { value: "theme-amethyst", label: "Amethyst" },
  { value: "theme-azure", label: "Azure" },
  { value: "theme-oasis", label: "Oasis" },
  { value: "theme-blush", label: "Blush" },
  { value: "theme-dune", label: "Dune" },
  { value: "theme-forge", label: "Forge" },
  { value: "theme-vertex", label: "Vertex" },
  { value: "theme-quantum", label: "Quantum" },
  { value: "theme-void", label: "Void" },
]

function PortalThemeToggle() {
  const { setTheme, theme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Palette className="h-4 w-4" />
          <span className="sr-only">Change theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Appearance</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {THEMES.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => setTheme(t.value)}
            className={cn("text-sm cursor-pointer", theme === t.value && "font-semibold text-primary")}
          >
            {t.label}
            {theme === t.value && <span className="ml-auto text-primary">✓</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => setTheme("system")} className="text-sm cursor-pointer">
          System Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/vendor-portal/auth" || pathname === "/vendor-portal/expired"

  if (isAuthPage) return <>{children}</>

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-primary logo-mask shrink-0" />
            <div className="leading-none">
              <span className="font-bold text-sm tracking-tight">Ryzha Vendeo</span>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Vendor Self-Service</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            ))}
          </nav>

          <PortalThemeToggle />
        </div>

        <nav className="md:hidden flex border-t overflow-x-auto bg-background">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium whitespace-nowrap flex-1",
                pathname.startsWith(href)
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      <footer className="py-4 text-center border-t bg-background">
        <p className="text-xs text-muted-foreground">
          Powered by <span className="font-semibold text-foreground">Ryzha Vendeo</span>
        </p>
      </footer>
    </div>
  )
}

export default function VendorPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="theme-amethyst"
      themes={["light", "dark", "system", "theme-amethyst", "theme-forge", "theme-vertex", "theme-quantum", "theme-void", "theme-oasis", "theme-azure", "theme-dune", "theme-blush"]}
      storageKey="vendeo-theme"
    >
      <PortalShell>{children}</PortalShell>
      <Toaster position="top-right" richColors />
    </ThemeProvider>
  )
}
