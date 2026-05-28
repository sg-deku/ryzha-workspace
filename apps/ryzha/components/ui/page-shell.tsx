import { type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface KpiCard {
  label: string
  value: string | number
  sub?: string
}

interface PageAction {
  label: string
  href?: string
  onClick?: () => void
  variant?: "default" | "outline" | "ghost"
  icon?: ReactNode
}

interface PageShellProps {
  title: string
  subtitle?: string
  newHref?: string
  newLabel?: string
  actions?: PageAction[]
  kpis?: KpiCard[]
  children: ReactNode
  className?: string
}

export function PageShell({
  title,
  subtitle,
  newHref,
  newLabel,
  actions = [],
  kpis,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("space-y-6 p-8 pt-6 animate-fade-in", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {actions.map((action, i) =>
            action.href ? (
              <Button key={i} variant={action.variant ?? "outline"} asChild>
                <Link href={action.href}>
                  {action.icon && <span className="mr-2">{action.icon}</span>}
                  {action.label}
                </Link>
              </Button>
            ) : (
              <Button key={i} variant={action.variant ?? "outline"} onClick={action.onClick}>
                {action.icon && <span className="mr-2">{action.icon}</span>}
                {action.label}
              </Button>
            )
          )}
          {newHref && (
            <Button asChild>
              <Link href={newHref}>
                <Plus className="mr-2 h-4 w-4" />
                {newLabel ?? `New ${title.replace(/s$/, "")}`}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {kpis && kpis.length > 0 && (
        <div className={cn("grid gap-4", `grid-cols-${Math.min(kpis.length, 4)}`)}>
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-1"
            >
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {kpi.label}
              </p>
              <p className="text-2xl font-bold">{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-muted-foreground">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {children}
    </div>
  )
}
