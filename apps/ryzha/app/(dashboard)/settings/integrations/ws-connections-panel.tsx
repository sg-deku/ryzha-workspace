"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Plus, Plug, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { CATEGORY_LABELS } from "@/lib/workflow-studio/connectors"

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  ERROR: "bg-red-100 text-red-700",
  PENDING: "bg-amber-100 text-amber-700",
}

export function WsConnectionsPanel() {
  const [connections, setConnections] = useState<any[]>([])
  const [connectors, setConnectors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ connectorId: "", name: "", config: "{}" })

  const fetchData = () => {
    Promise.all([
      fetch("/api/workflow-studio/connections").then((r) => r.json()),
      fetch("/api/workflow-studio/connectors").then((r) => r.json()),
    ]).then(([connxData, connData]) => {
      setConnections(connxData.connections ?? [])
      setConnectors((connData.connectors ?? []).filter((c: any) => c.authType !== "none"))
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])

  const handleAdd = async () => {
    if (!form.connectorId || !form.name) return toast.error("Connector and name are required")
    let configObj: Record<string, unknown> = {}
    try { configObj = JSON.parse(form.config) } catch { return toast.error("Config must be valid JSON") }
    setSaving(true)
    try {
      const res = await fetch("/api/workflow-studio/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectorId: form.connectorId, name: form.name, config: configObj }),
      })
      if (res.ok) {
        toast.success("Connection added")
        setDialogOpen(false)
        setForm({ connectorId: "", name: "", config: "{}" })
        fetchData()
      } else {
        const d = await res.json()
        toast.error(d.error || "Failed to add connection")
      }
    } catch { toast.error("Failed to add connection") }
    setSaving(false)
  }

  const selectedConnector = connectors.find((c) => c.id === form.connectorId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Workflow Connections</h3>
          <p className="text-sm text-muted-foreground">Authenticated connections used by Workflow Studio nodes.</p>
        </div>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add Connection
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading connections...
        </div>
      ) : connections.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Plug className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No connections yet. Add a connection to use authenticated actions in Workflow Studio.</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {connections.map((c) => (
            <div key={c.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{ backgroundColor: c.connector?.color || "#6366f1" }}
                >
                  {c.connector?.name?.slice(0, 1).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.connector?.name} · {CATEGORY_LABELS[c.connector?.category] ?? c.connector?.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {c.status === "ACTIVE" ? (
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <Badge className={STATUS_STYLES[c.status] ?? STATUS_STYLES.PENDING}>{c.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Connection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Connector</Label>
              <Select value={form.connectorId} onValueChange={(v) => setForm((f) => ({ ...f, connectorId: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a connector..." />
                </SelectTrigger>
                <SelectContent>
                  {connectors.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded flex items-center justify-center text-white text-[9px] font-bold shrink-0" style={{ backgroundColor: c.color }}>
                          {c.name.slice(0, 1)}
                        </div>
                        {c.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedConnector && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                <span className="font-semibold">Auth:</span> {selectedConnector.authType}
                {selectedConnector.authType === "apikey" && " — Add your API key in the config below."}
                {selectedConnector.authType === "oauth2" && " — OAuth2 connections will be supported shortly."}
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Connection Name</Label>
              <Input
                placeholder="e.g. Production Slack"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Config (JSON)</Label>
              <textarea
                className="w-full rounded-md border bg-background px-3 py-2 text-xs font-mono resize-none h-28 focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder={'{\n  "botToken": "xoxb-..."\n}'}
                value={form.config}
                onChange={(e) => setForm((f) => ({ ...f, config: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground">Stored as plain text — do not store highly sensitive credentials in production without enabling encryption.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Add Connection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
