"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/workflow-studio/connectors"

const CATEGORY_COLORS: Record<string, string> = {
  finance: "text-indigo-600",
  crm: "text-orange-500",
  commerce: "text-violet-600",
  communication: "text-sky-600",
  data: "text-emerald-600",
  developer: "text-slate-600",
  logic: "text-amber-600",
}

interface CatalogItem {
  type: "trigger" | "action"
  connectorSlug: string
  connectorName: string
  connectorColor: string
  connectorCategory: string
  slug: string
  name: string
  description: string
  triggerId?: string
  actionId?: string
}

interface ConnectorCatalogPanelProps {
  connectors: any[]
  onDragStart: (item: CatalogItem) => void
}

export function ConnectorCatalogPanel({ connectors, onDragStart }: ConnectorCatalogPanelProps) {
  const [search, setSearch] = useState("")
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["finance", "developer", "logic"]))

  const items = useMemo<CatalogItem[]>(() => {
    const all: CatalogItem[] = []
    for (const c of connectors) {
      for (const t of c.triggers ?? []) {
        all.push({ type: "trigger", connectorSlug: c.slug, connectorName: c.name, connectorColor: c.color, connectorCategory: c.category, slug: t.slug, name: t.name, description: t.description, triggerId: t.id })
      }
      for (const a of c.actions ?? []) {
        all.push({ type: "action", connectorSlug: c.slug, connectorName: c.name, connectorColor: c.color, connectorCategory: c.category, slug: a.slug, name: a.name, description: a.description, actionId: a.id })
      }
    }
    return all
  }, [connectors])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((i) => i.name.toLowerCase().includes(q) || i.connectorName.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
  }, [items, search])

  const grouped = useMemo(() => {
    const map: Record<string, CatalogItem[]> = {}
    for (const item of filtered) {
      if (!map[item.connectorCategory]) map[item.connectorCategory] = []
      map[item.connectorCategory].push(item)
    }
    return map
  }, [filtered])

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Connector Catalog</p>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="pl-8 h-8 text-sm"
            placeholder="Search connectors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {CATEGORY_ORDER.filter((cat) => grouped[cat]?.length).map((cat) => (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className={CATEGORY_COLORS[cat]}>{CATEGORY_LABELS[cat] ?? cat}</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", !openCategories.has(cat) && "-rotate-90")} />
            </button>

            {openCategories.has(cat) && (
              <div className="space-y-0.5 mb-1">
                {grouped[cat].map((item) => (
                  <div
                    key={`${item.connectorSlug}-${item.type}-${item.slug}`}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/workflow-node", JSON.stringify(item))
                      e.dataTransfer.effectAllowed = "copy"
                      onDragStart(item)
                    }}
                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent cursor-grab active:cursor-grabbing transition-colors group"
                  >
                    <div
                      className="h-7 w-7 rounded-md shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-0.5"
                      style={{ backgroundColor: item.connectorColor }}
                    >
                      {item.connectorName.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium leading-tight truncate">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {item.connectorName} · {item.type === "trigger" ? "Trigger" : "Action"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No connectors match &quot;{search}&quot;
          </div>
        )}
      </div>
    </div>
  )
}
