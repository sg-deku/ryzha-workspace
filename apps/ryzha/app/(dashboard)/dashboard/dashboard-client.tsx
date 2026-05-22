"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Settings2, GripVertical } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { WidgetConfig, DEFAULT_WIDGET_CONFIG } from "@/lib/dashboard/widget-config"
import { DashboardLayoutEditor } from "./components/DashboardLayoutEditor"
import { KpiRowWidget } from "./components/widgets/KpiRowWidget"
import { AlertsRowWidget } from "./components/widgets/AlertsRowWidget"
import { CashFlowWidget } from "./components/widgets/CashFlowWidget"
import { AgentLogWidget } from "./components/widgets/AgentLogWidget"
import { AnomalyAlertsWidget } from "./components/widgets/AnomalyAlertsWidget"
import { RecentTransactionsWidget } from "./components/widgets/RecentTransactionsWidget"
import { RealTimePLWidget } from "./components/widgets/RealTimePLWidget"
import { AIUsageWidget } from "./components/widgets/AIUsageWidget"

interface DashboardClientProps {
  userName: string | null | undefined
  orgId: string | undefined
  pendingPurchases?: number
  overdueSales?: number
}

const PAIRED_WIDGETS = new Set(["cash_flow", "agent_log", "anomaly_alerts", "recent_transactions", "ai_usage"])

function renderWidgetContent(
  widget: WidgetConfig,
  props: { pendingPurchases: number; overdueSales: number },
  onSettingsChange: (id: string, settings: Record<string, any>) => void
) {
  switch (widget.id) {
    case "kpi_row":       return <KpiRowWidget />
    case "alerts_row":    return <AlertsRowWidget pendingPurchases={props.pendingPurchases} overdueSales={props.overdueSales} />
    case "real_time_pl":  return <RealTimePLWidget settings={widget.settings} onSettingsChange={(s) => onSettingsChange(widget.id, s)} />
    case "cash_flow":     return <CashFlowWidget />
    case "agent_log":     return <AgentLogWidget />
    case "anomaly_alerts":return <AnomalyAlertsWidget />
    case "recent_transactions": return <RecentTransactionsWidget />
    case "ai_usage":      return <AIUsageWidget />
    default:              return null
  }
}

function SortableWidget({
  widget,
  widgetProps,
  onSettingsChange,
  isDragging,
}: {
  widget: WidgetConfig
  widgetProps: { pendingPurchases: number; overdueSales: number }
  onSettingsChange: (id: string, settings: Record<string, any>) => void
  isDragging?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSelf } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSelf ? 0.4 : 1,
    position: "relative" as const,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className="absolute top-3 left-3 z-10 cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-muted-foreground transition-colors touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="pl-1">
        {renderWidgetContent(widget, widgetProps, onSettingsChange)}
      </div>
    </div>
  )
}

export function DashboardClient({
  userName,
  orgId,
  pendingPurchases = 0,
  overdueSales = 0,
}: DashboardClientProps) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGET_CONFIG)
  const [editorOpen, setEditorOpen] = useState(false)
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  useEffect(() => {
    fetch("/api/dashboard/layout")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.widgets) setWidgets(data.widgets) })
      .catch(() => {})
      .finally(() => setLayoutLoaded(true))
  }, [])

  const saveLayout = useCallback((newWidgets: WidgetConfig[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch("/api/dashboard/layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: newWidgets }),
      }).catch(() => {})
    }, 600)
  }, [])

  const handleSaveLayout = async (newWidgets: WidgetConfig[]) => {
    const res = await fetch("/api/dashboard/layout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgets: newWidgets }),
    })
    if (res.ok) {
      const data = await res.json()
      setWidgets(data.widgets)
    }
  }

  const handleSettingsChange = useCallback((id: string, settings: Record<string, any>) => {
    setWidgets((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, settings: { ...w.settings, ...settings } } : w))
      saveLayout(next)
      return next
    })
  }, [saveLayout])

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    setWidgets((prev) => {
      const oldIndex = prev.findIndex((w) => w.id === active.id)
      const newIndex = prev.findIndex((w) => w.id === over.id)
      const reordered = arrayMove(prev, oldIndex, newIndex).map((w, i) => ({ ...w, order: i + 1 }))
      saveLayout(reordered)
      return reordered
    })
  }

  const visible = [...widgets]
    .filter((w) => w.visible)
    .sort((a, b) => a.order - b.order)

  const widgetProps = { pendingPurchases, overdueSales }

  const rows: React.ReactNode[] = []
  let i = 0
  while (i < visible.length) {
    const w = visible[i]
    if (PAIRED_WIDGETS.has(w.id) && i + 1 < visible.length && PAIRED_WIDGETS.has(visible[i + 1].id)) {
      const w2 = visible[i + 1]
      rows.push(
        <div key={`pair-${w.id}-${w2.id}`} className="grid gap-6 lg:grid-cols-2">
          <SortableWidget widget={w} widgetProps={widgetProps} onSettingsChange={handleSettingsChange} />
          <SortableWidget widget={w2} widgetProps={widgetProps} onSettingsChange={handleSettingsChange} />
        </div>
      )
      i += 2
    } else {
      rows.push(
        <SortableWidget key={w.id} widget={w} widgetProps={widgetProps} onSettingsChange={handleSettingsChange} />
      )
      i++
    }
  }

  const activeWidget = activeId ? widgets.find((w) => w.id === activeId) : null

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {userName ? `Welcome, ${userName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="text-muted-foreground text-sm">Your financial overview at a glance</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => setEditorOpen(true)}>
          <Settings2 className="h-4 w-4" />
          Customize
        </Button>
      </div>

      {layoutLoaded ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={visible.map((w) => w.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-6">
              {rows}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeWidget ? (
              <div className="opacity-90 shadow-2xl rounded-xl ring-2 ring-primary/30">
                {renderWidgetContent(activeWidget, widgetProps, handleSettingsChange)}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      <DashboardLayoutEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        widgets={widgets}
        onSave={handleSaveLayout}
      />
    </div>
  )
}
