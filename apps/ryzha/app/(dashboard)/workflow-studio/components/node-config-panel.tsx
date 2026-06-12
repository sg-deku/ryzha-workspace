"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, ChevronRight, Database, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FieldSchema } from "@/lib/workflow-studio/types"

interface NodeConfigPanelProps {
  node: any
  connections: any[]
  upstreamOutputSchemas: Record<string, { nodeLabel: string; schema: Record<string, unknown> }>
  onChange: (nodeId: string, changes: Partial<any>) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

export function NodeConfigPanel({ node, connections, upstreamOutputSchemas, onChange, onDelete, onClose }: NodeConfigPanelProps) {
  const [pillPickerField, setPillPickerField] = useState<string | null>(null)
  const schema: FieldSchema[] = (node.data?.inputSchema as FieldSchema[]) ?? []

  const handleConfigChange = useCallback((key: string, value: string) => {
    const newConfig = { ...((node.data?.config as Record<string, string>) ?? {}), [key]: value }
    onChange(node.id, { data: { ...node.data, config: newConfig } })
  }, [node, onChange])

  const insertPill = (field: string, nodeSlug: string, fieldPath: string) => {
    const pill = `{{${nodeSlug}.${fieldPath}}}`
    const current = (node.data?.config as Record<string, string>)?.[field] ?? ""
    handleConfigChange(field, current + pill)
    setPillPickerField(null)
  }

  const matchingConnections = connections.filter((c) => c.connectorId === node.data?.connectorId)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="h-7 w-7 rounded-lg shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: node.data?.connectorColor || "#6366f1" }}
          >
            {(node.data?.connectorName || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground leading-none">{node.data?.connectorName}</p>
            <p className="text-sm font-semibold truncate">{node.data?.actionName}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <Label className="text-xs">Node Label</Label>
          <Input
            className="mt-1 h-8 text-sm"
            value={node.data?.label || ""}
            onChange={(e) => onChange(node.id, { data: { ...node.data, label: e.target.value } })}
          />
        </div>

        {matchingConnections.length > 0 && (
          <div>
            <Label className="text-xs">Connection</Label>
            <Select
              value={node.data?.connectionId || ""}
              onValueChange={(v) => onChange(node.id, { data: { ...node.data, connectionId: v } })}
            >
              <SelectTrigger className="mt-1 h-8 text-sm">
                <SelectValue placeholder="Select a connection..." />
              </SelectTrigger>
              <SelectContent>
                {matchingConnections.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {schema.length > 0 && (
          <div className="space-y-3 pt-1 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configuration</p>
            {schema.map((field) => {
              const configVal = (node.data?.config as Record<string, string>)?.[field.key] ?? ""
              return (
                <div key={field.key}>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </Label>
                    {field.supportsDataPills && Object.keys(upstreamOutputSchemas).length > 0 && (
                      <button
                        onClick={() => setPillPickerField(pillPickerField === field.key ? null : field.key)}
                        className="flex items-center gap-1 text-[10px] text-primary hover:underline"
                      >
                        <Database className="h-3 w-3" />
                        Insert data
                      </button>
                    )}
                  </div>

                  {pillPickerField === field.key && (
                    <DataPillPicker
                      schemas={upstreamOutputSchemas}
                      onInsert={(nodeSlug, path) => insertPill(field.key, nodeSlug, path)}
                    />
                  )}

                  {field.type === "select" ? (
                    <Select value={configVal} onValueChange={(v) => handleConfigChange(field.key, v)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === "textarea" ? (
                    <Textarea
                      className="text-sm font-mono text-xs resize-none"
                      rows={3}
                      placeholder={field.placeholder}
                      value={configVal}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={field.type === "password" ? "password" : field.type === "number" ? "number" : "text"}
                      className="h-8 text-sm"
                      placeholder={field.placeholder}
                      value={configVal}
                      onChange={(e) => handleConfigChange(field.key, e.target.value)}
                    />
                  )}

                  {field.helpText && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">{field.helpText}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(node.id)}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Delete
        </Button>
      </div>
    </div>
  )
}

function DataPillPicker({ schemas, onInsert }: {
  schemas: Record<string, { nodeLabel: string; schema: Record<string, unknown> }>
  onInsert: (nodeSlug: string, path: string) => void
}) {
  return (
    <div className="mb-2 rounded-lg border bg-muted/40 p-2 max-h-48 overflow-y-auto space-y-1">
      {Object.entries(schemas).map(([nodeSlug, { nodeLabel, schema }]) => (
        <div key={nodeSlug}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 mb-0.5">{nodeLabel}</p>
          {flattenSchema(schema).map((path) => (
            <button
              key={path}
              onClick={() => onInsert(nodeSlug, path)}
              className="flex items-center gap-1.5 w-full text-left px-2 py-1 rounded hover:bg-accent text-xs transition-colors"
            >
              <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="font-mono text-primary">{path}</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function flattenSchema(schema: Record<string, unknown>, prefix = ""): string[] {
  const paths: string[] = []
  for (const [k, v] of Object.entries(schema)) {
    const path = prefix ? `${prefix}.${k}` : k
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      paths.push(...flattenSchema(v as Record<string, unknown>, path))
    } else {
      paths.push(path)
    }
  }
  return paths
}
