"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
  ReactFlowProvider,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft, Save, Play, Zap, Loader2, CheckCircle, XCircle,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { nanoid } from "nanoid"
import { CanvasNode } from "./canvas-node"
import { ConnectorCatalogPanel } from "./connector-catalog-panel"
import { NodeConfigPanel } from "./node-config-panel"

const nodeTypes = { canvasNode: CanvasNode }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  PAUSED: "bg-amber-100 text-amber-700",
}

function WorkflowCanvasInner({ workflowId }: { workflowId: string }) {
  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [rfInstance, setRfInstance] = useState<any>(null)

  const [workflow, setWorkflow] = useState<any>(null)
  const [workflowName, setWorkflowName] = useState("Untitled Workflow")
  const [workflowStatus, setWorkflowStatus] = useState("DRAFT")
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [connectors, setConnectors] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [running, setRunning] = useState(false)
  const [loadingWorkflow, setLoadingWorkflow] = useState(true)
  const [executionStatus, setExecutionStatus] = useState<"idle" | "success" | "failed">("idle")

  useEffect(() => {
    Promise.all([
      fetch(`/api/workflow-studio/workflows/${workflowId}`).then((r) => r.json()),
      fetch("/api/workflow-studio/connectors").then((r) => r.json()),
      fetch("/api/workflow-studio/connections").then((r) => r.json()),
    ]).then(([wfData, connData, connxData]) => {
      const wf = wfData.workflow
      if (wf) {
        setWorkflow(wf)
        setWorkflowName(wf.name)
        setWorkflowStatus(wf.status)
        setNodes(dbNodesToFlow(wf.nodes ?? []))
        setEdges(dbEdgesToFlow(wf.edges ?? []))
      }
      setConnectors(connData.connectors ?? [])
      setConnections(connxData.connections ?? [])
      setLoadingWorkflow(false)
    })
  }, [workflowId])

  const dbNodesToFlow = (dbNodes: any[]): Node[] =>
    dbNodes.map((n) => {
      const triggerOrAction = n.trigger ?? n.action
      const connector = triggerOrAction?.connector
      return {
        id: n.id,
        type: "canvasNode",
        position: { x: n.positionX, y: n.positionY },
        data: {
          label: n.label,
          nodeType: n.nodeType,
          connectorSlug: connector?.slug ?? "",
          connectorName: connector?.name ?? "",
          connectorColor: connector?.color ?? "#6366f1",
          connectorId: connector?.id ?? "",
          actionName: triggerOrAction?.name ?? n.label,
          inputSchema: triggerOrAction?.inputSchema ?? [],
          outputSchema: triggerOrAction?.outputSchema ?? {},
          config: n.config ?? {},
          triggerId: n.triggerId ?? null,
          actionId: n.actionId ?? null,
          connectionId: n.connectionId ?? null,
        },
      }
    })

  const dbEdgesToFlow = (dbEdges: any[]): Edge[] =>
    dbEdges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      sourceHandle: e.sourceHandle ?? "default",
      targetHandle: e.targetHandle ?? "default",
      label: e.label ?? undefined,
      animated: true,
    }))

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const raw = event.dataTransfer.getData("application/workflow-node")
      if (!raw || !rfInstance || !reactFlowWrapper.current) return

      const item = JSON.parse(raw)
      const bounds = reactFlowWrapper.current.getBoundingClientRect()
      const position = rfInstance.screenToFlowPosition({ x: event.clientX - bounds.left, y: event.clientY - bounds.top })

      const newNode: Node = {
        id: nanoid(),
        type: "canvasNode",
        position,
        data: {
          label: item.name,
          nodeType: item.type === "trigger" ? "TRIGGER" : (["condition", "transform", "loop", "delay", "stop"].includes(item.connectorSlug) ? "LOGIC" : "ACTION"),
          connectorSlug: item.connectorSlug,
          connectorName: item.connectorName,
          connectorColor: item.connectorColor,
          connectorId: "",
          actionName: item.name,
          inputSchema: [],
          outputSchema: {},
          config: {},
          triggerId: item.triggerId ?? null,
          actionId: item.actionId ?? null,
          connectionId: null,
        },
      }
      setNodes((nds) => nds.concat(newNode))
    },
    [rfInstance, setNodes]
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = "copy"
  }, [])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node)
  }, [])

  const handleNodeChange = useCallback((nodeId: string, changes: Partial<Node>) => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, ...changes, data: { ...n.data, ...(changes.data ?? {}) } } : n
      )
    )
    if (selectedNode?.id === nodeId) {
      setSelectedNode((prev) => prev ? { ...prev, ...changes, data: { ...prev.data, ...(changes.data ?? {}) } } : prev)
    }
  }, [setNodes, selectedNode])

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setSelectedNode(null)
  }, [setNodes, setEdges])

  const save = async () => {
    setSaving(true)
    try {
      const flowNodes = nodes.map((n) => ({
        id: n.id,
        nodeType: (n.data as any).nodeType,
        label: (n.data as any).label,
        triggerId: (n.data as any).triggerId ?? null,
        actionId: (n.data as any).actionId ?? null,
        connectionId: (n.data as any).connectionId ?? null,
        config: (n.data as any).config ?? {},
        positionX: n.position.x,
        positionY: n.position.y,
      }))

      const flowEdges = edges.map((e) => ({
        id: e.id,
        sourceNodeId: e.source,
        targetNodeId: e.target,
        sourceHandle: e.sourceHandle ?? "default",
        targetHandle: e.targetHandle ?? "default",
        label: (e.label as string) ?? null,
      }))

      const res = await fetch(`/api/workflow-studio/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workflowName, nodes: flowNodes, edges: flowEdges }),
      })

      if (res.ok) {
        toast.success("Workflow saved")
      } else {
        toast.error("Failed to save workflow")
      }
    } catch {
      toast.error("Failed to save workflow")
    } finally {
      setSaving(false)
    }
  }

  const testRun = async () => {
    setRunning(true)
    setExecutionStatus("idle")
    try {
      await save()
      const res = await fetch("/api/workflow-studio/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, triggerPayload: {} }),
      })
      const data = await res.json()
      if (res.ok) {
        setExecutionStatus("success")
        toast.success(`Test run completed — Execution ${data.executionId?.slice(0, 8)}`)
      } else {
        setExecutionStatus("failed")
        toast.error(data.error || "Execution failed")
      }
    } catch {
      setExecutionStatus("failed")
      toast.error("Execution failed")
    } finally {
      setRunning(false)
    }
  }

  const toggleStatus = async () => {
    const next = workflowStatus === "ACTIVE" ? "PAUSED" : "ACTIVE"
    const res = await fetch(`/api/workflow-studio/workflows/${workflowId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      setWorkflowStatus(next)
      toast.success(`Workflow ${next === "ACTIVE" ? "activated" : "paused"}`)
    }
  }

  const upstreamOutputSchemas = (() => {
    const schemas: Record<string, { nodeLabel: string; schema: Record<string, unknown> }> = {}
    for (const n of nodes) {
      const outputSchema = (n.data as any).outputSchema
      if (outputSchema && Object.keys(outputSchema).length > 0) {
        schemas[n.id] = { nodeLabel: (n.data as any).actionName ?? (n.data as any).label, schema: outputSchema }
      }
    }
    schemas["trigger"] = { nodeLabel: "Trigger", schema: {} }
    return schemas
  })()

  if (loadingWorkflow) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex items-center gap-3 px-4 h-14 border-b bg-background shrink-0">
        <Button variant="ghost" size="icon" onClick={() => router.push("/workflow-studio")} className="shrink-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <Input
          className="max-w-xs h-8 font-semibold border-transparent hover:border-border focus:border-border transition-colors"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          onBlur={save}
        />

        <Badge
          className={cn("cursor-pointer text-xs shrink-0", STATUS_COLORS[workflowStatus] ?? STATUS_COLORS.DRAFT)}
          onClick={toggleStatus}
        >
          {workflowStatus}
        </Badge>

        <div className="flex-1" />

        {executionStatus === "success" && <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />}
        {executionStatus === "failed" && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}

        <Button variant="outline" size="sm" onClick={testRun} disabled={running || saving}>
          {running ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
          Test Run
        </Button>

        <Button size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
          Save
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 shrink-0 border-r bg-background overflow-hidden flex flex-col">
          <ConnectorCatalogPanel connectors={connectors} onDragStart={() => {}} />
        </aside>

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setRfInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={() => setSelectedNode(null)}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background gap={16} size={1} />
            <Controls />
            <MiniMap nodeStrokeWidth={3} />
          </ReactFlow>

          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Zap className="h-8 w-8 text-primary/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Drag connectors from the left panel to start building</p>
              </div>
            </div>
          )}
        </div>

        {selectedNode && (
          <aside className="w-72 shrink-0 border-l bg-background overflow-hidden flex flex-col">
            <NodeConfigPanel
              node={selectedNode}
              connections={connections}
              upstreamOutputSchemas={upstreamOutputSchemas}
              onChange={handleNodeChange}
              onDelete={handleDeleteNode}
              onClose={() => setSelectedNode(null)}
            />
          </aside>
        )}
      </div>
    </div>
  )
}

export function WorkflowCanvas({ workflowId }: { workflowId: string }) {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner workflowId={workflowId} />
    </ReactFlowProvider>
  )
}
