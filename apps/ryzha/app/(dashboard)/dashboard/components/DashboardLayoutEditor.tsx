"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { GripVertical, RotateCcw, Save } from "lucide-react"
import { WidgetConfig, WIDGET_META, DEFAULT_WIDGET_CONFIG } from "@/lib/dashboard/widget-config"

interface Props {
  open: boolean
  onClose: () => void
  widgets: WidgetConfig[]
  onSave: (widgets: WidgetConfig[]) => Promise<void>
}

function SortableWidgetRow({
  widget,
  onToggle,
}: {
  widget: WidgetConfig
  onToggle: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const meta = WIDGET_META[widget.id]

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{meta?.title ?? widget.id}</p>
        <p className="text-xs text-muted-foreground truncate">{meta?.description}</p>
      </div>
      <Switch
        checked={widget.visible}
        onCheckedChange={() => onToggle(widget.id)}
        aria-label={`Toggle ${meta?.title}`}
      />
      {!widget.visible && (
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">Hidden</Badge>
      )}
    </div>
  )
}

export function DashboardLayoutEditor({ open, onClose, widgets: initialWidgets, onSave }: Props) {
  const [widgets, setWidgets] = useState<WidgetConfig[]>(initialWidgets)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = widgets.findIndex((w) => w.id === active.id)
    const newIndex = widgets.findIndex((w) => w.id === over.id)
    setWidgets((prev) => arrayMove(prev, oldIndex, newIndex).map((w, i) => ({ ...w, order: i + 1 })))
  }

  const handleToggle = (id: string) => {
    setWidgets((prev) => prev.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)))
  }

  const handleReset = () => {
    setWidgets([...DEFAULT_WIDGET_CONFIG])
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(widgets)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Customize Dashboard</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Drag to reorder widgets. Toggle to show or hide them.
        </p>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={widgets.map((w) => w.id)} strategy={verticalListSortingStrategy}>
              {widgets.map((widget) => (
                <SortableWidgetRow key={widget.id} widget={widget} onToggle={handleToggle} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
        <DialogFooter className="gap-2 flex-row">
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1 mr-auto">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
