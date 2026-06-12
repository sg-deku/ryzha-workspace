import { Sparkline } from "./sparkline"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  trend?: "up" | "down" | "neutral"
  sparkData?: number[]
  hero?: boolean
  className?: string
}

export function StatCard({
  label,
  value,
  sub,
  trend,
  sparkData,
  hero = false,
  className = "",
}: StatCardProps) {
  if (hero) {
    return (
      <div className={`rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-6 flex flex-col gap-4 ${className}`}>
        <div className="flex items-start justify-between gap-4">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {sparkData && sparkData.length > 1 && (
            <Sparkline data={sparkData} height={28} className="opacity-70" />
          )}
        </div>
        <div>
          <p className="text-4xl font-display font-bold tracking-tight num">{value}</p>
          {sub && (
            <p className={`text-xs mt-1.5 flex items-center gap-1 font-medium ${
              trend === "up" ? "text-emerald-600 dark:text-emerald-400"
              : trend === "down" ? "text-red-500 dark:text-red-400"
              : "text-muted-foreground"
            }`}>
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              {sub}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl border bg-card p-5 flex flex-col gap-2 transition-all hover:-translate-y-px hover:shadow-sm ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground leading-tight">{label}</p>
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} height={20} className="opacity-60 shrink-0" />
        )}
      </div>
      <p className="text-2xl font-semibold num">{value}</p>
      {sub && (
        <p className={`text-xs flex items-center gap-1 ${
          trend === "up" ? "text-emerald-600 dark:text-emerald-400"
          : trend === "down" ? "text-red-500 dark:text-red-400"
          : "text-muted-foreground"
        }`}>
          {trend === "up" && <TrendingUp className="h-3 w-3" />}
          {trend === "down" && <TrendingDown className="h-3 w-3" />}
          {sub}
        </p>
      )}
    </div>
  )
}
