import * as React from "react"
import Link from "next/link"

interface EmptyStateProps {
  icon?: React.ElementType
  title: string
  description?: string
  action?: { label: string; href: string }
  secondaryAction?: { label: string; href: string }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className="h-12 w-12 rounded-2xl border bg-muted/50 flex items-center justify-center mb-4">
          <Icon className="h-5 w-5 text-muted-foreground/50" />
        </div>
      )}
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <Link href={action.href} className="btn-primary text-xs px-3 py-1.5">
              {action.label}
            </Link>
          )}
          {secondaryAction && (
            <Link href={secondaryAction.href} className="text-xs text-primary hover:underline">
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
