"use client"

import { Handle, Position, type NodeProps } from "@xyflow/react"
import { cn } from "@/lib/utils"
import { Zap, Settings, GitBranch, RefreshCw, Timer, Square, ArrowLeftRight, Repeat } from "lucide-react"

const LOGIC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  condition: GitBranch,
  transform: ArrowLeftRight,
  loop: Repeat,
  delay: Timer,
  stop: Square,
}

export function CanvasNode({ data, selected }: NodeProps) {
  const { label, connectorSlug, connectorName, connectorColor, nodeType, actionName, status } = data as any

  const isTrigger = nodeType === "TRIGGER"
  const isLogic = nodeType === "LOGIC"
  const LogicIcon = LOGIC_ICONS[connectorSlug] ?? Settings

  const statusColors: Record<string, string> = {
    COMPLETED: "ring-2 ring-emerald-500",
    FAILED: "ring-2 ring-red-500",
    RUNNING: "ring-2 ring-blue-400 animate-pulse",
  }

  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[240px] rounded-xl border bg-card shadow-sm transition-shadow",
        selected ? "shadow-lg ring-2 ring-primary" : "hover:shadow-md",
        status ? statusColors[status] : ""
      )}
    >
      {!isTrigger && (
        <Handle type="target" position={Position.Top} className="!bg-muted-foreground/50 !border-background !w-3 !h-3" />
      )}

      <div className="p-3 flex items-center gap-2.5">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-white text-xs font-bold"
          style={{ backgroundColor: connectorColor || "#6366f1" }}
        >
          {isLogic ? (
            <LogicIcon className="h-4 w-4" />
          ) : isTrigger ? (
            <Zap className="h-4 w-4" />
          ) : (
            <Settings className="h-3.5 w-3.5" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground leading-none mb-0.5">
            {isTrigger ? "Trigger" : connectorName || "Action"}
          </p>
          <p className="text-sm font-medium leading-tight truncate">{actionName || label}</p>
        </div>
      </div>

      {label && label !== actionName && (
        <div className="px-3 pb-2.5">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
      )}

      {connectorSlug === "condition" ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: "33%" }}
            className="!bg-emerald-500 !border-background !w-3 !h-3"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: "67%" }}
            className="!bg-red-500 !border-background !w-3 !h-3"
          />
          <div className="px-3 pb-2 flex justify-between text-[9px] text-muted-foreground font-medium">
            <span className="text-emerald-600">True</span>
            <span className="text-red-500">False</span>
          </div>
        </>
      ) : connectorSlug !== "stop" ? (
        <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground/50 !border-background !w-3 !h-3" />
      ) : null}
    </div>
  )
}
