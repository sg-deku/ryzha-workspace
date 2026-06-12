import * as React from "react"

interface PageHeaderProps {
  title: string
  description?: string
  right?: React.ReactNode
  meta?: React.ReactNode
}

export function PageHeader({ title, description, right, meta }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-display font-semibold tracking-tight truncate">{title}</h2>
          {meta}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5 leading-snug max-w-xl">
            {description}
          </p>
        )}
      </div>
      {right && <div className="flex items-center gap-2 shrink-0">{right}</div>}
    </div>
  )
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-3">
      {children}
    </p>
  )
}
