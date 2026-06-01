"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarSectionProps {
  label: string
  storageKey: string
  collapsed: boolean
  children: React.ReactNode
  defaultOpen?: boolean
}

export function SidebarSection({
  label,
  storageKey,
  collapsed,
  children,
  defaultOpen = true,
}: SidebarSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  React.useEffect(() => {
    const saved = localStorage.getItem(`sidebar-section-${storageKey}`)
    if (saved !== null) setOpen(JSON.parse(saved))
  }, [storageKey])

  const toggle = () => {
    const next = !open
    setOpen(next)
    localStorage.setItem(`sidebar-section-${storageKey}`, JSON.stringify(next))
  }

  if (collapsed) {
    return (
      <div className="py-1">
        <div className="border-t mx-2 my-2" />
        {children}
      </div>
    )
  }

  return (
    <div className="py-1">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
      >
        <span>{label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform duration-200", !open && "-rotate-90")}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}
