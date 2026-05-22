"use client"

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
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface LineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  amount: number
  isNew?: boolean
}

interface InvoiceBuilderProps {
  lineItems: LineItem[]
  setLineItems: (items: LineItem[]) => void
  onUpdateItem: (id: string, field: keyof LineItem, value: any) => void
  onRemoveItem: (id: string) => void
  onCloneItem: (item: LineItem) => void
}

function SortableRow({ 
  item, 
  onUpdate, 
  onRemove, 
  onClone 
}: { 
  item: LineItem
  onUpdate: (id: string, field: keyof LineItem, value: any) => void
  onRemove: (id: string) => void
  onClone: (item: LineItem) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  }

  return (
    <tr 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "group divide-x border-b transition-colors hover:bg-muted/50",
        isDragging && "bg-background shadow-lg",
        item.isNew && "animate-in fade-in fill-mode-both duration-1000 bg-yellow-50/50"
      )}
    >
      <td className="w-10 p-2 text-center">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="p-2">
        <Input
          value={item.description}
          onChange={(e) => onUpdate(item.id, "description", e.target.value)}
          className="border-transparent bg-transparent hover:border-input focus:border-input focus:bg-background h-8"
          placeholder="Description"
        />
      </td>
      <td className="p-2 w-24">
        <Input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdate(item.id, "quantity", parseFloat(e.target.value) || 0)}
          className="border-transparent bg-transparent hover:border-input focus:border-input focus:bg-background h-8 text-right"
        />
      </td>
      <td className="p-2 w-32">
        <Input
          type="number"
          value={item.unitPrice}
          onChange={(e) => onUpdate(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
          className="border-transparent bg-transparent hover:border-input focus:border-input focus:bg-background h-8 text-right"
        />
      </td>
      <td className="p-2 w-24">
        <Input
          type="number"
          value={item.taxRate}
          onChange={(e) => onUpdate(item.id, "taxRate", parseFloat(e.target.value) || 0)}
          className="border-transparent bg-transparent hover:border-input focus:border-input focus:bg-background h-8 text-right"
        />
      </td>
      <td className="p-2 w-32 text-right font-medium text-sm px-4">
        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.amount)}
      </td>
      <td className="p-2 w-24">
        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onClone(item)}
            aria-label="Clone item"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onRemove(item.id)}
            aria-label="Remove item"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  )
}

export function InvoiceBuilder({ 
  lineItems, 
  setLineItems, 
  onUpdateItem, 
  onRemoveItem, 
  onCloneItem 
}: InvoiceBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = lineItems.findIndex((i) => i.id === active.id)
      const newIndex = lineItems.findIndex((i) => i.id === over.id)
      setLineItems(arrayMove(lineItems, oldIndex, newIndex))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="rounded-md border bg-card">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b divide-x">
              <th className="w-10 p-2"></th>
              <th className="p-2 text-left font-medium text-muted-foreground">Description</th>
              <th className="p-2 text-right font-medium text-muted-foreground w-24">Qty</th>
              <th className="p-2 text-right font-medium text-muted-foreground w-32">Unit Price</th>
              <th className="p-2 text-right font-medium text-muted-foreground w-24">Tax %</th>
              <th className="p-2 text-right font-medium text-muted-foreground w-32">Amount</th>
              <th className="p-2 text-center font-medium text-muted-foreground w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            <SortableContext
              items={lineItems.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {lineItems.map((item) => (
                <SortableRow
                  key={item.id}
                  item={item}
                  onUpdate={onUpdateItem}
                  onRemove={onRemoveItem}
                  onClone={onCloneItem}
                />
              ))}
            </SortableContext>
          </tbody>
        </table>
      </div>
    </DndContext>
  )
}
